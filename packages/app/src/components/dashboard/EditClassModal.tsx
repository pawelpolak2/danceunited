import { useEffect, useState } from 'react'
import { Form, useNavigation } from 'react-router'
import { Combobox } from '../ui/Combobox'
import { MetallicButton } from '../ui/MetallicButton'
import { MetallicDateTimePicker } from '../ui/MetallicDateTimePicker'
import { Modal } from '../ui/Modal'

interface ClassTemplate {
  name: string
  duration: number
}

interface ClassInstance {
  id: string
  startTime: string // ISO string
  actualHall: string
  actualTrainerId: string
  notes?: string | null
  recurrenceGroupId?: string | null
  classTemplate: ClassTemplate
}

interface EditClassModalProps {
  isOpen: boolean
  onClose: () => void
  classInstance: ClassInstance | null
  trainers: { id: string; firstName: string; lastName: string }[]
}

export function EditClassModal({ isOpen, onClose, classInstance, trainers }: EditClassModalProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const [startTime, setStartTime] = useState<Date | undefined>(undefined)
  const [endTimeDisplay, setEndTimeDisplay] = useState<string>('')
  const [hall, setHall] = useState<string>('HALL1')
  const [trainerId, setTrainerId] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [updateScope, setUpdateScope] = useState<string>('single')

  // Initialize form from classInstance
  useEffect(() => {
    if (classInstance && isOpen) {
      const start = new Date(classInstance.startTime)
      setStartTime(start)
      setHall(classInstance.actualHall)
      setTrainerId(classInstance.actualTrainerId)
      setNotes(classInstance.notes || '')
      setUpdateScope('single') // Reset scope when classInstance changes
    }
  }, [classInstance, isOpen])

  // Update calculated endTime when startTime changes
  useEffect(() => {
    if (startTime && classInstance) {
      const duration = classInstance.classTemplate.duration
      const end = new Date(startTime.getTime() + duration * 1000)

      const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      }
      setEndTimeDisplay(`${formatTime(startTime)} - ${formatTime(end)} (${Math.round(duration / 60)} mins)`)
    }
  }, [startTime, classInstance])

  if (!classInstance) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Class">
      <Form method="post" className="space-y-4" onSubmit={() => setTimeout(onClose, 100)}>
        <input type="hidden" name="classInstanceId" value={classInstance.id} />

        <div className="space-y-1">
          <label className="block font-cinzel font-medium text-amber-100/80 text-sm">Class</label>
          <div className="w-full rounded-md border border-amber-900/30 bg-gray-900/30 px-3 py-2 text-gold">
            {classInstance.classTemplate.name}
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-trainer" className="block font-cinzel font-medium text-amber-100/80 text-sm">
            Trainer
          </label>
          <Combobox
            name="actualTrainerId"
            value={trainerId}
            onChange={setTrainerId}
            options={trainers.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))}
            placeholder="Select Trainer"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="edit-startTime" className="block font-cinzel font-medium text-amber-100/80 text-sm">
              Start Time
            </label>
            <label htmlFor="edit-startTime" className="block font-cinzel font-medium text-amber-100/80 text-sm">
              Start Time
            </label>
            <input type="hidden" name="startTime" value={startTime ? startTime.toISOString() : ''} />
            <MetallicDateTimePicker date={startTime} setDate={setStartTime} />
          </div>

          <div className="space-y-1">
            <label className="block font-cinzel font-medium text-amber-100/80 text-sm">End Time (Calculated)</label>
            <div className="w-full rounded-md border border-amber-900/30 bg-gray-900/30 px-3 py-2 text-gray-400">
              {endTimeDisplay}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-hall" className="block font-cinzel font-medium text-amber-100/80 text-sm">
            Dance Hall
          </label>
          <select
            id="edit-hall"
            name="hall"
            required
            value={hall}
            onChange={(e) => setHall(e.target.value)}
            className="w-full rounded-md border border-amber-900/30 bg-gray-900/50 px-3 py-2 text-gold transition-all focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 [&>option]:bg-gray-900"
          >
            <option value="HALL1">Hall 1</option>
            <option value="HALL2">Hall 2</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-notes" className="block font-cinzel font-medium text-amber-100/80 text-sm">
            Notes (Optional)
          </label>
          <textarea
            id="edit-notes"
            name="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-amber-900/30 bg-gray-900/50 px-3 py-2 text-gold transition-all placeholder:text-gray-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Room setup info, sub trainer, etc."
          />
        </div>

        {classInstance.recurrenceGroupId && (
          <div className="space-y-2 border-amber-900/10 border-t pt-2">
            <label className="block font-cinzel font-medium text-amber-100/80 text-sm">Update Scope</label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="scope-single"
                  name="updateScope"
                  value="single"
                  checked={updateScope === 'single'}
                  onChange={() => setUpdateScope('single')}
                  className="border-amber-900/30 bg-gray-900 text-amber-500"
                />
                <label htmlFor="scope-single" className="text-gray-300 text-sm">
                  Only this class
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="scope-series"
                  name="updateScope"
                  value="series"
                  checked={updateScope === 'series'}
                  onChange={() => setUpdateScope('series')}
                  className="border-amber-900/30 bg-gray-900 text-amber-500"
                />
                <label htmlFor="scope-series" className="text-gray-300 text-sm">
                  All classes in this series
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-3 border-amber-900/30 border-t pt-4">
          <div className="flex gap-2">
            <button
              type="submit"
              name="intent"
              value="deleteClass"
              onClick={(e) => {
                const msg =
                  updateScope === 'series'
                    ? 'Are you sure you want to delete ALL classes in this series? This cannot be undone.'
                    : 'Are you sure you want to delete this class?'

                if (!confirm(msg)) {
                  e.preventDefault()
                }
              }}
              className="rounded-md border border-red-900/30 bg-red-950/20 px-4 py-2 text-red-400 text-sm transition-colors hover:text-red-300"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 text-sm transition-colors hover:text-white"
            >
              Cancel
            </button>
          </div>

          <MetallicButton
            type="submit"
            name="intent"
            value="updateClass"
            disabled={isSubmitting}
            className="min-w-[100px] rounded-md border-2 px-4 py-2"
          >
            {isSubmitting ? 'Updating...' : 'Save Changes'}
          </MetallicButton>
        </div>
      </Form>
    </Modal>
  )
}
