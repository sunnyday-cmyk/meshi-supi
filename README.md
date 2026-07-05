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
7. Google Cloud で **Places API (New)** を有効化し、APIキーを発行（店舗検索・写真表示の両方に使用）
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

## Vercel へデプロイ

### 1. GitHub に push（未実施の場合）

```bash
cd "/Users/toranosuke/アプリ２/meshispin"
git push -u origin main
```

リポジトリ: `https://github.com/jqz8zvrbvk-eng/meshispin`

### 2. Vercel でプロジェクトをインポート

1. [vercel.com](https://vercel.com) にログイン
2. **Add New… > Project**
3. GitHub の `meshispin` を選択して **Import**
4. Framework Preset: **Next.js**（自動検出）
5. Root Directory: そのまま（リポジトリ直下）

### 3. 環境変数を設定（Deploy 前）

Vercel の **Environment Variables** に以下を追加（Production / Preview / Development すべてにチェック推奨）:

| 名前 | 値 |
|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase の Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon key |
| `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Google Places API キー |

`.env.local` の値をそのままコピーして OK です。

### 4. Deploy

**Deploy** を押す。完了後 `https://xxxx.vercel.app` のような URL が発行されます。

### 5. 本番 URL を外部サービスに登録（必須）

デプロイ後の URL を `https://あなたのドメイン.vercel.app` とします。

**Supabase**（Authentication > URL Configuration）

- Site URL: `https://あなたのドメイン.vercel.app`
- Redirect URLs に追加:
  - `https://あなたのドメイン.vercel.app/auth/callback`

**Google Cloud Console**（OAuth クライアント）

- 承認済みの JavaScript 生成元: `https://あなたのドメイン.vercel.app`
- 承認済みのリダイレクト URI: Supabase が案内する Google 用 URI（Supabase Dashboard の Google プロバイダ画面を確認）

### 6. 動作確認

1. 本番 URL の `/` で店舗が表示されるか
2. グループ作成 → Google ログイン → 招待 → 投票

ローカル用の `http://localhost:3000` は Redirect URLs に残しておくと、開発も続けられます。

### CLI でデプロイする場合（任意）

```bash
cd "/Users/toranosuke/アプリ２/meshispin"
npx vercel login
npx vercel --prod
```

初回は対話形式でプロジェクト名などを聞かれます。環境変数は Vercel Dashboard から設定してください。
