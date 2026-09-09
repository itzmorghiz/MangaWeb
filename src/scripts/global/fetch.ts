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

if (isTauri()) {
  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : input.toString();

    if (isTauriInternalUrl(url) || isLocalDevUrl(url)) {
      return nativeFetch(input, init);
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
      try {
        let options = init;

        if (input instanceof Request && !init) {
          options = {
            method: input.method,
            headers: input.headers,
            body: input.body,
          };
        }

        return await tauriFetch(url, options);
      } catch (err) {
        console.error("[Tauri Fetch Error]:", err, "Fallback to native for URL:", url);
        return nativeFetch(input, init);
      }
    }

    return nativeFetch(input, init);
  };
} else {
  window.fetch = async (input, init) => {
    let targetUrl: string;

    if (typeof input === "string") {
      targetUrl = input;
    } else if (input instanceof Request) {
      targetUrl = input.url;
    } else {
      targetUrl = input.toString();
    }

    if (
      (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) &&
      !targetUrl.startsWith(CLOUDFLARE_PROXY_URL) &&
      !isLocalDevUrl(targetUrl)
    ) {
      const proxiedUrl = `${CLOUDFLARE_PROXY_URL}/?url=${encodeURIComponent(targetUrl)}`;

      let response: Response;

      if (input instanceof Request) {
        response = await nativeFetch(new Request(proxiedUrl, input), init);
      } else {
        response = await nativeFetch(proxiedUrl, init);
      }

      Object.defineProperty(response, "url", {
        value: targetUrl,
        writable: false,
        configurable: true,
        enumerable: true,
      });

      return response;
    }

    return nativeFetch(input, init);
  };
}