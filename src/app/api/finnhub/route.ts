import { type NextRequest } from "next/server";

export const runtime = "nodejs";
const API_BASE_URL = process.env.FINNHUB_API_BASE_URL ?? "https://finnhub.io/api/v1";

/**
 * Proxy route for Finnhub API calls.
 * Keeps the API key server-side — never exposed to the browser.
 *
 * Usage: GET /api/finnhub?path=/quote&symbol=AAPL
 * The `path` param is required; all other params are forwarded as-is.
 */
export async function GET(request: NextRequest) {
  // Read the key at request time so it picks up env vars in production and dev.
  const apiKey = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

  if (!apiKey) {
    console.error(
      "FINNHUB_API_KEY is not set. Set it in your environment variables " +
      "and redeploy. In Vercel, configure FINNHUB_API_KEY under Project Settings > Environment Variables."
    );
    return Response.json(
      { error: "API key not configured. Check server logs." },
      { status: 500 },
    );
  }

  const incoming = request.nextUrl.searchParams;
  const path = incoming.get("path");

  if (!path) {
    return Response.json({ error: "Missing required `path` query param" }, { status: 400 });
  }

  const upstream = new URLSearchParams();
  for (const [key, value] of incoming.entries()) {
    if (key !== "path") upstream.set(key, value);
  }
  upstream.set("token", apiKey);

  const normalizedBase = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);
  url.search = upstream.toString();

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    const sanitizedUrl = url.toString().replace(/([?&])token=[^&]*/i, "$1token=REDACTED");

    if (!res.ok) {
      let body: any;
      const text = await res.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text || res.statusText };
      }
      console.error(`Finnhub upstream ${res.status} for ${path}:`, body, sanitizedUrl);
      return Response.json(
        { error: "Upstream Finnhub request failed", status: res.status, details: body },
        { status: res.status },
      );
    }

    try {
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch (jsonErr) {
      const text = await res.text();
      console.error("Finnhub proxy JSON parse failed for response:", text, sanitizedUrl, jsonErr);
      return Response.json(
        { error: "Finnhub returned non-JSON response", details: text },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("Finnhub proxy error:", err);
    return Response.json({ error: "Upstream fetch failed", details: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}

