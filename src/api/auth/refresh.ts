import type { StoredSession } from "@/types";
import { performTokenRefresh } from "../client";

export async function refresh(): Promise<StoredSession | null> {
  return performTokenRefresh();
}
