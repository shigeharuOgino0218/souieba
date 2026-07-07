# そういえば — 買い物リスト共有アプリ

家族・グループで買い物リストをリアルタイムに共有できる Web アプリ。

- メモアプリのような入力体験(Enter で次のアイテム、空行で Backspace すると行削除)
- アイテムごとに「＋お店」でお店をタグ付け(お店はその場で追加可能)
- メール + パスワード認証
- 招待URLでメンバーを追加し、同じリストを共同編集
- Supabase Realtime による即時同期

## 技術スタック

Bun / Vite + React + TypeScript / Tailwind CSS + shadcn/ui / Supabase (Auth, Postgres, RLS, Realtime) / React Router

## セットアップ

### 1. ツール

[mise](https://mise.jdx.dev/) を使っています。リポジトリ直下で:

```sh
mise install   # mise.toml の bun をインストール
bun install
```

### 2. Supabase プロジェクト

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. ダッシュボードの **SQL Editor** で `supabase/migrations/0001_init.sql` の内容を実行
3. **Authentication → Sign In / Providers → Email** で、開発中は `Confirm email` を OFF にすると確認メールなしでサインアップできます

### 3. 環境変数

`.env.example` をコピーして `.env.local` を作成し、ダッシュボードの **Settings → API** の値を設定:

```sh
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 起動

```sh
bun dev
```

## 動作確認の手順

1. サインアップ → リストを作成 → Enter 連打でアイテムを複数入力、チェック ON/OFF
2. アイテム右の「＋お店」で店舗を選択、検索欄に入力して新しい店舗を追加
3. 「共有」から招待URLを発行 → シークレットウィンドウで別アカウントを作って参加
4. 2 つのウィンドウを並べ、片方での追加・チェックがもう片方に即時反映されることを確認
