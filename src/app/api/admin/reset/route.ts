import { NextRequest, NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, isAdminCookieValid } from "@/lib/admin-auth";
import { resetDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isAdminCookieValid(cookieValue)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { confirm?: boolean };
  if (!body.confirm) {
    return NextResponse.json({ error: "Confirmation required." }, { status: 400 });
  }

  resetDatabase();
  return NextResponse.json({ ok: true });
}
