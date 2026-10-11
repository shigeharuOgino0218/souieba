/**
 * 複数行のテキストを貼り付けたときに、アイテム名の配列へ分ける純粋関数群。
 * メモアプリや Notion からコピーしたテキストには空行や行頭の箇条書き記号が混ざるので、それを落としてから分ける。
 */

// 行頭の箇条書き記号とチェックボックス。番号は「1.5L」のような名前を削らないよう、直後が数字のものは除く
const LIST_MARKER =
  /^(?:[-*•●・□☐☑✓✔]\s*(?:\[[ xX]\]\s*)?|\[[ xX]\]\s*|\d+[.)．）](?!\d)\s*)/

/** 貼り付けたテキストを、アイテム名として使える行に分ける。空行と行頭の記号は捨て、行中のタブはスペースにする */
export function splitPastedLines(text: string): string[] {
  return text
    .split(/\r\n|\r|\n/)
    .map((line) =>
      line.replace(/\t/g, ' ').trim().replace(LIST_MARKER, '').trim(),
    )
    .filter((line) => line !== '')
}
