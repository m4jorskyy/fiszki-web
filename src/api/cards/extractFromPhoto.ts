import type { ExtractFromPhotoResponse, ExtractedCardCandidate } from "@/types";
import { request } from "../client";

export async function extractFromPhoto(
  file: File
): Promise<ExtractFromPhotoResponse> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await request<{
    count: number;
    cards: ExtractedCardCandidate[] | null;
  }>("/api/v1/cards/extract-from-photo", {
    method: "POST",
    body: formData,
  });

  return {
    count: res.count ?? 0,
    cards: res.cards ?? [],
  };
}
