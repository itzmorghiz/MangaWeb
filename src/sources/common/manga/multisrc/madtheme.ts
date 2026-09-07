import { CheerioAPI } from "cheerio";
import { MangaSource, MangaStatus, SManga } from "../base";

export abstract class MadThemeMangaSource extends MangaSource {
  async getMangaDetails(id: string) {
    const page = await this.fetchPage("/manga/" + id);

    const manga: SManga = {
      url: page.url,
      title: page(".book-details .book-info .name.box :first-child").text(),
      status: this.getStatus(page),
    };

    const alt_title = page(
      ".book-details .book-info .name.box :nth-child(2)",
    ).text();

    if (alt_title.length > 0) {
      manga.alt_title = alt_title;
    }

    const cover_attr = page("#cover .img-cover img").attr();
    const thumbnail_url = cover_attr
      ? cover_attr["data-src"] || undefined
      : undefined;

    if (thumbnail_url) {
      manga.thumbnail_url = thumbnail_url;
    }

    return manga;
  }

  private getStatus(page: CheerioAPI) {
    const text = page(
      ".book-details .book-info .meta.box p:nth-child(2) a span",
    ).text();
    console.log(text);

    switch (text.toLowerCase()) {
      case "completed":
        return MangaStatus.COMPLETED;
      case "ongoing":
        return MangaStatus.ONGOING;
      default:
        return MangaStatus.UNKNOWN;
    }
  }
}
