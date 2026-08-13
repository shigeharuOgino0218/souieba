# そういえば — 買い物リスト共有アプリ

家族・グループで買い物リストをリアルタイムに共有できる Web アプリ。

- メモアプリのような入力体験(Enter で次のアイテム、空行で Backspace すると行削除)
- アイテムごとに「＋お店」でお店をタグ付け(お店はその場で追加可能)
- メール + パスワード認証
- 招待URLでメンバーを追加し、同じリストを共同編集
- Supabase Realtime による即時同期
- 他のメンバーがアイテムを追加したときの Web Push 通知

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
2. ダッシュボードの **SQL Editor** で `supabase/migrations/` の SQL を番号順に実行
3. **Authentication → Sign In / Providers → Email** で、開発中は `Confirm email` を OFF にすると確認メールなしでサインアップできます
4. **Database → Extensions** で `pg_net` と `supabase_vault` を有効化(プッシュ通知を使う場合)

### 3. 環境変数

`.env.example` をコピーして `.env.local` を作成し、ダッシュボードの **Settings → API** の値を設定:

```sh
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=   # プッシュ通知を使う場合のみ(次章で生成)
```

### 4. 起動

```sh
bun dev
```

## プッシュ通知のセットアップ

共有リストの他メンバーがアイテム名を入力すると、DB トリガーが Edge Function を呼び、
購読中の端末へ Web Push を送ります。通知はリスト単位でまとめられ、通知センターには1件だけ残ります。

### 1. 鍵とシークレットを生成する

Deno が必要です(`mise use deno@latest`)。

```sh
deno eval "
import * as webpush from 'jsr:@negrel/webpush';
const k = await webpush.generateVapidKeys({ extractable: true });
console.log('VAPID_KEYS=' + JSON.stringify(await webpush.exportVapidKeys(k)));
console.log('VITE_VAPID_PUBLIC_KEY=' + await webpush.exportApplicationServerKey(k));
"
openssl rand -base64 32   # 共有シークレット(NOTIFY_SHARED_SECRET)
```

出力された3つの値の置き場所:

| 値 | 置き場所 |
|---|---|
| `VITE_VAPID_PUBLIC_KEY` | `.env.local` |
| `VAPID_KEYS` | `supabase/functions/.env` |
| `openssl` が出したランダム文字列 | `supabase/functions/.env` の `NOTIFY_SHARED_SECRET` **と** Vault の `notify_shared_secret`(次章)。**両方に同じ値を入れる** |

`supabase/functions/.env` を新規作成します(`.env*` は gitignore 済み):

```
VAPID_KEYS={"publicKey":{...},"privateKey":{...}}
VAPID_SUBJECT=mailto:you@example.com
NOTIFY_SHARED_SECRET=vxW9P0xbl…（openssl が出した値をそのまま貼る）
NOTIFY_DELAY_MS=60000
NOTIFY_WINDOW_SEC=180
```

`NOTIFY_SHARED_SECRET` は DB トリガーが Edge Function を呼ぶときの合言葉です。
Edge Function 側(この `.env`)と DB 側(Vault)で値が一致していないと 403 で弾かれます。

`NOTIFY_DELAY_MS` と `NOTIFY_WINDOW_SEC` の意味は「通知タイミングの設計」を参照してください。

### 2. Vault にシークレットを登録

SQL Editor で実行します。プレースホルダは次のように置き換えてください。

- `<project-ref>` … Supabase プロジェクトの ref(`.env.local` の `VITE_SUPABASE_URL` に入っている `https://xxxx.supabase.co` の `xxxx` 部分)
- `<NOTIFY_SHARED_SECRET と同じ値>` … 前章で `supabase/functions/.env` に書いた `NOTIFY_SHARED_SECRET` の値そのもの。ここで新しく生成し直さないこと

```sql
select vault.create_secret(
  'https://<project-ref>.supabase.co/functions/v1/notify-item-added',
  'notify_item_added_url', 'Edge Function endpoint');

select vault.create_secret(
  '<NOTIFY_SHARED_SECRET と同じ値>',
  'notify_shared_secret', 'Edge Function 共有シークレット');
```

登録できたかの確認:

```sql
select name, length(decrypted_secret) as len
from vault.decrypted_secrets
where name in ('notify_item_added_url', 'notify_shared_secret');
```

実値はコミットしないこと。値を入れ替えるときは `vault.update_secret` を使い、
`supabase/functions/.env` 側も同時に直して secrets を登録し直します。

### 3. Edge Function をデプロイ

```sh
mise use supabase@latest
supabase login
supabase link --project-ref <project-ref>
supabase functions deploy notify-item-added --use-api   # --use-api で Docker 不要
supabase secrets set --env-file supabase/functions/.env
```

`SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` は自動で注入されるため設定不要です。

