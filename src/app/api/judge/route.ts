import { NextRequest, NextResponse } from "next/server";

import { judgePosts } from "@/lib/judge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { set_id?: string; post_ids?: string[] };

    if (!body.set_id || !Array.isArray(body.post_ids) || body.post_ids.length === 0) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    return NextResponse.json(judgePosts(body.set_id, body.post_ids));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to judge posts." },
      { status: 500 }
    );
  }
}
