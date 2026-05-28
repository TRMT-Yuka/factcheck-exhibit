import { NextRequest, NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, isAdminCookieValid } from "@/lib/admin-auth";
import { replaceSeedData } from "@/lib/db";
import type { SeedData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidSeedData(seedData: SeedData) {
  return (
    Array.isArray(seedData.posts) &&
    Array.isArray(seedData.post_sets) &&
    Array.isArray(seedData.labels) &&
    Array.isArray(seedData.judge_results)
  );
}

export async function POST(request: NextRequest) {
  const cookieValue = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!isAdminCookieValid(cookieValue)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SeedData;

    if (!isValidSeedData(body)) {
      return NextResponse.json({ error: "Invalid seed format." }, { status: 400 });
    }

    replaceSeedData(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to replace seed data." },
      { status: 500 }
    );
  }
}
