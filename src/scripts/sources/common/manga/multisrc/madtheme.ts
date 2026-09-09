import { CheerioAPI } from "cheerio";
import { MangaSearchEntry, MangaSource, MangaStatus, SManga } from "../base";
import { parseFilename } from "ufo";

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

    const meta = this.getMeta(page)

    if (meta.authors.length > 0) {
      manga.authors = meta.authors
    }

    const desc = page(".section-body.summary p:not(.readmore)").text().trim()

    if (desc.length > 0) {
      manga.description = desc
    }

    return manga;
  }

  private getStatus(page: CheerioAPI) {
    const text = page(
      ".book-details .book-info .meta.box p:nth-child(2) a span",
    ).text();

    switch (text.toLowerCase()) {
      case "completed":
        return MangaStatus.COMPLETED;
      case "ongoing":
        return MangaStatus.ONGOING;
      default:
        return MangaStatus.UNKNOWN;
    }
  }

  private getMeta(page: CheerioAPI) {
    const meta = page.extract({
      "authors": [
        {
          selector: ".book-info .detail .meta.box:nth-child(2) p:nth-child(1) a span",
          value: "innerText"
        }
      ]
    })

    return meta
  }

  async searchMangas(query: string, nPage = 1): Promise<MangaSearchEntry[]> {
    const page = await this.fetchPage("/search?q=" + query + "&page=" + nPage);

    const data = page.extract({
      "title": [
        {
          selector: ".list.manga-list .book-item .meta .title",
          value: "innerText"
        }
      ],

      "url": [
        {
          selector: ".list.manga-list .book-item .meta .title a",
          value: "href"
        }
      ],

      "cover": [
        {
          selector: ".list.manga-list .book-item .thumb img",
          value: "data-src"
        }
      ]
    })

    const mangas: MangaSearchEntry[] = []

    for (let i = 0; i < data.title.length; i++) {
      const manga: MangaSearchEntry = {
        title: data.title[i].trim(),
        id: parseFilename(data.url[i])!,
        thumbnail_url: data.cover[i]
      }

      mangas.push(manga)
    }

    return mangas
  }
}
