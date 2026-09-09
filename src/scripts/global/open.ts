import { isTauri } from "@global";
import { open } from "@tauri-apps/plugin-shell";

if (isTauri()) {
    window.open = ((url?: string | URL, _target?: string, _features?: string) => {
        if (url) {
            open(url.toString()).catch((err) => {
                console.error(`Error opening new window in Tauri: ${url}`, err);
            });
        }
        return null;
    }) as typeof window.open;
}