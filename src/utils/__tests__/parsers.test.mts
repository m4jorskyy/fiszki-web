import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseTagsInput } from "../tags.ts";
import { formatCountdown, sanitizeFilename } from "../formatters.ts";

describe("parseTagsInput", () => {
  it("splits by comma and semicolon and trims whitespace", () => {
    assert.deepEqual(parseTagsInput(" go, concurrency ;  async , "), [
      "go",
      "concurrency",
      "async",
    ]);
  });

  it("returns empty array for blank input", () => {
    assert.deepEqual(parseTagsInput("   "), []);
  });
});

describe("formatters", () => {
  it("formats countdown durations", () => {
    assert.equal(formatCountdown(0), "00:00");
    assert.equal(formatCountdown(65_000), "01:05");
    assert.equal(formatCountdown(3_720_000), "1h 02m");
    assert.equal(formatCountdown(3 * 24 * 3600 * 1000), "3d");
  });

  it("sanitizes deck filenames", () => {
    assert.equal(sanitizeFilename("Hiszpański B2!"), "hiszpaski-b2");
    assert.equal(sanitizeFilename("   ", "fallback"), "fallback");
  });
});
