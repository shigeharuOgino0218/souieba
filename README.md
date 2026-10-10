# SOUIEBA

家族やグループで買い物リストをリアルタイムに共有できる Web アプリ。

**https://souieba.vercel.app/**

- メモアプリのような入力体験(Enter で次のアイテム、空行で Backspace すると行削除)
- アイテム右の「…」からお店をタグ付け(お店はその場で追加可能)
- 画面下のメニューで「買い物リスト」「リピ買い」「献立(準備中)」を切り替える
- いつも買うものは「リピ買い」にしておくと、買ったあともリピ買いのタブに戻り、選んでまとめてリストに戻せる
- チェックしたアイテムは毎朝 4:00 に片付く(普通のアイテムは削除、リピ買いはリピ買いのタブへ)
- メール + パスワード認証
- 招待URLでメンバーを追加し、同じリストを共同編集
- Supabase Realtime による即時同期
- 他のメンバーがアイテムを追加したときの Web Push 通知

## 技術スタック

Bun / Vite + React + TypeScript / Tailwind CSS + shadcn/ui / Supabase (Auth, Postgres, RLS, Realtime) / React Router

## セットアップ

### 1. ツール

[mise](https://mise.jdx.dev/) を使っています。  
リポジトリ直下で:

```sh
mise install              # mise.toml の bun / node をインストール
mise use supabase@latest  # Supabase CLI
bun install
```

### 2. Supabase プロジェクト

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. CLI からリンクしてマイグレーションを適用:

   ```sh
   supabase login
   supabase link --project-ref <project-ref>
   bun run db:push
   ```

3. **Authentication → Sign In / Providers → Email** で、開発中は `Confirm email` を OFF にすると確認メールなしでサインアップできます
4. **Database → Extensions** で `pg_net` と `supabase_vault` を有効化(プッシュ通知を使う場合)。朝の片付けに使う `pg_cron` はマイグレーション(`0007`)が有効化する

### 3. 環境変数

`.env.example` をコピーして `.env.local` を作成し、ダッシュボードの **Settings → API** の値を設定:

```sh
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=   # プッシュ通知を使う場合のみ(「プッシュ通知のセットアップ」で生成)
```

### 4. 起動

```sh
bun dev
```

### 5. デプロイ

Vercel にデプロイします。  
ルーティングは `BrowserRouter` によるクライアントサイドのみなので、`/invite/<token>` のような URL へ直接アクセスされても `index.html` を返すよう [`vercel.json`](vercel.json) で rewrite を設定しています。  
他のホスティングへ移す場合も同等の設定が必要です。

## 開発

コマンド、DB スキーマの変更手順、コーディング規約は [CLAUDE.md](CLAUDE.md) にまとめています。  
作業を終える前に `bun run check`(format / lint / typecheck / test)を通してください。

## リピ買いと朝の片付け

トイレットペーパーのように繰り返し買うものは、アイテムの「…」で「リピ買い」にします。  
リピ買いのアイテムは、買っても消えずにリピ買いのタブ(`/repeat`)に戻ります。  
そこで品をタップして選び、「買い物リストに登録」でまとめてリストの末尾に戻します。  
リストに出ている品は ✓ 付きのグレーで並び、タップするとリストから外れます。

新しいテーブルは作らず、`items` の同じ行がリストとリピ買いを行き来します。  
名前とお店がそのまま引き継がれ、RLS と Realtime も `items` の設定がそのまま効きます。

| 列        | 意味                                               |
| --------- | -------------------------------------------------- |
| `repeat`  | リピ買いの印                                       |
| `shelved` | リピ買いにしまわれていて、リストには出ていない状態 |

チェック済みのアイテムは、毎朝 4:00(日本時間)に `sweep_bought_items()` が片付けます。  
普通のアイテムは削除し、リピ買いはチェックを外してリピ買いに戻します。  
`pg_cron` の時刻は UTC なので、スケジュールは `0 19 * * *` です。  
片付くまでのあいだ、買い物リストのタブでボトムメニューのすぐ上に予告の帯を固定して出し続けます。

まだ買っていないアイテムは、時間がたっても消しません。  
数日前に「そういえば」と書いておく使い方を前提にしているためです。

登録済みのジョブは SQL Editor で確認できます:

```sql
select jobname, schedule, command from cron.job;
select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
```

## プッシュ通知のセットアップ

共有リストの他メンバーがアイテム名を入力すると、DB トリガーが Edge Function を呼び、購読中の端末へ Web Push を配信します。  
通知はリスト単位でまとめ、通知センターには1件だけ残します。

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

| 値                               | 置き場所                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `VITE_VAPID_PUBLIC_KEY`          | `.env.local`                                                                                                                |
| `VAPID_KEYS`                     | `supabase/functions/.env`                                                                                                   |
| `openssl` が出したランダム文字列 | `supabase/functions/.env` の `NOTIFY_SHARED_SECRET` **と** Vault の `notify_shared_secret`(手順2)。**両方に同じ値を入れる** |

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

SQL Editor で実行します。  
プレースホルダは次のように置き換えてください。

- `<project-ref>`：Supabase プロジェクトの ref(`.env.local` の `VITE_SUPABASE_URL` に入っている `https://xxxx.supabase.co` の `xxxx` 部分)
- `<NOTIFY_SHARED_SECRET と同じ値>`：手順1で `supabase/functions/.env` に書いた `NOTIFY_SHARED_SECRET` の値そのもの。ここで新しく生成し直さないこと

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

実値はコミットしないこと。  
値を入れ替えるときは `vault.update_secret` を使い、`supabase/functions/.env` 側も同時に直して secrets を登録し直します。

### 3. Edge Function をデプロイ

セットアップで `supabase link` 済みであることが前提です。

```sh
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

通知が飛ぶのは、`items.name` が空から非空になった1回だけです。  
名前を後から編集しても2通目は飛びません。

リピ買いのタブからリストに戻したとき(`shelved` が true から false になったとき)も、同じく「追加」として通知します。  
通知ではリピ買いのアイテム名の頭に 🔁 を付けます。  
リピ買いに直接登録したアイテムはリストに出ないので、通知しません。  
まとめて登録しても、`NOTIFY_WINDOW_SEC` の集計で「〇件追加しました」の1通になります。

この条件は、入力が終わる前に満たされます。  
「コーヒー」まで打って手が止まると 500ms 後に UPDATE が走り、そこでトリガーが発火します。  
続けて「牛乳」を書き足しても、2通目は来ません。

そこで Edge Function は、起動してすぐには送りません。  
`NOTIFY_DELAY_MS` だけ待ってから `items.name` を読み直し、その時点の名前で送ります。  
待っているあいだに「コーヒー牛乳」まで入力が進んでいれば、通知に載るのはそちらです。  
逆に、待っているあいだに削除したアイテム、名前を空にしたアイテム、リピ買いに戻したアイテムは載せません。  
載せるものが1件も残らなければ、通知自体を送りません。

```
入力停止 → 500ms後に UPDATE → トリガー発火 → Edge Function 起動
                                                └→ 60秒待つ → name を読み直す → 送信
```

| 設定                | `.env` の設定例 | 意味                                                                                                                |
| ------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------- |
| `NOTIFY_DELAY_MS`   | 60000           | 名前を読み直すまでの待ち時間。この時間内に書き足した分は通知に反映される。長くすると通知は遅れるが取りこぼしが減る  |
| `NOTIFY_WINDOW_SEC` | 180             | 「〇〇さんが3件追加しました」と数える集計範囲。通知タイミングには影響しない。`NOTIFY_DELAY_MS` より十分長くすること |

どちらも未設定なら Edge Function 側の既定値(1500ms / 90秒)が使われます。  
`.env` を読ませ忘れると通知が数秒で届くので、届く速さで設定漏れに気づけます。

待ち時間はサーバー側で消化するので、**その間にアプリを閉じても通知は送られます**。  
クライアントに依存するのは「入力停止から 500ms 後の UPDATE が DB に届くか」だけです。

`NOTIFY_DELAY_MS` の上限は Edge Function の実行時間です(Free プランで wall clock 150秒)。  
伸ばす場合はこれを超えないようにしてください。

### 通知が届く条件

- iOS では 16.4 以上かつ「ホーム画面に追加」した PWA としてのみ受け取れます。Safari のタブでは動きません。
- HTTPS 必須です。`bun dev` の LAN IP アクセス(`http://192.168.x.x`)では Service Worker ごと動きません。デスクトップ Chrome の `http://localhost:5173` は secure context 扱いなので、そちらでは通知まで検証できます。

## 動作確認の手順

1. サインアップ → リストを作成 → Enter 連打でアイテムを複数入力、チェック ON/OFF
2. アイテム右の「…」で店舗を選択、検索欄に入力して新しい店舗を追加 → 名前の下にお店名が出る
3. 「共有」から招待URLを発行 → シークレットウィンドウで別アカウントを作って参加 → 招待されたリストが選ばれた状態で開く
4. 2 つのウィンドウを並べ、片方での追加やチェックがもう片方に即時反映されることを確認
5. ヘッダーのリスト名を押し、ドロワーから別のリストを選ぶ → そのリストに切り替わる。ドロワー右上の「買い物リストを追加」で作成すると、新しいリストに切り替わる
6. 共有ボタン右の「︙」メニューから名前を変更 → ヘッダーのリスト名が変わる
7. 同じメニューの「メンバー」で、両アカウントとオーナーバッジが表示されることを確認
8. オーナー側のメニューにだけ「リストを削除」が出ることを確認 → 削除すると作成日順で次(最後なら前)のリストに移る
9. 招待された側のメニューには「リストを削除」ではなく「リストから抜ける」が出ることを確認 → 抜けると次(最後なら前)のリストに移り、オーナー側のメンバー一覧から再読み込みなしで消える

### ボトムメニューと「追加」ボタン

1. 下のメニューで3タブを切り替える → 選んだタブにピルが付き、URL が `/`・`/repeat`・`/meals` に変わる。献立は「献立は準備中です」だけが出る
2. リピ買いのタブでヘッダーのリストを切り替えてから買い物リストのタブに戻る → 同じリストが選ばれている
3. アイテムが少ないとき、「追加」は最後の行のすぐ下にある。画面からあふれるまで増やす → 「追加」はボトムメニューの上に張り付く
4. アイテムをチェックして片付けの予告を出す → 「追加」が予告の上に張り付き、末尾までスクロールしても予告の裏に入らない
5. iOS の PWA で、ボトムメニューがホームインジケーターに重ならない
6. 設定・招待の画面にはボトムメニューが出ない

### リピ買いと朝の片付け

1. アイテムの「…」で「リピ買い」を ON → 名前の下に「リピ買い」が出る。下のメニューで「リピ買い」タブを開くと、その品がグレーで ✓ 付きになっている
2. 普通のアイテムとリピ買いをそれぞれチェック → ボトムメニューの上の帯が、チェック済みの中身に合わせて3通りに変わる(普通だけ・両方・リピ買いだけ)。チェックを全部外すと帯が消える
3. リピ買いの「…」で「リピ買いに戻す」→ リストから消え、リピ買いのタブで枠線だけの表示になる。そこで品を2つタップ → 青く選ばれ、下に「買い物リストに登録(2件)」が出る。押す → トーストが出て、2つともリストの末尾に戻りグレーの ✓ 表示になる
4. リピ買いのタブでグレーの ✓ の品をタップ → トーストが出て、リストから外れる
5. 品を選んだままヘッダーでリストを切り替える、または別のタブに移って戻る → 選択が消えている
6. 普通のアイテムの「…」で「削除」→ 消える
7. リピ買いの名前を全部消して Backspace → 行は消えない。そのまま別の場所をタップ → 元の名前に戻る
8. リピ買いのタブの入力欄に無い名前を入れて「追加」→ リピ買いにだけ登録され、リストには出ない。「編集」から名前の変更と削除ができ、編集中は品を選べない
9. SQL Editor で `select public.sweep_bought_items();` を実行 → チェック済みの普通のアイテムが消え、チェック済みのリピ買いはリピ買いのタブに戻る(開いている画面にも Realtime で反映される)

### プッシュ通知

シークレットウィンドウは Push が使えないため、**Chrome の別プロファイル**を使います。

1. 両方のアカウントで `/settings` の「アイテム追加の通知」を ON  
   → `select user_id, endpoint from push_subscriptions;` が2行になる
2. A でアイテム名を入力 → B に通知が出て、A には出ないことを確認
3. A で連続3件入力 → B の通知センターに1件だけ残り「〇〇さんが3件追加しました（…）」になる
4. 通知をタップ → 該当リストが選ばれた状態で開く(既存のブラウザタブがあればフォーカス)。通知先の URL `/lists/:id` はトップへのリダイレクトとして残している
5. A でリピ買いのタブから品を1つ登録する → B に「〇〇さんが「🔁トイレットペーパー」を追加しました」が出る。3つまとめて登録すると「〇〇さんが3件追加しました（…）」の1通になる
6. A でリピ買いに直接登録する → B には通知が出ない。登録してすぐリストから外した場合も出ない

うまくいかないときは、まず pg_net の実行結果を見ます(約6時間で消えます):

```sql
select id, status_code, error_msg, content, created
from net._http_response order by id desc limit 5;
```

| 症状                                | 原因                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 行が増えない                        | トリガーが発火していない。アイテム名が空→非空になったか、Vault の2件が登録済みかを確認                                          |
| `status_code` が 403                | 共有シークレットの不一致。`supabase/functions/.env` の `NOTIFY_SHARED_SECRET` と Vault の `notify_shared_secret` を突き合わせる |
| `status_code` が 202 なのに届かない | Edge Function は受理済み。実際の送信結果は下記のログで確認する                                                                  |

送信結果は **ダッシュボード → Edge Functions → notify-item-added → Logs** に出ます(`NOTIFY_DELAY_MS` の分だけ遅れて記録される点に注意)。

```
notified { listId: "...", sent: 1, items: 2, gone: 0 }
```

| ログ                         | 原因                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ログ自体が出ない             | 送信先が0件。同じリストに自分以外のメンバーがいるか、その人が通知を ON にしているかを確認(自分の追加では自分に通知は飛びません) |
| `sent` が1以上なのに届かない | OS 側で通知がブロックされている。macOS ならシステム設定 → 通知 → Google Chrome を確認                                           |
| `gone` が増える              | 購読が失効していた行を自動削除している。設定画面で通知を ON にし直す                                                            |
| `skipped` が出る             | 送る時点で載せるアイテムが残っていなかった。待っているあいだに削除・名前を空に・リピ買いに戻したアイテムだけだった              |
