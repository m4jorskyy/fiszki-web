import type { Card, CardInput } from "@/types";
import { request } from "../client";

export async function updateCard(
  cardID: string,
  input: CardInput
): Promise<Card> {
  return request<Card>(`/api/v1/cards/${encodeURIComponent(cardID)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
