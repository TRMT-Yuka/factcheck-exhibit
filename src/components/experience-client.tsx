"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PostCard } from "@/components/post-card";
import { CURRENT_SESSION_KEY, RESULT_KEY } from "@/lib/storage";
import type { LabelRecord, PostRecord, SessionBundle } from "@/lib/types";

type ResultPayload = {
  session: SessionBundle;
  chosenPostIds: string[];
  labels: LabelRecord[];
  judgeMode: string;
  judgeResults: Array<{
    post_id: string;
    priority_rank: number;
    priority_score: number;
    rationale_short: string;
    set_id: string;
  }>;
  optionalFeedback?: string;
  submittedAt: string;
  durationMs: number;
};

export function ExperienceClient() {
  const router = useRouter();
  const [session, setSession] = useState<SessionBundle | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(CURRENT_SESSION_KEY);
    if (!raw) {
      return;
    }

    setSession(JSON.parse(raw) as SessionBundle);
  }, []);

  const orderedPosts = useMemo<PostRecord[]>(() => session?.posts ?? [], [session]);

  function togglePost(postId: string) {
    if (!session) {
      return;
    }

    setSelectedPostIds((previous) => {
      if (session.selection_mode === "radio") {
        return [postId];
      }

      return previous.includes(postId)
        ? previous.filter((item) => item !== postId)
        : [...previous, postId];
    });
  }

  async function submitAnswer() {
    if (!session || selectedPostIds.length === 0) {
      return;
    }

    setPending(true);
    setError(null);

    const submittedAt = new Date().toISOString();

    try {
      const answerResponse = await fetch("/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          session_id: session.session_id,
          set_id: session.set_id,
          chosen_post_ids: selectedPostIds,
          started_at: session.started_at,
          submitted_at: submittedAt,
          optional_feedback: feedback
        })
      });

      if (!answerResponse.ok) {
        throw new Error("回答の保存に失敗しました。");
      }

      const answerData = (await answerResponse.json()) as { duration_ms: number };

      const judgeResponse = await fetch("/api/judge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          set_id: session.set_id,
          post_ids: session.post_ids
        })
      });

      if (!judgeResponse.ok) {
        throw new Error("判定結果の取得に失敗しました。");
      }

      const judgeData = await judgeResponse.json();

      const resultPayload: ResultPayload = {
        session,
        chosenPostIds: selectedPostIds,
        labels: session.labels,
        judgeMode: judgeData.mode,
        judgeResults: judgeData.results,
        optionalFeedback: feedback || undefined,
        submittedAt,
        durationMs: answerData.duration_ms
      };

      sessionStorage.setItem(RESULT_KEY, JSON.stringify(resultPayload));
      router.push("/result");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "予期しないエラーが発生しました。"
      );
    } finally {
      setPending(false);
    }
  }

  if (!session) {
    return (
      <section className="panel stack">
        <h1 className="page-title">体験データが見つかりません</h1>
        <p className="muted">開始画面から新しいセッションを作成してください。</p>
        <button type="button" className="button" onClick={() => router.push("/")}>
          Start画面へ戻る
        </button>
      </section>
    );
  }

  return (
    <section className="experience-shell">
      <div className="experience-layout">
        <div className="experience-left stack">
          <div className="experience-header stack">
            <div className="experience-header__row">
              <div className="experience-header__main">
                <div className="experience-kicker">展示アプリ UI</div>
                <h1 className="page-title">危ない噂を選んでください</h1>
              </div>
                </div>
            <p className="lead experience-header__lead">
              タイムライン内の投稿を見て、すぐ調査が必要だと思うものを選択してください。
              <br />
              ※ユーザ名・アプリケーション外観はすべて架空の設定です。
            </p>
          </div>

          <aside className="experience-sidebar stack">
            <div className="timeline-panel stack">
              <div className="inline-note">
                {session.selection_mode === "radio"
                  ? `${selectedPostIds.length}件 / 1件を選択`
                  : `${orderedPosts.length}件中 ${selectedPostIds.length}件を選択中`}
              </div>
              <label className="stack">
                <span style={{ fontWeight: 700 }}>判断メモ（任意）</span>
                <textarea
                  className="textarea"
                  rows={5}
                  maxLength={240}
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="どの点が危険だと思ったか、何を根拠に選んだか"
                />
              </label>
              <button
                type="button"
                className="button"
                onClick={submitAnswer}
                disabled={selectedPostIds.length === 0 || pending}
              >
                {pending ? "送信中..." : "送信して結果を見る"}
              </button>
              <button type="button" className="button-secondary" onClick={() => router.push("/")}>
                やり直す
              </button>
              {error ? <div className="error-text">{error}</div> : null}
            </div>
          </aside>
        </div>

        <div className="timeline-stage stack">
          <div className="phone-frame">
            <span className="phone-frame__side-button phone-frame__side-button--mute" aria-hidden="true" />
            <span className="phone-frame__side-button phone-frame__side-button--volume-up" aria-hidden="true" />
            <span className="phone-frame__side-button phone-frame__side-button--volume-down" aria-hidden="true" />
            <span className="phone-frame__side-button phone-frame__side-button--power" aria-hidden="true" />
            <div className="phone-frame__screen">
              <div className="phone-frame__notch" aria-hidden="true">
                <span className="phone-frame__speaker" />
                <span className="phone-frame__camera" />
              </div>
              <div className="phone-frame__status" aria-hidden="true">
                <span>9:41</span>
                <span>5G</span>
              </div>
              <div className="timeline-scroll-region">
                <div className="timeline-feed__list">
                  {orderedPosts.map((post) => (
                    <PostCard
                      key={post.post_id}
                      post={post}
                      selected={selectedPostIds.includes(post.post_id)}
                      selectionMode={session.selection_mode}
                      onToggle={togglePost}
                    />
                  ))}
                </div>
              </div>
              <div className="phone-frame__home-indicator" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
