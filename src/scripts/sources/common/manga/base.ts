import { Source } from "../base";

export interface SManga {
  url: string;
  title: string;
  alt_title?: string;
  authors?: string[];
  description?: string;
  genres?: string[];
  status: MangaStatus;
  thumbnail_url?: string;
}

export interface MangaSearchEntry {
  id: string;
  title: string;
  thumbnail_url?: string;
}

export enum MangaStatus {
  UNKNOWN,
  ONGOING,
  COMPLETED,
  LICENSED,
  ON_HIATUS,
  CANCELLED,
}

export const MANGA_STATUS_S: Record<MangaStatus, string> = {
  0: "Unknown",
  1: "Ongoing",
  2: "Completed",
  3: "Licensed",
  4: "On hiatus",
  5: "Cancelled"
}

export interface SChapter {
  url: string;
  name: string;
  date_upload: number;
  chapter_number?: number;
}

export interface Page {
  index: number;
  url: string;
  imageUrl?: string;
}

export interface MangasPage {
  mangas: SManga[];
  hasNextPage: boolean;
}

export abstract class MangaSource extends Source {
  fetchPage(path: string, headers?: Record<string, string>) {
    return this.fetchDocument(path, headers);
  }

  abstract getMangaDetails(id: string): Promise<SManga>;

  abstract searchMangas(query: string, page: number): Promise<MangaSearchEntry[]>
}