import { request } from "../client";

export async function deleteCard(cardID: string): Promise<void> {
  return request<void>(`/api/v1/cards/${encodeURIComponent(cardID)}`, {
    method: "DELETE",
  });
}
