"use client"

import * as React from "react"
import { format, isValid } from "date-fns"
import { Calendar as CalendarIcon, X, CalendarCheck2 } from "lucide-react"

import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface PresetOption {
  label: string
  getDate: () => Date
}

export interface GlobalCalendarProps {
  /**
   * The selected date value (Date object, date string, or null/undefined).
   * Can be formatted date string like "January 01, 2025", "2025-01-01", etc.
   */
  value?: Date | string | null
  /**
   * Default initial date when uncontrolled
   */
  defaultValue?: Date | string | null
  /**
   * Callback fired when a date is selected or cleared.
   * Returns the Date object (or undefined) and the formatted string (or "").
   */
  onChange?: (date: Date | undefined, formattedDate: string) => void
  /**
   * Shorthand callback for string-based form states (e.g. handleFormChange("startDate", val))
   */
  onValueChange?: (formattedDate: string) => void
  /**
   * Date format string using date-fns tokens.
   * Default: "MMMM dd, yyyy" (e.g. "January 01, 2025")
   */
  formatStr?: string
  /**
   * Placeholder text shown when no date is selected.
   * Default: "Pick a date"
   */
  placeholder?: string
  /**
   * Label rendered above the trigger button
   */
  label?: string
  /**
   * Display size variant
   */
  size?: "sm" | "default" | "lg"
  /**
   * Whether the calendar picker is disabled
   */
  disabled?: boolean
  /**
   * Optional error message or boolean indicating invalid state
   */
  error?: boolean | string
  /**
   * Whether to show a clear 'X' button when a date is selected
   * Default: true
   */
  clearable?: boolean
  /**
   * Minimum selectable date
   */
  minDate?: Date
  /**
   * Maximum selectable date
   */
  maxDate?: Date
  /**
   * Function to disable specific dates
   */
  disabledDates?: (date: Date) => boolean
  /**
   * Whether to show quick preset buttons (e.g., Today, Yesterday, Tomorrow)
   * Default: false
   */
  showPresets?: boolean
  /**
   * Custom preset list
   */
  presets?: PresetOption[]
  /**
   * Display mode: "popover" (dropdown trigger) or "inline" (standalone card)
   * Default: "popover"
   */
  variant?: "popover" | "inline"
  /**
   * Custom class names for the trigger button
   */
  className?: string
  /**
   * Custom class names for the popover content card
   */
  popoverClassName?: string
  /**
   * Alignment of the popover relative to the trigger
   * Default: "start"
   */
  align?: "start" | "center" | "end"
  /**
   * Whether to show the calendar icon on the left
   * Default: true
   */
  showIcon?: boolean
  /**
   * Custom class name for the calendar icon
   */
  iconClassName?: string
  /**
   * Field name attribute (includes a hidden input for form submissions)
   */
  name?: string
  /**
   * Required field indicator
   */
  required?: boolean
  /**
   * ID attribute for label linking
   */
  id?: string
  /**
   * Additional props passed directly to shadcn Calendar
   */
  calendarProps?: Partial<React.ComponentProps<typeof Calendar>>
}

const DEFAULT_PRESETS: PresetOption[] = [
  {
    label: "Today",
    getDate: () => new Date(),
  },
  {
    label: "Yesterday",
    getDate: () => {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return d
    },
  },
  {
    label: "Tomorrow",
    getDate: () => {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      return d
    },
  },
  {
    label: "1st of Month",
    getDate: () => {
      const d = new Date()
      d.setDate(1)
      return d
    },
  },
]

/**
 * Safely parse a Date, string, or null/undefined into a valid Date object.
 */
function parseSafeDate(val: Date | string | null | undefined): Date | undefined {
  if (!val) return undefined
  if (val instanceof Date) {
    return isValid(val) ? val : undefined
  }
  if (typeof val === "string") {
    const trimmed = val.trim()
    if (!trimmed) return undefined
    const parsed = new Date(trimmed)
    if (isValid(parsed)) return parsed
  }
  return undefined
}

