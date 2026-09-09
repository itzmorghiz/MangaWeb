export function isTauri() {
    return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

export const CLOUDFLARE_PROXY_URL = "https://de-cors.itzmorghiz.workers.dev";

import "./fetch"
import "./open"

export function removeShimmer(elem: HTMLElement) {
    elem.removeAttribute("shimmer")
}

const back = document.getElementById("back") as HTMLButtonElement | null

if (back) {
    back.addEventListener("click", () => {
        history.back()
    })
}