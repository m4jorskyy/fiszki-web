import type { DeckExportFormat, ImportDeckResponse } from "@/types";
import { request } from "../client";

export async function importDeck(
  deckID: string,
  format: DeckExportFormat,
  rawContent: string
): Promise<ImportDeckResponse> {
  const contentType =
    format === "csv" ? "text/csv; charset=utf-8" : "application/json";
  return request<ImportDeckResponse>(
    `/api/v1/decks/${encodeURIComponent(deckID)}/import?format=${format}`,
    {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: rawContent,
    }
  );
}