デプロイできたかは、共有シークレット無しで叩いて 403 が返ることで確認できます:

```sh
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  https://<project-ref>.supabase.co/functions/v1/notify-item-added
```

### 通知タイミングの設計

通知が飛ぶのは **`items.name` が空 → 非空 になった1回だけ**です(`0004_push_notifications.sql` のトリガーの `when` 句)。
名前を後から編集しても2通目は飛びません。

そのため「コーヒー」まで入力した時点でトリガーが発火し、あとから「牛乳」を書き足しても
**再通知はされません**。これに対応するため、Edge Function は起動後すぐ送らず、
`NOTIFY_DELAY_MS` 待ってから `items.name` を**読み直して**から送ります。

```
入力停止 → 500ms後に UPDATE → トリガー発火 → Edge Function 起動
                                                └→ 60秒待つ → name を読み直す → 送信
```

| 設定 | 既定値 | 意味 |
|---|---|---|
| `NOTIFY_DELAY_MS` | 60000 | 名前を読み直すまでの待ち時間。**この時間内に書き足した分は正しく通知に反映される**。長くすると通知は遅れるが取りこぼしが減る |
| `NOTIFY_WINDOW_SEC` | 180 | 「〇〇さんが3件追加しました」と数える集計範囲。通知タイミングには影響しない。`NOTIFY_DELAY_MS` より十分長くすること |

待ち時間はサーバー側で消化するので、**その間にアプリを閉じても通知は送られます**。
クライアントに依存するのは「入力停止から 500ms 後の UPDATE が DB に届くか」だけです。

上限は Edge Function の実行時間(Free プランで wall clock 150秒)です。
`NOTIFY_DELAY_MS` を伸ばす場合はこれを超えないようにしてください。
なお呼び出し元の `pg_net` を待たせないよう、Edge Function は 202 を即返してから
バックグラウンド(`EdgeRuntime.waitUntil`)で送信しています。

### 制約

- **iOS は 16.4 以上かつ「ホーム画面に追加」した PWA としてのみ通知を受け取れます。** Safari のタブでは動きません。
- HTTPS 必須です。`bun dev` の LAN IP アクセス(`http://192.168.x.x`)では Service Worker ごと動きません。デスクトップ Chrome の `http://localhost:5173` は secure context 扱いなので、そちらでは通知まで検証できます。
- 通知タップで `/lists/:id` を直接開くため、ホスティング側に SPA フォールバックの rewrite が必要です。

## 動作確認の手順

1. サインアップ → リストを作成 → Enter 連打でアイテムを複数入力、チェック ON/OFF
2. アイテム右の「＋お店」で店舗を選択、検索欄に入力して新しい店舗を追加
3. 「共有」から招待URLを発行 → シークレットウィンドウで別アカウントを作って参加
4. 2 つのウィンドウを並べ、片方での追加・チェックがもう片方に即時反映されることを確認

### プッシュ通知

シークレットウィンドウは Push が使えないため、**Chrome の別プロファイル**を使います。

1. 両方のアカウントで `/settings` の「アイテム追加の通知」を ON
   → `select user_id, endpoint from push_subscriptions;` が2行になる
2. A でアイテム名を入力 → B に通知が出て、A には出ないことを確認
3. A で連続3件入力 → B の通知センターに1件だけ残り「〇〇さんが3件追加しました（…）」になる
4. 通知をタップ → 該当リストが開く(既存タブがあればフォーカス)

うまくいかないときは、まず pg_net の実行結果を見ます(約6時間で消えます):

```sql
select id, status_code, error_msg, content, created
from net._http_response order by id desc limit 5;
```

| 症状 | 原因 |
|---|---|
| 行が増えない | トリガーが発火していない。アイテム名が空→非空になったか、Vault の2件が登録済みかを確認 |
| `status_code` が 403 | 共有シークレットの不一致。`supabase/functions/.env` の `NOTIFY_SHARED_SECRET` と Vault の `notify_shared_secret` を突き合わせる |
| `status_code` が 202 なのに届かない | Edge Function は受理済み。実際の送信結果は下記のログで確認する |

送信結果は **ダッシュボード → Edge Functions → notify-item-added → Logs** に出ます
(`NOTIFY_DELAY_MS` の分だけ遅れて記録される点に注意)。

```
notified { listId: "...", sent: 1, items: 2, gone: 0 }
```

| ログ | 原因 |
|---|---|
| ログ自体が出ない | 送信先が0件。同じリストに自分以外のメンバーがいるか、その人が通知を ON にしているかを確認(自分の追加では自分に通知は飛びません) |
| `sent` が1以上なのに届かない | **OS 側で通知がブロックされている**。macOS ならシステム設定 → 通知 → Google Chrome を確認 |
| `gone` が増える | 購読が失効していた行を自動削除している。設定画面で通知を ON にし直す |
