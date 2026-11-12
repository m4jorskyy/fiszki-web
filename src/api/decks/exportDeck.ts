import type { DeckExportFormat } from "@/types";
import { triggerBlobDownload } from "@/utils/download";
import { sanitizeFilename } from "@/utils/formatters";
import { requestBlob } from "../client";

export async function exportDeck(
  deckID: string,
  deckName: string,
  format: DeckExportFormat
): Promise<void> {
  const blob = await requestBlob(
    `/api/v1/decks/${encodeURIComponent(deckID)}/export?format=${format}`,
    { method: "GET" }
  );
  const safeName = sanitizeFilename(deckName);
  triggerBlobDownload(blob, `${safeName}.${format}`);
}
