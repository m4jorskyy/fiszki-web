import type { Rating, SubmitReviewResponse } from "@/types";
import { request } from "../client";

export async function submitReview(
  cardID: string,
  rating: Rating
): Promise<SubmitReviewResponse> {
  return request<SubmitReviewResponse>(
    `/api/v1/study/cards/${encodeURIComponent(cardID)}/review`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    }
  );
}
