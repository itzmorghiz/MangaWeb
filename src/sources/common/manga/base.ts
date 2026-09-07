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

export enum MangaStatus {
  UNKNOWN,
  ONGOING,
  COMPLETED,
  LICENSED,
  ON_HIATUS,
  CANCELLED,
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
}
