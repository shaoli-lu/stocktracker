import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("app_authenticated")?.value === "true";
  return NextResponse.json({ authenticated: isAuthenticated });
}
