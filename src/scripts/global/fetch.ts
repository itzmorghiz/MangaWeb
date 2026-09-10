import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { CLOUDFLARE_PROXY_URL, isTauri } from "./global";

const isLocalDevUrl = (url: string) =>
  url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1");

const isTauriInternalUrl = (url: string) =>
  url.startsWith("http://ipc.localhost") ||
  url.startsWith("https://ipc.localhost") ||
  url.startsWith("http://tauri.localhost") ||
  url.startsWith("https://tauri.localhost");

const nativeFetch = window.fetch;

// Helper to reliably extract request options from Request | string | URL
async function parseRequestInput(input: RequestInfo | URL, init?: RequestInit) {
  let url = typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  let method = init?.method;
  let headers = new Headers(init?.headers);
  let body = init?.body;

  if (input instanceof Request) {
    method = method || input.method;
    if (!init?.headers) {
      input.headers.forEach((val, key) => {
        if (!headers.has(key)) headers.append(key, val);
      });
    }
    if (!body && input.method !== "GET" && input.method !== "HEAD") {
      body = await input.arrayBuffer(); // Buffer stream into ArrayBuffer for tauriFetch
    }
  }

  return { url, method: method || "GET", headers, body };
}

if (isTauri()) {
  window.fetch = async (input, init) => {
    const { url, method, headers, body } = await parseRequestInput(input, init);

    if (isTauriInternalUrl(url) || isLocalDevUrl(url)) {
      return nativeFetch(input, init);
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        // Convert Headers instance to plain record for plugin compatibility
        const headersRecord: Record<string, string> = {};
        headers.forEach((value, key) => {
          headersRecord[key] = value;
        });

        return await tauriFetch(url, {
          method,
          headers: headersRecord,
          body: body as BodyInit | null | undefined,
        });
      } catch (err) {
        console.error("[Tauri Fetch Error]:", err, "Fallback to native for URL:", url);
        return nativeFetch(input, init);
      }
    }

    return nativeFetch(input, init);
  };
} else {
  window.fetch = async (input, init) => {
    const { url } = await parseRequestInput(input, init);

    if (
      (url.startsWith("http://") || url.startsWith("https://")) &&
      !url.startsWith(CLOUDFLARE_PROXY_URL) &&
      !isLocalDevUrl(url)
    ) {
      const proxiedUrl = `${CLOUDFLARE_PROXY_URL}/?url=${encodeURIComponent(url)}`;

      // Construct fresh request options to prevent mode/origin header leakage
      const proxyInit: RequestInit = {
        ...init,
        method: input instanceof Request ? input.method : init?.method || "GET",
      };

      const response = await nativeFetch(proxiedUrl, proxyInit);

      Object.defineProperty(response, "url", {
        value: url,
        writable: false,
        configurable: true,
        enumerable: true,
      });

      return response;
    }

    return nativeFetch(input, init);
  };
}