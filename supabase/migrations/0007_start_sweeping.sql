-- リピ買いの公開に合わせて、既存データを移行し、朝の片付けを始める。
-- 新クライアントを公開してから `bun run db:migrate` で適用すること。
-- 旧クライアントはドロワーを知らないので、先に適用するとドロワーにしまったアイテムが
-- 旧クライアントでは未購入として見えてしまう。そのため 0006 と分けている。

-- これまでチェック済みのまま残っていたアイテムは、チェックを外して使い回していた定番品の可能性が高い。
-- 朝の片付けで消してしまわないよう、リピ買いにしてドロワーにしまう。名前が空のものは使い道がないので消す
delete from public.items where checked and btrim(name) = '';
update public.items set repeat = true, shelved = true, checked = false where checked;

create extension if not exists pg_cron with schema pg_catalog;

-- pg_cron の時刻は UTC なので、日本時間の朝 4:00 は UTC 19:00
select cron.schedule('sweep-bought-items', '0 19 * * *', 'select public.sweep_bought_items()');
