import { ContentWarning, Languages } from "../../common/base";
import { MadThemeMangaSource } from "../../common/manga/multisrc/madtheme";

export class KaliScanSource extends MadThemeMangaSource {
  name = "KaliScan";
  contentWarning = ContentWarning.MIXED;

  lang = Languages.EN;

  sources = [
    "https://kaliscan.com",
    "https://kaliscan.me",
    "https://kaliscan.io",
    "https://mgjinx.com",
  ];
}
