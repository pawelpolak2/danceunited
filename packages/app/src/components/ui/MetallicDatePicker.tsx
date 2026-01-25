import type React from 'react'
import DatePicker, { type DatePickerProps } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import './MetallicDatePicker.css'
import { format } from 'date-fns'

interface MetallicDatePickerProps extends Omit<DatePickerProps, 'onChange'> {
  onChange: (date: Date | null) => void // Enforce simpler onChange for ease of use
  label?: string
  className?: string
  wrapperClassName?: string
  id?: string
}

export const MetallicDatePicker: React.FC<MetallicDatePickerProps> = ({
  onChange,
  className = '',
  wrapperClassName = '',
  label,
  id,
  dateFormat = 'PPP',
  // Exclude props that conflict with single-date mode
  // biome-ignore lint/correctness/noUnusedVariables: Excluded from spread
  selectsMultiple,
  // biome-ignore lint/correctness/noUnusedVariables: Excluded from spread
  selectsRange,
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={id} className="font-cinzel text-amber-100/60 text-sm">
          {label}
        </label>
      )}
      <div className="metallic-datepicker-wrapper relative">
        <DatePicker
          id={id}
          onChange={(date: any) => {
            // Handle single date selection only for now as per interface
            if (date instanceof Date || date === null) {
              onChange(date)
            }
          }}
          className={`metallic-datepicker-input ${className}`}
          dateFormat={dateFormat}
          renderCustomHeader={({
            date,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div className="flex items-center justify-center gap-4 px-2 py-2">
              <button
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
                type="button"
                className="text-amber-100/60 transition-colors hover:text-gold disabled:opacity-30"
                aria-label="Previous Month"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="font-bold font-cinzel text-gold text-lg">{format(date, 'MMMM yyyy')}</div>
              <button
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
                type="button"
                className="text-amber-100/60 transition-colors hover:text-gold disabled:opacity-30"
                aria-label="Next Month"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          {...props}
        />
        <Calendar className="metallic-calendar-icon" />
      </div>
    </div>
  )
}
