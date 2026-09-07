import { KaliScanSource } from "./sources/en/kaliscan.com/source";
import "./global/fetch";

const kaliScanSource = new KaliScanSource();

const details = await kaliScanSource.getMangaDetails("42187-jinx");
document.body.innerHTML += JSON.stringify(details);

const img = document.createElement("img") as HTMLImageElement;
img.src = details.thumbnail_url || "";
document.body.append(img);
