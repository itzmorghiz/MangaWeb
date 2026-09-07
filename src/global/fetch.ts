const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const CLOUDFLARE_PROXY_URL = "https://de-cors.itzmorghiz.workers.dev";

if (isTauri) {
  const nativeFetch = window.fetch;

  window.fetch = async (input, init) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof Request
          ? input.url
          : input.toString();

    if (url.startsWith("http://") || url.startsWith("https://")) {
      const { fetch: tauriFetch } = await import("@tauri-apps/plugin-http");
      return tauriFetch(input, init);
    }

    return nativeFetch(input, init);
  };
} else {
  const nativeFetch = window.fetch;

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
      !targetUrl.startsWith(CLOUDFLARE_PROXY_URL)
    ) {
      const proxiedUrl = `${CLOUDFLARE_PROXY_URL}/?url=${encodeURIComponent(targetUrl)}`;

      if (input instanceof Request) {
        return nativeFetch(new Request(proxiedUrl, input), init);
      }

      return nativeFetch(proxiedUrl, init);
    }

    return nativeFetch(input, init);
  };
}
