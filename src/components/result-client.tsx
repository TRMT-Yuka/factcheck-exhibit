"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ComparisonTable } from "@/components/comparison-table";
import { CURRENT_SESSION_KEY, RESULT_KEY } from "@/lib/storage";
import type { JudgeResultRecord, LabelRecord, PostRecord, SessionBundle } from "@/lib/types";

type ResultPayload = {
  session: SessionBundle;
  chosenPostIds: string[];
  labels: LabelRecord[];
  judgeMode: string;
  judgeResults: JudgeResultRecord[];
  optionalFeedback?: string;
  submittedAt: string;
  durationMs: number;
};

export function ResultClient() {
  const router = useRouter();
  const [payload, setPayload] = useState<ResultPayload | null>(null);
  const [pendingRestart, setPendingRestart] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(RESULT_KEY);
    if (!raw) {
      return;
    }

    setPayload(JSON.parse(raw) as ResultPayload);
  }, []);

  async function restart() {
    setPendingRestart(true);
    setRestartError(null);

    try {
      const response = await fetch("/api/session/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("新しいセッションを開始できませんでした。");
      }

      const data = await response.json();
      sessionStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(data));
      sessionStorage.removeItem(RESULT_KEY);
      router.push("/experience");
    } catch (caughtError) {
      setRestartError(
        caughtError instanceof Error ? caughtError.message : "予期しないエラーが発生しました。"
      );
    } finally {
      setPendingRestart(false);
    }
  }

  if (!payload) {
    return (
      <section className="panel stack">
        <h1 className="page-title">結果データがありません</h1>
        <p className="muted">体験画面から回答を送信すると比較結果を表示できます。</p>
        <button type="button" className="button" onClick={() => router.push("/")}>
          Start画面へ戻る
        </button>
      </section>
    );
  }

  const posts: PostRecord[] = payload.session.posts;

  return (
    <section className="stack">
      <div className="hero">
        <div className="summary-grid">
          <div className="summary-card">
            <div className="muted">体験者の選択数</div>
            <div style={{ fontSize: "2rem", fontWeight: 800 }}>
              {payload.chosenPostIds.length}
            </div>
          </div>
          <div className="summary-card">
            <div className="muted">所要時間</div>
            <div style={{ fontSize: "2rem", fontWeight: 800 }}>
              {(payload.durationMs / 1000).toFixed(1)}秒
            </div>
          </div>
          <div className="summary-card">
            <div className="muted">判定モード</div>
            <div style={{ fontSize: "2rem", fontWeight: 800 }}>{payload.judgeMode}</div>
          </div>
        </div>
      </div>

      <ComparisonTable
        posts={posts}
        labels={payload.labels}
        judgeResults={payload.judgeResults}
        chosenPostIds={payload.chosenPostIds}
      />

      {payload.optionalFeedback ? (
        <div className="panel stack">
          <div style={{ fontWeight: 700 }}>任意コメント</div>
          <div className="muted">{payload.optionalFeedback}</div>
        </div>
      ) : null}

      <div className="cta-row">
        <button type="button" className="button" onClick={restart} disabled={pendingRestart}>
          {pendingRestart ? "準備中..." : "もう一度やる"}
        </button>
        <button type="button" className="button-secondary" onClick={() => router.push("/")}>
          Start画面へ
        </button>
      </div>
      {restartError ? <div className="error-text">{restartError}</div> : null}
    </section>
  );
}
