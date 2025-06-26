"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/utils/css"
import { Button } from "@/components/ui/Button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "./badge"

interface ComboboxOption {
  value: string;
  label: string;
  color?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  isLoading?: boolean;
  className?: string;
}

const Combobox = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  multiple = false,
  isLoading = false,
  className,
}: ComboboxProps) => {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (currentValue: string) => {
    if (multiple && Array.isArray(value)) {
      const newValues = value.includes(currentValue)
        ? value.filter((v) => v !== currentValue)
        : [...value, currentValue];
      onChange(newValues);
    } else {
      onChange(currentValue === value ? "" : currentValue);
      setOpen(false)
    }
  }

  const selectedOptions = React.useMemo(() => {
    if (!value) return [];
    const valueAsArray = Array.isArray(value) ? value : [value];
    return options.filter(option => valueAsArray.includes(option.value));
  }, [value, options]);

  const handleRemove = (selectedValue: string) => {
    if (multiple && Array.isArray(value)) {
      onChange(value.filter((v) => v !== selectedValue));
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between h-auto", className)}
        >
          <div className="flex-1 flex flex-wrap gap-1 items-center">
            {selectedOptions.length > 0 ? (
              <>
                {multiple ? (
                  selectedOptions.map(option => (
                    <Badge key={option.value} variant="secondary" className="pl-2">
                       {option.color && (
                        <span
                          className="mr-2 h-2 w-2 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                      {option.label}
                      <button
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(option.value);
                        }}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <div className="flex items-center">
                    {selectedOptions[0].color && (
                      <span
                        className="mr-2 h-2 w-2 rounded-full"
                        style={{ backgroundColor: selectedOptions[0].color }}
                      />
                    )}
                    {selectedOptions[0].label}
                  </div>
                )}
              </>
            ) : (
              placeholder
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>{isLoading ? "Loading..." : "No options found."}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  {option.color && (
                    <span
                      className="mr-2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedOptions.some(so => so.value === option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { Combobox } 