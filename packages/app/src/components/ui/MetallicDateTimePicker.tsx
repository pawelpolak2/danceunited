import { format } from 'date-fns'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { MetallicButton } from './MetallicButton'
import 'react-day-picker/dist/style.css'

interface MetallicDateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date) => void
  includeTime?: boolean
  className?: string
}

export function MetallicDateTimePicker({
  date,
  setDate,
  includeTime = true,
  className = '',
}: MetallicDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<'date' | 'time'>('date')
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle Date Selection
  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return
    const updatedDate = new Date(date || new Date())
    updatedDate.setFullYear(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())
    setDate(updatedDate)
    if (includeTime) {
      setView('time') // Auto-switch to time after date select
    } else {
      setIsOpen(false)
    }
  }

  // Handle Time Selection
  const handleTimeChange = (type: 'hour' | 'minute', value: number) => {
    const updatedDate = new Date(date || new Date())
    if (type === 'hour') updatedDate.setHours(value)
    if (type === 'minute') updatedDate.setMinutes(value)
    setDate(updatedDate)
  }

  // Generate Time Options
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5) // Step 5

  const currentHour = date ? date.getHours() : 12
  const currentMinute = date ? Math.round(date.getMinutes() / 5) * 5 : 0

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-amber-500/50 bg-transparent px-3 py-2 text-left font-normal transition-all hover:border-gold focus:border-gold focus:outline-none"
      >
        <span className={date ? 'text-gold' : 'font-cinzel text-gray-500 text-sm'}>
          {date ? format(date, includeTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd') : 'Select Date...'}
        </span>
        {includeTime ? (
          <Clock size={16} className="text-gold/70" />
        ) : (
          <CalendarIcon size={16} className="text-gold/70" />
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className="absolute top-full left-0 z-50 mt-2 w-[340px] rounded-lg border border-gold/40 bg-zinc-900/95 p-4 shadow-xl backdrop-blur-md"
          style={{ borderColor: '#ffd700' }}
        >
          {/* View Toggle */}
          {includeTime && (
            <div className="mb-4 flex rounded border border-white/10 p-1">
              <button
                type="button"
                className={`flex-1 rounded py-1 font-bold text-xs transition-colors ${
                  view === 'date' ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setView('date')}
              >
                DATE
              </button>
              <button
                type="button"
                className={`flex-1 rounded py-1 font-bold text-xs transition-colors ${
                  view === 'time' ? 'bg-gold text-black' : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setView('time')}
              >
                TIME
              </button>
            </div>
          )}

          {/* Calendar View */}
          {view === 'date' && (
            <div className="metallic-calendar">
              <style>{`
                .rdp {
                  --rdp-cell-size: 40px;
                  --rdp-accent-color: #ffd700;
                  --rdp-background-color: transparent;
                  margin: 0;
                }
                .rdp-caption_label {
                  color: #d1d5db !important; /* Subdued Month Name */
                  font-weight: 500;
                  font-size: 0.9rem;
                }
                /* ARROWS: Force Gold on Path */
                .rdp-nav_button {
                  color: #ffd700 !important;
                }
                .rdp-nav_button svg {
                   fill: #ffd700 !important;
                   color: #ffd700 !important;
                }
                .rdp-nav_button svg path {
                   fill: #ffd700 !important;
                   stroke: #ffd700 !important;
                }
                
                /* DROPDOWNS: Custom Gold Selects */
                .rdp-caption_dropdowns select {
                  color: #ffd700 !important;
                  background-color: #18181b !important; /* Zinc-900 */
                  border: 1px solid #ffd700 !important;
                  border-radius: 4px;
                  padding: 2px 24px 2px 8px !important;
                  font-size: 0.85rem;
                  cursor: pointer;
                  appearance: none !important;
                  -webkit-appearance: none !important;
                  -moz-appearance: none !important;
                  /* Custom Gold Arrow SVG */
                  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffd700' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") !important;
                  background-position: right 0.2rem center !important;
                  background-repeat: no-repeat !important;
                  background-size: 1.25em 1.25em !important;
                }
                /* OPTIONS: Fix invisible text */
                .rdp-caption_dropdowns select option {
                  background-color: #18181b !important;
                  color: #ffd700 !important;
                }
                
                .rdp-caption_dropdowns select:focus {
                    outline: 1px solid #ffffff !important;
                }

                .rdp-head_cell {
                   color: #9ca3af !important; /* Gray-400 Weekdays */
                   font-weight: normal;
                   font-size: 0.8rem;
                }
                .rdp-day {
                   color: #e5e7eb;
                }
                .rdp-day:hover:not([disabled]) {
                   color: #ffd700 !important;
                   background-color: transparent !important;
                   border: 1px solid #ffd700;
                }
                
                /* Selected Day - HOLLOW RING ONLY */
                .rdp-day_selected:not([disabled]), 
                .rdp-day_selected:focus-visible,
                .rdp-day_selected:hover { 
                  background-color: transparent !important;
                  border: 2px solid #ffd700 !important;
                  color: #ffd700 !important;
                  font-weight: bold;
                  border-radius: 50%;
                  outline: none !important;
                  box-shadow: none !important;
                }
                
                /* Today - Remove dotted, just Gold */
                .rdp-day_today {
                  font-weight: bold;
                  color: #ffd700 !important; 
                  text-decoration: none !important;
                }
                
                /* Remove Focus Rings from everything */
                .rdp-button:focus-visible {
                  outline: none !important;
                  background-color: transparent !important;
                  border: 1px solid #ffd700 !important; /* Slight indicator */
                }
              `}</style>
              <DayPicker
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                captionLayout="dropdown" // Allows jumping (month/year)
                fromYear={2024}
                toYear={2030}
                styles={{
                  caption: { color: '#9ca3af' }, // Default fallback
                }}
                classNames={{
                  nav_icon: 'w-5 h-5 fill-current text-gold',
                }}
              />
            </div>
          )}

          {/* Time View */}
          {view === 'time' && (
            <div className="flex h-[280px] gap-2">
              {/* Hours */}
              <div className="flex-1 overflow-hidden rounded border border-white/10 bg-white/5">
                <div className="border-white/10 border-b p-2 text-center text-gold text-xs">HOUR</div>
                <div className="scrollbar-metallic h-[240px] overflow-y-auto p-1">
                  <div className="grid grid-cols-1 gap-1">
                    {hours.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => handleTimeChange('hour', h)}
                        className={`rounded px-2 py-2 text-center text-sm transition-colors ${
                          h === currentHour ? 'bg-gold font-bold text-black' : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {h.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Minutes */}
              <div className="flex-1 overflow-hidden rounded border border-white/10 bg-white/5">
                <div className="border-white/10 border-b p-2 text-center text-gold text-xs">MINUTE</div>
                <div className="scrollbar-metallic h-[240px] overflow-y-auto p-1">
                  <div className="grid grid-cols-1 gap-1">
                    {minutes.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleTimeChange('minute', m)}
                        className={`rounded px-2 py-2 text-center text-sm transition-colors ${
                          m === currentMinute ? 'bg-gold font-bold text-black' : 'text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {m.toString().padStart(2, '0')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          {view === 'time' && (
            <div className="mt-4 flex justify-end">
              <MetallicButton
                type="button"
                className="rounded border border-gold/50 px-4 py-1 text-xs"
                onClick={() => setIsOpen(false)}
              >
                DONE
              </MetallicButton>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
