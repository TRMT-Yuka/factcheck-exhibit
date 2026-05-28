import { NextRequest, NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, getAdminCookieValueForSet } from "@/lib/admin-auth";
import { appEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { pin?: string };

  if (body.pin !== appEnv.adminPin) {
    return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: getAdminCookieValueForSet(),
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/"
  });

  return response;
}
