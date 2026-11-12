import type { StudyStatsOverview } from "@/types";
import { request } from "../client";

export async function getStatsOverview(): Promise<StudyStatsOverview> {
  return request<StudyStatsOverview>("/api/v1/stats/overview");
}
