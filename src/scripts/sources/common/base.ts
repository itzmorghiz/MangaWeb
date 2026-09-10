import * as cheerio from "cheerio";
import { joinURL } from "ufo";

export enum ContentWarning {
  SFW,
  NSFW,
  MIXED,
}

export enum Languages {
  ALL,
  EN,
}

export const LANGUAGES_S: Record<Languages, string> = {
  0: "All",
  1: "En",
};

export type DocData = cheerio.CheerioAPI & { url: string };

export abstract class Source {
  public static debug = import.meta.env.VITE_DEBUG_SOURCES === "true";

  abstract name: string;
  abstract contentWarning: ContentWarning;
  abstract lang: Languages;
  abstract sources: string[];

  protected activeSources: string[] = [];
  private initPromise: Promise<void> | null = null;

  // Genera gli header base senza creare cicli infiniti
  protected getBaseHeaders(refererUrl?: string): Record<string, string> {
    return {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      ...(refererUrl ? { Referer: refererUrl } : {}),
    };
  }

  private formatLog(
    level: "INFO" | "WARN" | "ERR",
    action: "INIT" | "FETCH" | "CHECK",
    status: number | string,
    ms: number,
    target: string,
    extra?: unknown,
  ): void {
    if (!Source.debug) return;

    const timestamp = new Date().toISOString().substring(11, 23);
    const tag = `[${timestamp}][${this.name || "Source"}][${action}]`;
    const statusFormatted =
      typeof status === "number" ? `HTTP_${status}` : status;
    const latency = `${ms.toFixed(0)}ms`;

    const logMessage = `${tag} ${statusFormatted} (${latency}) -> ${target}`;

    if (level === "ERR") {
      console.error(logMessage, extra ?? "");
    } else if (level === "WARN") {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
  }

  private getErrorCode(err: unknown): string {
    if (err instanceof Error) {
      return (err as { code?: string }).code || err.name || "ERR_UNKNOWN";
    }
    return "ERR_UNKNOWN";
  }

  private isNetworkOrServerError(_err: unknown, status?: number): boolean {
    if (status !== undefined) {
      return status >= 500;
    }
    return true;
  }

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.performInit();
    }
    return this.initPromise;
  }

  private async performInit(): Promise<void> {
    for (const baseUrl of this.sources) {
      const t0 = performance.now();
      try {
        const res = await fetch(baseUrl, {
          method: "GET",
          headers: this.getBaseHeaders(baseUrl),
        });

        const ms = performance.now() - t0;

        if (res.ok) {
          this.formatLog("INFO", "CHECK", res.status, ms, baseUrl);
          this.activeSources = [
            baseUrl,
            ...this.sources.filter((s) => s !== baseUrl),
          ];
          return;
        }

        this.formatLog("WARN", "CHECK", res.status, ms, baseUrl);
      } catch (err) {
        const ms = performance.now() - t0;
        const code = this.getErrorCode(err);
        this.formatLog("ERR", "CHECK", code, ms, baseUrl, err);
      }
    }

    // Resettiamo initPromise in caso di fallimento totale per permettere ri-tentativi futuri
    this.initPromise = null;
    throw new Error(
      `[${this.name}] INIT_FAILED: No reachable domain in [${this.sources.join(", ")}]`,
    );
  }

  get primarySource(): string {
    if (this.activeSources.length === 0) {
      throw new Error(
        `[${this.name}] ERR_NOT_INITIALIZED: Call await .init() first.`,
      );
    }
    return this.activeSources[0];
  }

  public async getActiveSource(): Promise<string> {
    await this.init();
    return this.primarySource;
  }

  protected async fetchWithFallback(
    relativePath: string,
    customHeaders?: Record<string, string>,
  ): Promise<Response> {
    await this.init();

    let lastErrorCode = "ERR_UNKNOWN";

    for (let i = 0; i < this.activeSources.length; i++) {
      const baseUrl = this.activeSources[i];
      const targetUrl = joinURL(baseUrl, relativePath);
      const t0 = performance.now();

      try {
        const response = await fetch(targetUrl, {
          method: "GET",
          headers: {
            ...this.getBaseHeaders(baseUrl),
            ...customHeaders,
          },
        });

        const ms = performance.now() - t0;

        if (response.ok) {
          this.formatLog("INFO", "FETCH", response.status, ms, targetUrl);

          if (i > 0) {
            this.activeSources.splice(i, 1);
            this.activeSources.unshift(baseUrl);
          }

          return response;
        }

        this.formatLog("WARN", "FETCH", response.status, ms, targetUrl);

        if (!this.isNetworkOrServerError(null, response.status)) {
          return response;
        }

        lastErrorCode = `HTTP_${response.status}`;
      } catch (err) {
        const ms = performance.now() - t0;
        lastErrorCode = this.getErrorCode(err);
        this.formatLog("ERR", "FETCH", lastErrorCode, ms, targetUrl, err);
      }
    }

    throw new Error(
      `[${this.name}] FETCH_FAILED -> ${relativePath} [Code: ${lastErrorCode}]`,
    );
  }

  protected async fetchDocument(
    relativePath: string,
    customHeaders?: Record<string, string>,
  ): Promise<DocData> {
    const res = await this.fetchWithFallback(relativePath, customHeaders);

    if (!res.ok) {
      throw new Error(`[${this.name}] HTTP_${res.status} on ${relativePath}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html) as DocData;
    $.url = res.url;

    return $;
  }
}