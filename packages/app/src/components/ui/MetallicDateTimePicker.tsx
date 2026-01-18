import { format } from 'date-fns'
import { CalendarIcon, Clock } from 'lucide-react'
import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

interface MetallicDateTimePickerProps {
  date?: Date
  setDate: (date: Date) => void
  label?: string
  className?: string
}

export function MetallicDateTimePicker({
  date,
  setDate,
  label = 'Pick a date',
  className = '',
}: MetallicDateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Sync internal state with prop
  React.useEffect(() => {
    setSelectedDate(date)
  }, [date])

  // Click outside to close
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return
    const newDate = new Date(day)
    // Preserve time if existing date
    if (selectedDate) {
      newDate.setHours(selectedDate.getHours())
      newDate.setMinutes(selectedDate.getMinutes())
    } else {
      newDate.setHours(12, 0) // Default noon
    }
    setSelectedDate(newDate)
    setDate(newDate)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    if (!timeValue) return
    const [hours, minutes] = timeValue.split(':').map(Number)
    const newDate = new Date(selectedDate || new Date())
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    setSelectedDate(newDate)
    setDate(newDate)
  }

  // Generate gold arrow SVG for select background
  const arrowSvg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#ffd700' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>`
  )

  const cssOverrides = `
    /* Root Variables & General overrides */
    .rdp {
      --rdp-cell-size: 36px;
      --rdp-accent-color: #ffd700;
      --rdp-background-color: #1a1a1a;
      margin: 0;
      color: #ffd700;
    }

    /* Month Caption & Nav */
    .rdp-caption { 
        display: flex; 
        align-items: center; 
        justify-content: space-between; 
        margin-bottom: 1rem;
        color: #ffd700;
    }
    .rdp-caption_label { 
        font-family: 'Cinzel', serif; 
        font-weight: bold; 
        font-size: 1rem;
        color: #ffd700;
    }
    
    /* Navigation Arrows to GOLD */
    .rdp-nav_button {
        color: #ffd700 !important;
    }
    .rdp-nav_button svg {
        fill: #ffd700 !important;
        stroke: #ffd700 !important;
    }
    .rdp-nav_button:hover {
        background-color: rgba(255, 215, 0, 0.1) !important;
    }

    /* Dropdowns (Year/Month) */
    .rdp-dropdown_year, .rdp-dropdown_month {
        font-family: 'Cinzel', serif;
    }
    
    /* Custom Select Styling */
    .rdp-caption_dropdowns select {
        appearance: none !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        background-color: transparent !important;
        border: 1px solid rgba(255, 215, 0, 0.3) !important;
        border-radius: 4px;
        color: #ffd700 !important;
        padding: 4px 24px 4px 8px !important;
        font-weight: bold;
        cursor: pointer;
        background-image: url("data:image/svg+xml;charset=UTF-8,${arrowSvg}") !important;
        background-repeat: no-repeat !important;
        background-position: right 4px center !important;
        background-size: 14px !important;
    }
    .rdp-caption_dropdowns select:hover {
        border-color: #ffd700 !important;
        background-color: rgba(255, 215, 0, 0.05) !important;
    }
    
    /* Dropdown Options - Crucial for visibility */
    .rdp-caption_dropdowns select option {
        background-color: #18181b !important; /* Zinc-900 */
        color: #ffd700 !important;
    }

    /* Weekdays */
    .rdp-head_cell {
      color: rgba(255, 215, 0, 0.6);
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    /* Days */
    .rdp-day {
      color: #e5e5e5;
      font-size: 0.9rem;
      border-radius: 50%;
    }
    .rdp-day:hover:not(.rdp-day_selected) {
      background-color: rgba(255, 215, 0, 0.15);
      color: #ffd700;
    }

    /* Selected Day - Hollow Ring */
    .rdp-day_selected:not([disabled]) { 
      background-color: transparent !important;
      border: 2px solid #ffd700 !important;
      color: #ffd700 !important;
      font-weight: bold;
    }
    
    /* Today */
    .rdp-day_today {
      color: #ffd700;
      font-weight: bold;
      text-decoration: underline;
      text-decoration-color: rgba(255, 215, 0, 0.5);
    }
  `

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <style>{cssOverrides}</style>
      <label className="mb-1 block font-cinzel text-amber-100/60 text-sm">{label}</label>

      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full cursor-pointer items-center justify-between rounded border transition-all ${
          isOpen
            ? 'border-gold bg-black/40 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
            : 'border-amber-900/30 bg-black/20 hover:border-gold/50'
        }px-3 py-2 text-gold `}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon size={16} className="text-gold/70" />
          <span className={selectedDate ? 'text-gold' : 'text-gray-500'}>
            {selectedDate ? format(selectedDate, 'PPP') : 'Select Date'}
          </span>
        </div>

        {/* Time Display/Input embedded in trigger */}
        {selectedDate && (
          <div className="flex items-center gap-2 border-amber-900/30 border-l pl-3">
            <Clock size={16} className="text-gold/70" />
            <span className="font-mono text-gold text-sm">{format(selectedDate, 'HH:mm')}</span>
          </div>
        )}
      </div>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 rounded-xl border border-gold/30 bg-zinc-950 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDaySelect}
            captionLayout="dropdown" // Use dropdowns for navigation
            fromYear={2024}
            toYear={2030}
            showOutsideDays
            fixedWeeks
          />

          <div className="mt-4 flex items-center justify-between border-white/10 border-t pt-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gold/70" />
              <input
                type="time"
                value={selectedDate ? format(selectedDate, 'HH:mm') : ''}
                onChange={handleTimeChange}
                className="rounded border border-amber-900/30 bg-black/40 px-2 py-1 text-gold focus:border-gold focus:outline-none"
              />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="font-bold text-gold text-xs uppercase tracking-wider hover:text-amber-300"
              type="button"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
