import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useListData } from "@/hooks/useListData";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemRow } from "@/components/ItemRow";

export const LAST_LIST_KEY = "souieba:lastListId";

export function ListEditor({
  listId,
  action,
}: {
  listId: string;
  action?: ReactNode;
}) {
  const { session } = useAuth();
  const {
    items,
    stores,
    loading,
    addItem,
    updateItemName,
    toggleChecked,
    setItemStore,
    deleteItem,
    addStore,
    deleteStore,
  } = useListData(listId, session!.user.id);

  useEffect(() => {
    localStorage.setItem(LAST_LIST_KEY, listId);
  }, [listId]);

  const inputRefs = useRef(new Map<string, HTMLInputElement>());
  const registerInput = useCallback(
    (id: string, el: HTMLInputElement | null) => {
      if (el) inputRefs.current.set(id, el);
      else inputRefs.current.delete(id);
    },
    [],
  );

  const [focusId, setFocusId] = useState<string | null>(null);
  useEffect(() => {
    if (!focusId) return;
    const el = inputRefs.current.get(focusId);
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      setFocusId(null);
    }
  }, [focusId, items]);

  const handleEnter = (id: string) => setFocusId(addItem(id));
  const handleAdd = () => setFocusId(addItem());

  const handleBackspaceEmpty = (id: string) => {
    const idx = items.findIndex((i) => i.id === id);
    const prev = items[idx - 1];
    deleteItem(id);
    if (prev) setFocusId(prev.id);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            stores={stores}
            onNameChange={updateItemName}
            onToggle={toggleChecked}
            onEnter={handleEnter}
            onBackspaceEmpty={handleBackspaceEmpty}
            onSetStore={setItemStore}
            onAddStore={addStore}
            onDeleteStore={deleteStore}
            registerInput={registerInput}
          />
        ))}
      </div>
      <Separator />
      <div className="mt-1 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start gap-2 text-muted-foreground"
          onClick={handleAdd}
        >
          <Plus className="size-4" />
          アイテムを追加
        </Button>
        {action}
      </div>
    </div>
  );
}
