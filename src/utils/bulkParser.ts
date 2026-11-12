import type { CardInput } from "../types";
import { parseTagsInput } from "./tags";

/**
 * Parse multi-line bulk card text formatted as `Front | Back | tag1, tag2` or tab-separated.
 */
export function parseBulkCardsText(raw: string): CardInput[] {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const inputs: CardInput[] = [];
  for (const line of lines) {
    const parts = line.includes("|") ? line.split("|") : line.split("\t");
    if (parts.length < 2) continue;

    const front = parts[0].trim();
    const back = parts[1].trim();
    if (!front || !back) continue;

    const parsedTags = parts[2] ? parseTagsInput(parts[2]) : [];
    inputs.push({
      front,
      back,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    });
  }

  return inputs;
}
