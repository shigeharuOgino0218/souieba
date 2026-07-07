import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import type { Store } from '@/lib/types'

type Props = {
  stores: Store[]
  selected: Store | null
  onSelect: (storeId: string | null) => void
  onAddStore: (name: string) => string
}

export function StorePicker({ stores, selected, onSelect, onAddStore }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const trimmed = search.trim()
  const canCreate = trimmed !== '' && !stores.some((s) => s.name === trimmed)

  const close = () => {
    setOpen(false)
    setSearch('')
  }

  const handleCreate = () => {
    const id = onAddStore(trimmed)
    onSelect(id)
    close()
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSearch('')
      }}
    >
      <PopoverTrigger asChild>
        {selected ? (
          <Badge variant="secondary" className="shrink-0 cursor-pointer">
            {selected.name}
          </Badge>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs text-muted-foreground"
          >
            <Plus className="size-3" />
            お店
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="end">
        <Command>
          <CommandInput
            placeholder="お店を検索・追加"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>お店が見つかりません</CommandEmpty>
            <CommandGroup>
              {stores.map((store) => (
                <CommandItem
                  key={store.id}
                  value={store.name}
                  onSelect={() => {
                    onSelect(store.id)
                    close()
                  }}
                >
                  <Check
                    className={cn(
                      'size-4',
                      selected?.id === store.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {store.name}
                </CommandItem>
              ))}
            </CommandGroup>
            {(canCreate || selected) && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  {canCreate && (
                    <CommandItem value={`__add__${trimmed}`} onSelect={handleCreate}>
                      <Plus className="size-4" />
                      「{trimmed}」を追加
                    </CommandItem>
                  )}
                  {selected && (
                    <CommandItem
                      value="__clear__"
                      onSelect={() => {
                        onSelect(null)
                        close()
                      }}
                    >
                      <X className="size-4" />
                      お店を外す
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
