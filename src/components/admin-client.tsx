"use client";

import { useState } from "react";

import type { DashboardSummary, SeedData } from "@/lib/types";

type AdminClientProps = {
  authorized: boolean;
  summary: DashboardSummary;
};

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("ファイルを読み込めませんでした。"));
    reader.readAsText(file);
  });
}

export function AdminClient({ authorized, summary }: AdminClientProps) {
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seedFileName, setSeedFileName] = useState<string | null>(null);
  const [seedData, setSeedData] = useState<SeedData | null>(null);
  const [ackReset, setAckReset] = useState(false);

  async function handleLogin() {
    setBusy(true);
    setLoginError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pin })
      });

      if (!response.ok) {
        throw new Error("PINが正しくありません。");
      }

      window.location.reload();
    } catch (caughtError) {
      setLoginError(
        caughtError instanceof Error ? caughtError.message : "ログインに失敗しました。"
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSeedFileChange(file: File | null) {
    setMessage(null);
    if (!file) {
      setSeedData(null);
      setSeedFileName(null);
      return;
    }

    try {
      const raw = await readFileAsText(file);
      setSeedData(JSON.parse(raw) as SeedData);
      setSeedFileName(file.name);
    } catch (caughtError) {
      setSeedData(null);
      setSeedFileName(null);
      setMessage(caughtError instanceof Error ? caughtError.message : "JSONを読み込めませんでした。");
    }
  }

  async function uploadSeed() {
    if (!seedData) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(seedData)
      });

      if (!response.ok) {
        throw new Error("データ差し替えに失敗しました。");
      }

      setMessage("投稿データを差し替えました。画面を再読み込みします。");
      window.location.reload();
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error ? caughtError.message : "データ差し替えに失敗しました。"
      );
    } finally {
      setBusy(false);
    }
  }

  async function resetDatabase() {
    if (!ackReset) {
      setMessage("先に確認チェックを入れてください。");
      return;
    }

    const confirmed = window.confirm(
      "ログを削除し、初期JSONで再seedします。この操作は元に戻せません。"
    );
    if (!confirmed) {
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ confirm: true })
      });

      if (!response.ok) {
        throw new Error("DBリセットに失敗しました。");
      }

      setMessage("DBをリセットしました。画面を再読み込みします。");
      window.location.reload();
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error ? caughtError.message : "DBリセットに失敗しました。"
      );
    } finally {
      setBusy(false);
    }
  }

  if (!authorized) {
    return (
      <section className="panel stack" style={{ maxWidth: 520 }}>
        <h1 className="page-title">管理画面</h1>
        <p className="muted">固定PINを入力すると管理機能を利用できます。</p>
        <input
          className="input"
          type="password"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder="PIN"
        />
        <button type="button" className="button" onClick={handleLogin} disabled={busy || !pin}>
          {busy ? "確認中..." : "PINで入る"}
        </button>
        {loginError ? <div className="error-text">{loginError}</div> : null}
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="hero">
        <h1 className="page-title">管理画面</h1>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="muted">投稿数</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{summary.postCount}</div>
          </div>
          <div className="summary-card">
            <div className="muted">セット数</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{summary.setCount}</div>
          </div>
          <div className="summary-card">
            <div className="muted">回答ログ数</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800 }}>{summary.answerCount}</div>
          </div>
        </div>
        <div className="inline-note">
          judgeMode: {summary.judgeMode} / selectionMode: {summary.selectionMode}
        </div>
        <div className="inline-note">DB: {summary.dbPath}</div>
      </div>

      <div className="admin-grid">
        <div className="panel stack">
          <div style={{ fontWeight: 700 }}>ログCSVエクスポート</div>
          <p className="muted">保存済みの answers テーブルをCSVでダウンロードします。</p>
          <a className="button" href="/api/stats/export">
            CSVをダウンロード
          </a>
        </div>

        <div className="panel stack">
          <div style={{ fontWeight: 700 }}>投稿データ差し替え</div>
          <p className="muted">
            `posts / post_sets / labels / judge_results` を含むJSONをアップロードします。
          </p>
          <input
            className="input"
            type="file"
            accept="application/json"
            onChange={(event) => handleSeedFileChange(event.target.files?.[0] ?? null)}
          />
          <div className="inline-note">
            {seedFileName ? `選択中: ${seedFileName}` : "未選択"}
          </div>
          <button type="button" className="button-secondary" onClick={uploadSeed} disabled={!seedData || busy}>
            {busy ? "処理中..." : "JSONで差し替える"}
          </button>
        </div>

        <div className="panel stack">
          <div style={{ fontWeight: 700 }}>DBリセット</div>
          <p className="muted">
            回答ログを削除し、初期JSONで展示データを再seedします。
          </p>
          <label className="choice-row">
            <input
              type="checkbox"
              checked={ackReset}
              onChange={(event) => setAckReset(event.target.checked)}
            />
            <span>この操作が破壊的であることを理解した</span>
          </label>
          <button type="button" className="button-danger" onClick={resetDatabase} disabled={busy}>
            {busy ? "処理中..." : "DBをリセット"}
          </button>
        </div>
      </div>

      {message ? <div className="panel">{message}</div> : null}
    </section>
  );
}
