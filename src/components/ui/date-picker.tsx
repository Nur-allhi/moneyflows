import { useState, useEffect } from "react"
import { CalendarIcon } from "lucide-react"
import { parse, isValid } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function DatePicker({ value, onChange, className }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  function toLocalDate(iso: string): Date {
    const parts = iso.split("-")
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  }

  function toLocalISO(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  const date = value ? toLocalDate(value) : undefined

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.trim()
    setInputValue(val)
    if (!val) {
      onChange("")
      return
    }
    // Accept ISO format YYYY-MM-DD for manual entry
    const parsed = parse(val, "yyyy-MM-dd", new Date())
    if (isValid(parsed)) {
      onChange(toLocalISO(parsed))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className="h-auto w-full bg-transparent px-0 py-0 text-sm outline-none placeholder:text-muted-foreground"
          placeholder="YYYY-MM-DD"
          autoComplete="off"
          spellCheck={false}
        />
        <PopoverTrigger>
          <Button variant="outline" size="icon" className="shrink-0">
            <CalendarIcon className="size-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-3 backdrop-blur-xl border border-white/10 shadow-lg" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              onChange(toLocalISO(d))
              setOpen(false)
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
