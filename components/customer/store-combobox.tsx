"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { StoreOption } from "@/types/billing";

interface StoreComboboxProps {
  stores: StoreOption[];
  value: string; // storeId
  onChange: (storeId: string, store: StoreOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
}

export function StoreCombobox({
  stores,
  value,
  onChange,
  disabled = false,
  placeholder = "Search store...",
  error = false,
}: StoreComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = stores.find((s) => s.storeId === value) ?? null;

  function handleSelect(store: StoreOption) {
    const next = store.storeId === value ? null : store;
    onChange(next?.storeId ?? "", next);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full h-11 justify-between font-normal text-sm",
            !selected && "text-slate-500",
            error && "!border-2 !border-red-500 focus-visible:!ring-red-500/20 !text-red-500"
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Store className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="truncate">
              {selected ? `${selected.storeName} – ${selected.location}` : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or location..." className="h-9" />
          <CommandList>
            <CommandEmpty>No stores found.</CommandEmpty>
            <CommandGroup>
              {stores.map((store) => (
                <CommandItem
                  key={store.storeId}
                  value={`${store.storeName} ${store.location} ${store.storeId}`}
                  onSelect={() => handleSelect(store)}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      store.storeId === value ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{store.storeName}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {store.location}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
