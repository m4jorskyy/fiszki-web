import { NextRequest, NextResponse } from "next/server";

const ENV_NAME =
  process.env.ENV_NAME || process.env.NEXT_PUBLIC_DEFAULT_ENV || "prod";
const PROD_API_URL =
  process.env.FISZKI_PROD_API_URL || "http://localhost:8080";
const STAGING_API_URL =
  process.env.FISZKI_STAGING_API_URL || "http://localhost:8081";

const MAX_PHOTO_BYTES = 21 * 1024 * 1024; // 21 MB (matches fiszki-server 20 MB photo limit + multipart overhead)
const MAX_DEFAULT_BYTES = 2 * 1024 * 1024; // 2 MB for JSON / CSV / auth requests

function resolveBackendBaseUrl(): string {
  if (process.env.FISZKI_API_URL) {
    return process.env.FISZKI_API_URL.replace(/\/+$/, "");
  }
  if (ENV_NAME === "staging") {
    return STAGING_API_URL.replace(/\/+$/, "");
  }
  return PROD_API_URL.replace(/\/+$/, "");
}

function isAllowedProxyPath(pathSegments: string[], subPath: string): boolean {
  if (pathSegments.length === 0) return false;
  for (const seg of pathSegments) {
    if (
      !seg ||
      seg === "." ||
      seg === ".." ||
      seg.includes("\\") ||
      seg.includes("/") ||
      seg.includes("\0")
    ) {
      return false;
    }
  }
  return subPath === "healthz" || subPath.startsWith("api/v1/");
}

async function readBoundedBody(
  req: NextRequest,
  maxBytes: number
): Promise<{ body?: Uint8Array; tooLarge: boolean }> {
  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader) {
    const declaredLength = Number(contentLengthHeader);
    if (!Number.isNaN(declaredLength) && declaredLength > maxBytes) {
      return { tooLarge: true };
    }
  }

  if (!req.body) {
    return { body: undefined, tooLarge: false };
  }

  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          return { tooLarge: true };
        }
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (totalBytes === 0) {
    return { body: undefined, tooLarge: false };
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body: merged, tooLarge: false };
}

async function fetchUpstream(
  baseUrl: string,
  subPath: string,
  search: string,
  method: string,
  headers: Headers,
  body: BodyInit | undefined
): Promise<{ upstream: Response; usedBaseUrl: string; latencyMs: number }> {
  const startedAt = Date.now();
  try {
    const upstream = await fetch(`${baseUrl}/${subPath}${search}`, {
      method,
      headers,
      body,
      cache: "no-store",
    });
    return {
      upstream,
      usedBaseUrl: baseUrl,
      latencyMs: Date.now() - startedAt,
    };
  } catch (err) {
    // Only in local dev: if :8081 is not running locally, fall back to :8080
    if (
      process.env.NODE_ENV !== "production" &&
      baseUrl === "http://localhost:8081"
    ) {
      const fallbackUrl = "http://localhost:8080";
      const upstream = await fetch(`${fallbackUrl}/${subPath}${search}`, {
        method,
        headers,
        body,
        cache: "no-store",
      });
      return {
        upstream,
        usedBaseUrl: fallbackUrl,
        latencyMs: Date.now() - startedAt,
      };
    }
    throw err;
  }
}

async function handleProxy(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  const { path } = await context.params;
  const subPath = path.join("/");

  if (!isAllowedProxyPath(path, subPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const baseUrl = resolveBackendBaseUrl();
  const search = req.nextUrl.search || "";

  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) {
    headers.set("Authorization", auth);
  }
  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }
  const accept = req.headers.get("accept");
  if (accept) {
    headers.set("Accept", accept);
  }

  let body: BodyInit | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const maxBytes =
      subPath === "api/v1/cards/extract-from-photo"
        ? MAX_PHOTO_BYTES
        : MAX_DEFAULT_BYTES;

    const bounded = await readBoundedBody(req, maxBytes);
    if (bounded.tooLarge) {
      return NextResponse.json(
        { error: "Request payload too large" },
        { status: 413 }
      );
    }
    if (bounded.body) {
      body = bounded.body.buffer.slice(
        bounded.body.byteOffset,
        bounded.body.byteOffset + bounded.body.byteLength
      ) as ArrayBuffer;
    }
  }

  try {
    const { upstream, usedBaseUrl, latencyMs } = await fetchUpstream(
      baseUrl,
      subPath,
      search,
      req.method,
      headers,
      body
    );

    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get("content-type");
    if (upstreamContentType) {
      responseHeaders.set("Content-Type", upstreamContentType);
    }
    const contentDisposition = upstream.headers.get("content-disposition");
    if (contentDisposition) {
      responseHeaders.set("Content-Disposition", contentDisposition);
    }
    responseHeaders.set("x-fiszki-target", usedBaseUrl);
    responseHeaders.set("x-fiszki-latency-ms", String(latencyMs));

    if (upstream.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: responseHeaders,
      });
    }

    const respBuffer = await upstream.arrayBuffer();
    return new NextResponse(respBuffer, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reach fiszki-server";

    return NextResponse.json(
      {
        error: `Cannot connect to fiszki-server (${message}).`,
        target_url: baseUrl,
      },
      {
        status: 502,
        headers: {
          "x-fiszki-target": baseUrl,
        },
      }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