export function GlobalCalendar({
  value,
  defaultValue,
  onChange,
  onValueChange,
  formatStr = "MMMM dd, yyyy",
  placeholder = "Pick a date",
  label,
  size = "default",
  disabled = false,
  error,
  clearable = true,
  minDate,
  maxDate,
  disabledDates,
  showPresets = false,
  presets = DEFAULT_PRESETS,
  variant = "popover",
  className,
  popoverClassName,
  align = "start",
  showIcon = true,
  iconClassName,
  name,
  required = false,
  id,
  calendarProps,
}: GlobalCalendarProps) {
  const [open, setOpen] = React.useState(false)
  const isControlled = value !== undefined

  // Internal date state
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(() => {
    return parseSafeDate(isControlled ? value : defaultValue)
  })

  // Synchronize internal state when controlled value changes
  React.useEffect(() => {
    if (isControlled) {
      setInternalDate(parseSafeDate(value))
    }
  }, [value, isControlled])

  const selectedDate = isControlled ? parseSafeDate(value) : internalDate

  const formattedDate = React.useMemo(() => {
    if (!selectedDate || !isValid(selectedDate)) return ""
    try {
      return format(selectedDate, formatStr)
    } catch {
      return ""
    }
  }, [selectedDate, formatStr])

  const handleSelectDate = (date: Date | undefined) => {
    if (!isControlled) {
      setInternalDate(date)
    }
    const formatted = date && isValid(date) ? format(date, formatStr) : ""
    onChange?.(date, formatted)
    onValueChange?.(formatted)
    if (variant === "popover") {
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!isControlled) {
      setInternalDate(undefined)
    }
    onChange?.(undefined, "")
    onValueChange?.("")
  }

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return true
    if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999))) return true
    if (disabledDates && disabledDates(date)) return true
    return false
  }

  // Size specific styles
  const sizeStyles = {
    sm: "h-8 px-2.5 text-xs rounded-lg gap-1.5",
    default: "h-9 px-3 text-xs sm:text-sm rounded-lg gap-2",
    lg: "h-10 px-3.5 text-sm rounded-xl gap-2.5",
  }[size]

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    default: "h-4 w-4",
    lg: "h-4 w-4",
  }[size]

  // Inline mode renders calendar directly
  if (variant === "inline") {
    return (
      <div className={cn("space-y-1.5", className)}>
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          {showPresets && (
            <div className="mb-2 flex flex-wrap gap-1.5 border-b border-slate-100 pb-2 dark:border-slate-800">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="xs"
                  className="h-6 text-[11px]"
                  onClick={() => handleSelectDate(preset.getDate())}
                >
                  {preset.label}
                </Button>
              ))}
              {clearable && selectedDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-6 text-[11px] text-rose-500 hover:text-rose-600"
                  onClick={handleClear}
                >
                  Clear
                </Button>
              )}
            </div>
          )}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            disabled={isDateDisabled}
            {...(calendarProps as any)}
          />
        </div>
        {typeof error === "string" && (
          <p className="text-[11px] text-rose-500">{error}</p>
        )}
      </div>
    )
  }

  // Popover mode (default dropdown trigger)
  return (
    <div className="w-full space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}

      {name && (
        <input
          type="hidden"
          name={name}
          value={formattedDate}
          required={required}
        />
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-between border-slate-200 bg-white font-normal text-slate-900 shadow-none hover:bg-slate-50 hover:text-slate-900 focus-visible:border-[#0090FF] focus-visible:ring-2 focus-visible:ring-[#0090FF]/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800/80",
              sizeStyles,
              !selectedDate && "text-slate-400 dark:text-slate-500",
              Boolean(error) && "border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-500/20",
              className
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {showIcon && (
                <CalendarIcon
                  className={cn(
                    iconSizes,
                    selectedDate ? "text-[#0090FF]" : "text-slate-400",
                    iconClassName
                  )}
                />
              )}
              <span className="truncate">
                {formattedDate || placeholder}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {clearable && selectedDate && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear date"
                  onClick={handleClear}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleClear(e as any)
                    }
                  }}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align={align}
          sideOffset={6}
          className={cn(
            "z-[70] w-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-950",
            popoverClassName
          )}
        >
          {showPresets && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Quick:
              </span>
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="xs"
                  className="h-6 text-[11px] rounded-md border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                  onClick={() => handleSelectDate(preset.getDate())}
                >
                  {preset.label}
                </Button>
              ))}
              {clearable && selectedDate && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="h-6 text-[11px] text-rose-500 hover:bg-rose-50 hover:text-rose-600 ml-auto"
                  onClick={handleClear}
                >
                  Clear
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col items-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              disabled={isDateDisabled}
              initialFocus
              {...(calendarProps as any)}
            />

            <div className="mt-2 flex w-full items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800">
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <CalendarCheck2 className="h-3 w-3 text-[#0090FF]" />
                {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "No date selected"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="h-5 px-1.5 text-[11px] font-medium text-[#0090FF] hover:bg-blue-50 hover:text-[#0080e5] dark:hover:bg-blue-950/40"
                onClick={() => handleSelectDate(new Date())}
              >
                Today
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {typeof error === "string" && (
        <p className="text-[11px] text-rose-500">{error}</p>
      )}
    </div>
  )
}

export { GlobalCalendar as DatePicker }
export default GlobalCalendar
