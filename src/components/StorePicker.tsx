import { useState, type MouseEvent, type SubmitEvent } from "react";
import { Pencil, Trash2, CircleMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "./ui/label";
import type { Store } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  stores: Store[];
  selected: Store | null;
  onSelect: (storeId: string | null) => void;
  onAddStore: (name: string) => string;
  onRenameStore: (storeId: string, name: string) => void;
  onDeleteStore: (storeId: string) => void;
};

export function StorePicker({
  stores,
  selected,
  onSelect,
  onAddStore,
  onRenameStore,
  onDeleteStore,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [storeToEdit, setStoreToEdit] = useState<Store | null>(null);
  const [editName, setEditName] = useState("");
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

  const trimmed = search.trim();
  const canCreate = trimmed !== "" && !stores.some((s) => s.name === trimmed);
  const filtered =
    trimmed === ""
      ? stores
      : stores.filter((s) =>
          s.name.toLowerCase().includes(trimmed.toLowerCase()),
        );

  const close = () => {
    setOpen(false);
    setSearch("");
  };

  const handleCreate = () => {
    const id = onAddStore(trimmed);
    onSelect(id);
    close();
  };

  const handleRename = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!storeToEdit) return;
    const name = editName.trim();
    if (!name) return;
    if (name !== storeToEdit.name) onRenameStore(storeToEdit.id, name);
    setStoreToEdit(null);
  };

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
        showSwipeHandle={true}
      >
        <DrawerTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn("text-xs", !selected && "border-dashed")}
            />
          }
        >
          {selected ? `${selected.name}` : "お店未選択"}
        </DrawerTrigger>
        <DrawerContent initialFocus={false}>
          <DrawerHeader>
            <DrawerTitle>お店を選択</DrawerTitle>
          </DrawerHeader>
          <div className="grid gap-4 overflow-y-auto p-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="お店を追加 or 検索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="leading-none flex-1"
              />
              <Button
                size="lg"
                variant={canCreate ? "default" : "outline"}
                onClick={handleCreate}
                disabled={!canCreate}
                className="shrink-0"
              >
                追加
              </Button>
            </div>
            {filtered.length === 0 ? (
              <p className="py-6 text-xs">お店が見つかりません</p>
            ) : (
              <RadioGroup
                value={selected?.id ?? ""}
                onValueChange={(value) => {
                  onSelect(value as string);
                  close();
                }}
                className="grid grid-cols-2 gap-2"
              >
                {filtered.map((store) => (
                  <div
                    key={store.id}
                    className="grid grid-cols-[1fr_auto] items-center bg-muted rounded-full p-1 outline-2 outline-transparent outline-offset-2 has-data-checked:outline-primary"
                  >
                    <div className="flex items-center gap-2 px-2.5">
                      <RadioGroupItem
                        value={store.id}
                        id={store.id}
                        className="hidden"
                      />
                      <Label htmlFor={store.id} className="text-xs flex-1">
                        {store.name}
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${store.name}を編集`}
                      onClick={(e: MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setStoreToEdit(store);
                        setEditName(store.name);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
            )}
            {selected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSelect(null);
                  close();
                }}
                className="w-fit"
              >
                <CircleMinus data-icon="inline-start" />
                <span className="text-trim">
                  選択中のお店を解除（{selected.name}）
                </span>
              </Button>
            )}
          </div>
          <Drawer
            open={!!storeToEdit}
            onOpenChange={(next) => {
              if (!next) setStoreToEdit(null);
            }}
            showSwipeHandle={true}
          >
            <DrawerContent initialFocus={false}>
              <DrawerHeader>
                <DrawerTitle>"{storeToEdit?.name}"を編集</DrawerTitle>
              </DrawerHeader>
              <form
                onSubmit={handleRename}
                className="grid gap-5 overflow-y-auto p-4"
              >
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="お店の名前"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="leading-none flex-1"
                  />
                  <Button
                    type="submit"
                    size="lg"
                    variant={editName.trim() !== "" ? "default" : "outline"}
                    disabled={editName.trim() === ""}
                    className="shrink-0"
                  >
                    保存
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-fit mx-auto"
                  onClick={() => setStoreToDelete(storeToEdit)}
                >
                  <Trash2 data-icon="inline-start" />
                  <span className="text-trim">削除</span>
                </Button>
              </form>

              <Drawer
                open={!!storeToDelete}
                onOpenChange={(next) => {
                  if (!next) setStoreToDelete(null);
                }}
                showSwipeHandle={true}
              >
                <DrawerContent initialFocus={false}>
                  <DrawerHeader>
                    <DrawerTitle>
                      "{storeToDelete?.name}"を削除しますか?
                    </DrawerTitle>
                    <DrawerDescription>
                      このお店を選択しているアイテムからも外れます。
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="flex flex-col gap-2 p-4 w-64  mx-auto">
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={() => {
                        if (storeToDelete) onDeleteStore(storeToDelete.id);
                        setStoreToDelete(null);
                        setStoreToEdit(null);
                      }}
                    >
                      削除
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => setStoreToDelete(null)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </DrawerContent>
              </Drawer>
            </DrawerContent>
          </Drawer>
        </DrawerContent>
      </Drawer>
    </>
  );
}
