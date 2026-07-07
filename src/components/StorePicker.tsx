import { useState, type MouseEvent } from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "./ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Store } from "@/lib/types";


type Props = {
  stores: Store[];
  selected: Store | null;
  onSelect: (storeId: string | null) => void;
  onAddStore: (name: string) => string;
  onDeleteStore: (storeId: string) => void;
};

export function StorePicker({
  stores,
  selected,
  onSelect,
  onAddStore,
  onDeleteStore,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
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
            <Button variant={selected ? "default" : "outline"} size="xs" />
          }
        >
          {selected ? selected.name : "お店未選択"}
        </DrawerTrigger>
        <DrawerContent initialFocus={false}>
          <DrawerHeader>
            <DrawerTitle>お店を選択</DrawerTitle>
          </DrawerHeader>
          <div className="grid gap-4 overflow-y-auto p-4">
            <Input
              placeholder="お店を検索・追加"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {filtered.length === 0 ? (
              <p className="p-4 border border-border rounded-lg text-center text-xs text-muted-foreground">
                お店が見つかりません
              </p>
            ) : (
              <RadioGroup
                value={selected?.id ?? ""}
                onValueChange={(value) => {
                  onSelect(value as string);
                  close();
                }}
                className="grid grid-cols-2 gap-1"
              >
                {filtered.map((store) => (
                  <div
                    key={store.id}
                    className="grid grid-cols-[1fr_auto] items-center border border-border rounded-lg p-2"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value={store.id} id={store.id} />
                      <Label htmlFor={store.id} className="text-xs">{store.name}</Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="hover:text-destructive"
                      aria-label={`${store.name}を削除`}
                      onClick={(e: MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        close();
                        setStoreToDelete(store);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
            )}
            {(canCreate || selected) && (
              <div className="flex flex-col gap-2">
                {canCreate && (
                  <Button onClick={handleCreate}>
                    "{trimmed}" を追加
                  </Button>
                )}
                {selected && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      onSelect(null);
                      close();
                    }}
                  >
                    <X className="size-4" />
                    お店を外す
                  </Button>
                )}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog
        open={!!storeToDelete}
        onOpenChange={(next) => {
          if (!next) setStoreToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              「{storeToDelete?.name}」を削除しますか?
            </AlertDialogTitle>
            <AlertDialogDescription>
              このお店をタグ付けしているアイテムからも外れます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (storeToDelete) onDeleteStore(storeToDelete.id);
                setStoreToDelete(null);
              }}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
