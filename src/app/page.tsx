import { StartClient } from "@/components/start-client";

export default function HomePage() {
  return (
    <main className="page-shell stack">
      <section className="hero stack">
        <div className="pill">展示用ローカルアプリ</div>
        <h1>ファクトチェック優先度を見極める</h1>
        <p className="lead">
          2〜3件のSNS投稿から、すぐに調査が必要な危ない噂を選びます。
          <br />
          送信後に、人間の判断と判定システムの結果、作成者ラベルを比較表示します。
          <br />
          個人情報は取得せず、選択結果と所要時間だけを記録します。
        </p>
        <StartClient />
      </section>
    </main>
  );
}
