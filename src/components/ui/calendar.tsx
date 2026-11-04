import React, { useState } from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { useReplay } from "@/presentation/hooks/useReplay"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

/* ------------------------------------------------------------------ */
/* Custom Select / Option components — replace react-day-picker's     */
/* native <select> so the month/year dropdowns match the app design   */
/* (same glass surface, border, hover/active states as MemberPicker   */
/* and FormSelect). The native <select> popup cannot be styled with   */
/* CSS, so we render our own dropdown menu with <button> items.       */
/* ------------------------------------------------------------------ */

function CustomSelect(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children?: React.ReactNode }) {
  const { className, children, value, onChange, disabled } = props
  const [open, setOpen] = useState(false)
  const options = React.Children.toArray(children) as React.ReactElement<
    { value: string | number; label?: string; disabled?: boolean; children?: React.ReactNode }
  >[]
  const selectedValue = value ?? ''
  const selectedOption = options.find((o) => String(o.props.value) === String(selectedValue))
  function handleOptionSelect(val: string | number) {
    setOpen(false)
    const event = {
      target: { value: val },
      preventDefault: () => {},
      stopPropagation: () => {},
      persist: () => {},
    } as React.ChangeEvent<HTMLSelectElement>
    onChange?.(event)
  }

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) setOpen((prev: boolean) => !prev)
        }}
        className={cn(
          "w-full flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm text-text text-left transition-colors",
          "hover:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <span className="truncate">{String(selectedOption?.props.children ?? selectedValue)}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 text-text-secondary" />
      </button>
      {open && options.length > 0 && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full min-w-32 max-w-sm rounded-md border border-border bg-surface backdrop-blur-md shadow-lg",
            "flex flex-col max-h-[70vh] overflow-y-auto",
            disabled && "opacity-50 pointer-events-none"
          )}
        >
          {options.map((opt) => {
            const isSelected = String(opt.props.value) === String(selectedValue)
            return (
              <button
                key={opt.props.value}
                type="button"
                disabled={opt.props.disabled || disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  handleOptionSelect(opt.props.value)
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors",
                  "text-text",
                  isSelected
                    ? "bg-gradient-to-r from-primary via-primary to-primary-deep text-text-on-primary"
                    : "hover:bg-wash-8 hover:text-text",
                  opt.props.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <span>{String(opt.props.children)}</span>
                {isSelected && (
                  <span className="size-2.5 shrink-0 text-text-on-primary">
                    <ChevronDownIcon size={16} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()
  const [navKey, replayNav] = useReplay()

  /* Bound the navigation range so the year dropdown stays short (a money app
     rarely needs dates more than ~60 years in the past). Callers can override
     via props.startMonth / props.endMonth. */
  const today = new Date()
  const startMonth = props.startMonth ?? new Date(today.getFullYear() - 60, 0, 1)
  const endMonth = props.endMonth ?? new Date(today.getFullYear() + 10, 11, 31)

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      onMonthChange={(month) => { replayNav(); props.onMonthChange?.(month); }}
      className={cn(
        "group/calendar bg-transparent p-1 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(9)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          `${navKey > 0 ? 'anim-nudge' : ''}`,
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
          `${navKey > 0 ? 'anim-nudge' : ''}`,
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        /* Container for the CustomSelect month/year trigger. The custom trigger
           button (+ its dropdown menu) must be clickable, so `pointer-events-none`
           is removed here — it previously blocked all interaction on the dropdowns.
           Visual styling (border/bg/padding) is provided by CustomSelect itself,
           so this stays a plain layout container to avoid double borders. */
        dropdown_root: cn(
          "relative flex items-center gap-2",
          defaultClassNames.dropdown_root
        ),
        /* The native <select> is replaced by CustomSelect, which renders its own
           visible trigger + dropdown menu. Keep `dropdown` neutral so it does not
           hide (opacity-0) or absolutely-position/restyle the custom trigger button. */
        dropdown: cn(defaultClassNames.dropdown),
        /* Hidden — CustomSelect renders its own visible trigger + dropdown menu. */
        caption_label: cn("hidden", defaultClassNames.caption_label),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius)",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-(--cell-radius)"
            : "[&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
          defaultClassNames.day
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
          defaultClassNames.range_end
        ),
        today: cn(
          "rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...restProps }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...restProps}
            />
          )
        },
        Chevron: ({ className, orientation, ...restProps }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon key={navKey} className={cn("size-4", className)} {...restProps} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon key={navKey} className={cn("size-4", className)} {...restProps} />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...restProps} />
          )
        },
        DayButton: ({ ...restProps }) => (
          <CalendarDayButton locale={locale} {...restProps} />
        ),
        WeekNumber: ({ children, ...restProps }) => {
          return (
            <td {...restProps}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        Select: CustomSelect,
        ...components,
      }}
      {...props}
      startMonth={startMonth}
      endMonth={endMonth}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-medium group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground hover:bg-accent hover:text-foreground [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
