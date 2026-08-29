# CLAUDE.md

買い物リスト共有アプリ。Bun / Vite + React + TypeScript / Tailwind + shadcn/ui / Supabase (Auth, Postgres, RLS, Realtime) / PWA + Web Push。

仕様・運用・トラブルシュートは [README.md](README.md) に詳しい。特に Web Push は設計上の罠が多いので、通知まわりを触る前に README の「通知タイミングの設計」を読むこと。

## コマンド

| コマンド             | 用途                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `bun dev`            | 開発サーバ (http://localhost:5173)                                    |
| `bun run check`      | **format / lint / typecheck / test を一括実行。作業完了前に必ず通す** |
| `bun run typecheck`  | 型チェックのみ (`tsc -b`)                                             |
| `bun run test`       | テスト (`vitest run`)。`test:watch` で監視                            |
| `bun run format`     | Prettier で整形                                                       |
| `bun run lint:fix`   | oxlint の自動修正                                                     |
| `bun run db:migrate` | **マイグレーションをリモートに適用し、型を再生成**                    |
| `bun run db:types`   | 型のみ再生成                                                          |
| `bun run build`      | 本番ビルド                                                            |

`bun` が見つからない場合は mise 経由で実行する: `~/.local/bin/mise exec -- bun run check`

## 作業の進め方

1. 変更する
2. `bun run check` を通す
3. 通らないまま「完了」と報告しない

lint の警告はゼロが基準。警告が出たらそれは本物のシグナルとして扱う。

## ディレクトリ

| パス                   | 責務                                                                           |
| ---------------------- | ------------------------------------------------------------------------------ |
| `src/pages/`           | ルート単位の画面。ルーティングは `src/App.tsx`                                 |
| `src/components/`      | 画面をまたぐコンポーネント                                                     |
| `src/components/ui/`   | **shadcn/ui の生成物。手で編集しない**(`bunx shadcn@latest add <name>` で追加) |
| `src/hooks/`           | データ取得と Realtime 購読                                                     |
| `src/lib/`             | Supabase クライアント、型、純粋関数                                            |
| `src/sw.ts`            | Service Worker (push 受信・通知タップの遷移)                                   |
| `supabase/migrations/` | スキーマ。連番 SQL                                                             |
| `supabase/functions/`  | Edge Function (Deno)                                                           |

## 規約

- **コメントは関数レベル・ファイルレベルで書く。** 何をするものか、なぜ必要かをまとまり単位で説明する。
  1 行ごとに処理と並走する逐次的な説明は書かない。行レベルのコメントは、コードから読み取れない制約
  (RLS の再帰回避、Realtime エコーの猶予時間など)に限る
- import は `@/` エイリアスを使う
- 整形は Prettier に委ねる。手で整形しない
- DB の型は手書きしない。`src/lib/types.ts` は `database.types.ts` からの派生であり、新しいテーブルを使うときもここに派生型を足す
- `data as Item[]` のような Supabase 結果へのキャストを書かない。型付きクライアントが推論するので、キャストが必要になったらクエリか型定義の方が間違っている

## DB を変更するとき

**スキーマは `supabase/migrations/` が真実の源。ダッシュボードの SQL Editor で直接変更しない。**

1. `supabase/migrations/0005_<説明>.sql` を作る(連番を続ける)
2. **RLS ポリシーを必ず書く。** 新しいテーブルには `enable row level security` と policy をセットで書く
3. `bun run db:migrate` — リモートに適用され、続けて `src/lib/database.types.ts` が再生成される
4. 生成された型を使う。必要なら `src/lib/types.ts` に派生型を足す
5. `bun run check`

`db:push` は本番 DB に適用する操作なので確認プロンプトが出る。内容を読んでから進める。

### RLS の注意

`list_members` を参照するポリシーは無限再帰しやすい。`0002_fix_lists_select_policy.sql` はその修正で、`security definer` の `is_list_member()` を経由して再帰を避けている。同種のポリシーを書くときはこの関数を使う。

### 型とスキーマがずれたら

`database.types.ts` は生成物なので手で編集しない。ずれたら `bun run db:types` で再生成する。
migrations を変更したのに型を再生成していない PR は CI が落とす。

## 触らないもの

- `.env.local` / `supabase/functions/.env` — 秘密情報。読み書きしない
- `src/lib/database.types.ts` — 生成物
- `dist/` `dev-dist/` — ビルド成果物
- `bun.lock` — 手で編集しない

## 検証

ユニットテストは `src/lib/` の純粋関数のみをカバーしている。UI・Realtime・Push は自動テストが無いため、
これらを変更したときは README の「動作確認の手順」に沿って手で確認する。
