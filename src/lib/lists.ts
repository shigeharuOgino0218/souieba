/**
 * HomePage のタブ選択を決める純粋関数群。
 * 個別のリストを開く URL (/lists/:id) は HomePage へのリダイレクトになっており、
 * 開きたいリストの ID は location.state で受け渡す。
 */

export type HomeLocationState = { listId: string }

/** location.state から開きたいリストの ID を取り出す。history 経由で来るため形は保証されない。 */
export function readRequestedListId(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('listId' in state)) {
    return null
  }
  return typeof state.listId === 'string' ? state.listId : null
}

/** 最初に選ぶタブ。開きたいリスト → 最後に使っていたリスト → 先頭の順に、存在するものを選ぶ。 */
export function pickInitialListId(
  ids: string[],
  requestedId: string | null,
  lastId: string | null,
): string | null {
  if (requestedId && ids.includes(requestedId)) return requestedId
  if (lastId && ids.includes(lastId)) return lastId
  return ids[0] ?? null
}

/** リストを取り除いた後に選ぶタブ。選択中のものが消えたら右隣、なければ左隣に移す。 */
export function pickAfterRemoval(
  ids: string[],
  removedId: string,
  activeId: string | null,
): string | null {
  if (activeId !== removedId) return activeId
  const index = ids.indexOf(removedId)
  if (index === -1) return activeId
  return ids[index + 1] ?? ids[index - 1] ?? null
}
