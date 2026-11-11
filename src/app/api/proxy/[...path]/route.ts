import { NextRequest, NextResponse } from "next/server";

const PROD_API_URL =
  process.env.FISZKI_PROD_API_URL || "http://localhost:8080";
const STAGING_API_URL =
  process.env.FISZKI_STAGING_API_URL || "http://localhost:8080";
const DEFAULT_ENV = process.env.NEXT_PUBLIC_DEFAULT_ENV || "prod";

function resolveBackendBaseUrl(req: NextRequest): string {
  const envHeader = req.headers.get("x-fiszki-env") || DEFAULT_ENV;
  const customUrl = req.headers.get("x-fiszki-custom-url")?.trim();

  if (envHeader === "custom" && customUrl) {
    return customUrl.replace(/\/+$/, "");
  }
  if (envHeader === "staging") {
    return STAGING_API_URL.replace(/\/+$/, "");
  }
  return PROD_API_URL.replace(/\/+$/, "");
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
    // If staging (:8081) was selected locally but fiszki-server is running on :8080 (.env default), seamlessly fallback to :8080
    if (baseUrl === "http://localhost:8081") {
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
  const baseUrl = resolveBackendBaseUrl(req);
  const subPath = path.join("/");
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
    const buffer = await req.arrayBuffer();
    if (buffer.byteLength > 0) {
      body = buffer;
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

    // For /healthz probes, return 200 with status="unreachable" so the browser console is not polluted with 502 errors
    if (subPath === "healthz") {
      return NextResponse.json(
        {
          status: "unreachable",
          error: `Cannot connect to fiszki-server at ${baseUrl} (${message})`,
          target_url: baseUrl,
        },
        {
          status: 200,
          headers: {
            "x-fiszki-target": baseUrl,
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: `Cannot connect to fiszki-server at ${baseUrl}. Make sure fiszki-server is running on port 8080 (${message}).`,
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
