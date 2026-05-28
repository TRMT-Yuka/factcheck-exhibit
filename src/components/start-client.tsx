"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { CURRENT_SESSION_KEY, RESULT_KEY } from "@/lib/storage";

export function StartClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function beginSession() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/session/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("セッション開始に失敗しました。");
      }

      const data = await response.json();
      sessionStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(data));
      sessionStorage.removeItem(RESULT_KEY);
      router.push("/experience");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "予期しないエラーが発生しました。"
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="cta-row">
      <button type="button" className="button" onClick={beginSession} disabled={pending}>
        {pending ? "準備中..." : "体験をはじめる"}
      </button>
      {error ? <div className="error-text">{error}</div> : null}
    </div>
  );
}
