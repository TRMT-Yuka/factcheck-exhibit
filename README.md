# FactCheck Exhibit

展示会場向けのローカル完結型 Web アプリです。体験者に 2〜3 件の投稿セットをランダム提示し、人間の判断と判定システムの結果、作成者ラベルを比較表示します。

## 技術構成

- Next.js App Router + TypeScript
- Node 組み込みの `node:sqlite` を使った SQLite 永続化
- Route Handlers によるローカル API
- 初期データは `src/data/*.json` から自動 seed

## セットアップ

1. Node.js 24 系を用意します。
2. `.env.example` を `.env` にコピーします。
3. 依存関係をインストールします。
4. 開発サーバーを起動します。

```bash
npm install
cp .env.example .env
npm run dev
```

本番相当で動かす場合:

```bash
npm run build
npm start
```

## 環境変数

- `APP_ADMIN_PIN`: 管理画面の固定 PIN
- `APP_JUDGE_MODE`: `precomputed` または `external`
- `APP_SELECTION_MODE`: `checkbox` または `radio`
- `APP_DB_PATH`: SQLite ファイルの保存先

## 画面

- `/`: Start 画面
- `/experience`: 投稿選択画面
- `/result`: 比較結果画面
- `/admin`: PIN 保護付き管理画面

## API

- `POST /api/session/start`
- `POST /api/answer`
- `POST /api/judge`
- `GET /api/stats/export`
- `POST /api/admin/login`
- `POST /api/admin/seed`
- `POST /api/admin/reset`

## データ差し替え JSON 形式

管理画面の JSON 差し替えでは、次のトップレベルキーを持つ JSON を読み込みます。

```json
{
  "posts": [],
  "post_sets": [],
  "labels": [],
  "judge_results": []
}
```

`post_sets[].post_ids` は 2〜3 件の投稿 ID を持つ配列を想定しています。

## 補足

- `APP_JUDGE_MODE=external` でもネットワークには出ず、将来の外部 API 接続口を想定したローカルダミー判定を返します。
- `DBリセット` は回答ログを削除し、`src/data/*.json` で再 seed します。
- `node:sqlite` は Node の実験的機能のため、実行時に warning が出る場合があります。
