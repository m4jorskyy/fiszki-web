import type { Card } from "@/types";
import { request } from "../client";

export async function getCard(cardID: string): Promise<Card> {
  return request<Card>(`/api/v1/cards/${encodeURIComponent(cardID)}`);
}
