import { useEffect, useState } from 'react'
import { Form, useNavigation } from 'react-router'
import { Checkbox } from '../ui/Checkbox'
import { Combobox } from '../ui/Combobox'
import { MetallicButton } from '../ui/MetallicButton'

import { MetallicDatePicker } from '../ui/MetallicDatePicker'
import { Modal } from '../ui/Modal'
import { Radio } from '../ui/Radio'

interface ClassTemplate {
  id: string
  name: string
  duration: number
  hallId: string
}

interface ScheduleClassModalProps {
  isOpen: boolean
  onClose: () => void
  templates: ClassTemplate[]
  defaultDate?: Date
}

export function ScheduleClassModal({ isOpen, onClose, templates, defaultDate }: ScheduleClassModalProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  // State for Date Selection
  const [startDate, setStartDate] = useState<Date | undefined>(defaultDate)
  const [endTime, setEndTime] = useState<string>('')

  // State for Recurrence End Date
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | null>(null)

  // Sync prop defaultDate to state
  useEffect(() => {
    if (defaultDate && isOpen) {
      setStartDate(defaultDate)
    }
  }, [defaultDate, isOpen])

  // Update endTime when template or startDate changes
  useEffect(() => {
    if (startDate && selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId)
      if (template) {
        const end = new Date(startDate.getTime() + template.duration * 1000)
        // Format for display
        const formatTime = (date: Date) => {
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setEndTime(`${formatTime(startDate)} - ${formatTime(end)} (${Math.round(template.duration / 60)} mins)`)
      }
    }
  }, [startDate, selectedTemplateId, templates])

  // Helper to format Date to datetime-local string for hidden input
  const toLocalISO = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Class">
      <Form method="post" className="space-y-4" onSubmit={() => setTimeout(onClose, 100)}>
        <input type="hidden" name="intent" value="scheduleClass" />

        <div className="space-y-1">
          <label htmlFor="classTemplateId" className="block font-cinzel font-medium text-amber-100/80 text-sm">
            Class Template
          </label>
          <Combobox
            name="classTemplateId"
            value={selectedTemplateId}
            onChange={setSelectedTemplateId}
            options={templates.map((t) => ({
              value: t.id,
              label: `${t.name} (${Math.round(t.duration / 60)} min)`,
            }))}
            placeholder="Select class template..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <input type="hidden" name="startTime" value={startDate ? toLocalISO(startDate) : ''} />
            <MetallicDatePicker
              selected={startDate}
              onChange={(d: Date | null) => setStartDate(d || undefined)}
              label="Start Time"
              className="w-full"
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="PPP HH:mm"
              placeholderText="Select start time..."
              popperPlacement="bottom-end"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-cinzel font-medium text-amber-100/80 text-sm">End Time (Calculated)</label>
            <div className="w-full rounded-md border border-amber-900/30 bg-gray-900/30 px-3 py-2 text-gray-400">
              {endTime || 'Select template & start time'}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="hall" className="block font-cinzel font-medium text-amber-100/80 text-sm">
            Dance Hall
          </label>
          <select
            id="hall"
            name="hall"
            required
            className="w-full rounded-md border border-amber-900/30 bg-gray-900/50 px-3 py-2 text-gold transition-all focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 [&>option]:bg-gray-900"
            defaultValue="HALL1"
          >
            <option value="HALL1">Hall 1</option>
            <option value="HALL2">Hall 2</option>
          </select>
        </div>

        <div className="space-y-3 border-amber-900/10 border-t pt-2">
          <Checkbox
            id="isRecurring"
            name="isRecurring"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const isChecked = e.target.checked
              const container = document.getElementById('recurrence-options')
              if (container) {
                if (isChecked) container.classList.remove('hidden')
                else container.classList.add('hidden')
              }
            }}
            label="Repeat Weekly"
          />

          <div id="recurrence-options" className="hidden space-y-3 pl-6">
            <div className="space-y-1">
              <label className="mb-1 block font-cinzel text-amber-100/60 text-sm">Ends</label>

              <div className="mb-2 flex items-center gap-2">
                <Radio id="end-count" name="recurrenceEndType" value="count" defaultChecked label="After" />
                <input
                  type="number"
                  name="recurrenceCount"
                  defaultValue="4"
                  min="2"
                  max="52"
                  className="w-16 rounded border border-amber-900/30 bg-gray-900/50 px-2 py-1 text-center text-gold text-sm focus:border-amber-500"
                />
                <span className="text-gray-300 text-sm">occurences</span>
              </div>

              <div className="flex items-center gap-2">
                <Radio id="end-date" name="recurrenceEndType" value="date" label="On" />
                <div className="w-40">
                  <input
                    type="hidden"
                    name="recurrenceEndDate"
                    value={recurrenceEndDate ? toLocalISO(recurrenceEndDate).split('T')[0] : ''}
                  />
                  <MetallicDatePicker
                    selected={recurrenceEndDate}
                    onChange={setRecurrenceEndDate}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select date..."
                    popperPlacement="top-end"
                    id="recurrenceEndDate"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="notes" className="block font-cinzel font-medium text-amber-100/80 text-sm">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="w-full rounded-md border border-amber-900/30 bg-gray-900/50 px-3 py-2 text-gold transition-all placeholder:text-gray-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Room setup info, sub trainer, etc."
          />
        </div>

        <div className="mt-6 flex justify-end gap-3 border-amber-900/30 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-400 text-sm transition-colors hover:text-white"
          >
            Cancel
          </button>
          <MetallicButton type="submit" disabled={isSubmitting} className="min-w-[100px] rounded-md border-2 px-4 py-2">
            {isSubmitting ? 'Scheduling...' : 'Schedule Class'}
          </MetallicButton>
        </div>
      </Form>
    </Modal>
  )
}
