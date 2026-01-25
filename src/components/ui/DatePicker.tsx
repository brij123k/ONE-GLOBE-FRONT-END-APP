// components/ui/date-picker-shadcn.tsx
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({
  date,
  onSelect,
  className,
  placeholder = "Pick a date",
  disabled = false,
}: DatePickerProps) {
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(undefined)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-white hover:bg-gray-50 border-gray-300",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : placeholder}
          {date && (
            <button
              onClick={handleClear}
              className="ml-auto hover:bg-gray-100 rounded-sm p-1"
              type="button"
            >
              <span className="sr-only">Clear</span>
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
          className="p-3 pointer-events-auto"
        />
        <div className="flex gap-2 p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect?.(new Date())}
            className="flex-1"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect?.(undefined)}
            className="flex-1"
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}