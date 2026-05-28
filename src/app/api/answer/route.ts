import { NextRequest, NextResponse } from "next/server";

import { saveAnswer } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      session_id?: string;
      set_id?: string;
      chosen_post_ids?: string[];
      started_at?: string;
      submitted_at?: string;
      optional_feedback?: string;
    };

    if (
      !body.session_id ||
      !body.set_id ||
      !Array.isArray(body.chosen_post_ids) ||
      body.chosen_post_ids.length === 0 ||
      !body.started_at ||
      !body.submitted_at
    ) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const saved = saveAnswer({
      session_id: body.session_id,
      set_id: body.set_id,
      chosen_post_ids: body.chosen_post_ids,
      started_at: body.started_at,
      submitted_at: body.submitted_at,
      optional_feedback: body.optional_feedback
    });

    return NextResponse.json({
      ok: true,
      duration_ms: saved.durationMs
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save answer." },
      { status: 500 }
    );
  }
}
