# MeshiSpin

## セットアップ

1. Supabaseで新規プロジェクトを作成
2. SQL Editorで [`supabase/schema.sql`](supabase/schema.sql) を実行（確認は [`supabase/verify.sql`](supabase/verify.sql)）
3. Authentication > Providers で Google を有効化
4. Google Cloud Consoleで OAuth Client を作成し、Supabase側に Client ID / Secret を設定
5. Supabase Authentication URL Configuration で以下を追加
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
6. Database > Replication（Realtime）で `members` / `votes` / `roulette_additions` を有効化
7. Google Cloud で **Places API (New)** を有効化し、APIキーを発行
8. [`.env.local`](.env.local) に以下を設定

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=
```

## セットアップ確認

```bash
npm run check:setup
```

Supabase 接続・4テーブル・Places API (New) を自動チェックします。  
Google OAuth / Realtime は Dashboard 側の手動設定が必要です（スクリプト末尾に案内表示）。

## 起動

```bash
cd meshispin   # 必ずこのフォルダで実行
npm install
npm run dev
```

ブラウザ: `http://localhost:3000`

## E2E 動作確認チェックリスト

| # | 操作 | 期待結果 |
|---|------|----------|
| 1 | `/` を開く（位置情報を許可） | 近くのお店が表示 |
| 2 | グループを作る → 条件入力 → お店を探す | Googleログイン → 招待画面 |
| 3 | 別ブラウザで招待URLを開き名前入力 | メンバー一覧に反映 |
| 4 | ホストが投票をスタート | 投票画面へ遷移 |
| 5 | 各員が店をタップ | 票がリアルタイム反映 |
| 6 | 結果を見る / ルーレット | 店が決定 |
