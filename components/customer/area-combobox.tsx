"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
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

interface AreaComboboxProps {
  areas: string[];
  value: string;
  onChange: (area: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
}

export function AreaCombobox({
  areas,
  value,
  onChange,
  disabled = false,
  placeholder = "Select area...",
  error = false,
}: AreaComboboxProps) {
  const [open, setOpen] = useState(false);

  // Allow custom text entry by passing value even if not in the list
  const selected = value || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || areas.length === 0}
          className={cn(
            "w-full h-10 justify-between font-normal text-sm",
            !selected && "text-slate-500",
            disabled && "cursor-not-allowed opacity-50",
            error && "!border-2 !border-red-500 focus-visible:!ring-red-500/20 !text-red-500"
          )}
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="truncate">
              {selected ? selected : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search area..." className="h-9" />
          <CommandList>
            <CommandEmpty>No areas found.</CommandEmpty>
            <CommandGroup>
              {areas.map((area, i) => (
                <CommandItem
                  key={i}
                  value={area}
                  onSelect={() => {
                    onChange(area);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      area === value ? "opacity-100 text-blue-600" : "opacity-0"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{area}</p>
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
