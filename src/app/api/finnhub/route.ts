import { type NextRequest } from "next/server";

const API_KEY = process.env.FINNHUB_API_KEY;
const API_BASE_URL = process.env.FINNHUB_API_BASE_URL ?? "https://finnhub.io/api/v1";

/**
 * Proxy route for Finnhub API calls.
 * Keeps the API key server-side — never exposed to the browser.
 *
 * Usage: GET /api/finnhub?path=/quote&symbol=AAPL
 * The `path` param is required; all other params are forwarded as-is.
 */
export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const incoming = request.nextUrl.searchParams;
  const path = incoming.get("path");

  if (!path) {
    return Response.json({ error: "Missing required `path` query param" }, { status: 400 });
  }

  // Forward all query params except `path`, then append the secret token
  const upstream = new URLSearchParams();
  for (const [key, value] of incoming.entries()) {
    if (key !== "path") upstream.set(key, value);
  }
  upstream.set("token", API_KEY);

  const url = `${API_BASE_URL}${path}?${upstream.toString()}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    console.error("Finnhub proxy error:", err);
    return Response.json({ error: "Upstream fetch failed" }, { status: 502 });
  }
}
