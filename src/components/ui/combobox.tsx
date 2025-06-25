"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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

  const selectedLabels = React.useMemo(() => {
    if (!value) return multiple ? [] : "";
    
    if (multiple && Array.isArray(value)) {
      return options
        .filter(option => value.includes(option.value))
        .map(option => option.label);
    }
    
    const selectedOption = options.find(option => option.value === value);
    return selectedOption ? selectedOption.label : "";
  }, [value, options, multiple]);

  const displayValue = multiple && Array.isArray(selectedLabels)
    ? selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder
    : selectedLabels || placeholder;


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between", className)}
        >
          <span className="truncate">
            {displayValue}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>{isLoading ? "Loading..." : "No options found."}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      multiple
                        ? Array.isArray(value) && value.includes(option.value) ? "opacity-100" : "opacity-0"
                        : value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.color && (
                    <span
                      className="mr-2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.label}
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