import { NextRequest, NextResponse } from "next/server";

import { isAdminCookieValid, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";
import { exportAnswersCsv } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isAdminCookieValid(cookieValue)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const csv = exportAnswersCsv();

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="answers-export.csv"'
    }
  });
}
