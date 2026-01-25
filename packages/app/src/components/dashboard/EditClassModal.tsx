import { useEffect, useState } from 'react'
import { Form, useNavigation } from 'react-router'
import { Combobox } from '../ui/Combobox'
import { ConfirmModal } from '../ui/ConfirmModal'
import { MetallicButton } from '../ui/MetallicButton'
import { MetallicDatePicker } from '../ui/MetallicDatePicker'
import { Modal } from '../ui/Modal'
import { Radio } from '../ui/Radio'

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
  attendances?: any[] // Simplified typing for now to match usage
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

  // State for Date Selection
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)

  const [endTime, setEndTime] = useState<string>('')
  const [hall, setHall] = useState<string>('HALL1')
  const [trainerId, setTrainerId] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [updateScope, setUpdateScope] = useState<string>('single')
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

  // Initialize form from classInstance
  useEffect(() => {
    if (classInstance && isOpen) {
      setStartDate(new Date(classInstance.startTime))
      setHall(classInstance.actualHall)
      setTrainerId(classInstance.actualTrainerId)
      setNotes(classInstance.notes || '')
      setUpdateScope('single') // Reset scope when classInstance changes
    }
  }, [classInstance, isOpen])

  // Update calculated endTime when startDate changes
  useEffect(() => {
    if (startDate && !Number.isNaN(startDate.getTime()) && classInstance) {
      const duration = classInstance.classTemplate.duration
      const end = new Date(startDate.getTime() + duration * 1000)

      const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setEndTime(`${formatTime(startDate)} - ${formatTime(end)} (${Math.round(duration / 60)} mins)`)
    } else {
      setEndTime('')
    }
  }, [startDate, classInstance])

  // Helper to format Date to datetime-local string for hidden input
  const toLocalISO = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

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
            <input
              type="hidden"
              name="startTime"
              value={startDate && !Number.isNaN(startDate.getTime()) ? toLocalISO(startDate) : ''}
            />
            {/* Hidden submit button for delete confirmation */}
            <button type="submit" name="intent" value="deleteClass" id="hidden-delete-btn" className="hidden" />
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
              {endTime}
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
                <Radio
                  id="scope-single"
                  name="updateScope"
                  value="single"
                  checked={updateScope === 'single'}
                  onChange={() => setUpdateScope('single')}
                  label="Only this class"
                />
              </div>
              <div className="flex items-center gap-2">
                <Radio
                  id="scope-series"
                  name="updateScope"
                  value="series"
                  checked={updateScope === 'series'}
                  onChange={() => setUpdateScope('series')}
                  label="All classes in this series"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 border-amber-900/10 border-t pt-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="notifyUsers"
              defaultChecked={true}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault()
              }}
              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-amber-100/80 text-sm">Notify enrolled students via email</span>
          </label>
        </div>

        <div className="mt-6 flex justify-between gap-3 border-amber-900/30 border-t pt-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="rounded-md border border-red-900/30 bg-red-950/20 px-4 py-2 text-red-400 text-sm transition-colors hover:text-red-300"
            >
              Delete
            </button>
            {/* Hidden submit button for cancel class */}
            <button type="submit" name="intent" value="cancelClass" id="hidden-cancel-btn" className="hidden" />

            <button
              type="button"
              className="rounded-md border border-orange-900/30 bg-orange-950/20 px-4 py-2 text-orange-400 text-sm transition-colors hover:text-orange-300"
              onClick={() => setIsCancelConfirmOpen(true)}
            >
              Cancel Class
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

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => {
          // Trigger the form submission for delete
          // We can't use fetcher here easily without refactoring the whole form to use fetcher?
          // Actually, we can just trigger a hidden submit button or submit the form via ref.
          // But `Form` from react-router is being used.
          // Let's use a hidden submit button or just programmatically submit.
          // The cleanest way in this specific modal (which uses <Form>) is to have a hidden button we click.
          const deleteBtn = document.getElementById('hidden-delete-btn')
          if (deleteBtn) deleteBtn.click()
          setIsDeleteConfirmOpen(false)
        }}
        title="Delete Class"
        description={
          classInstance.attendances && classInstance.attendances.length > 0
            ? 'Warning: This class has enrolled students. Deleting it will cancel their attendance.' // Simplified check as attendances prop wasn't in interface but used in code? Wait, interface says ClassInstance has `classTemplate`.
            : // The original code used `classInstance.attendances`. Let's check interface map.
              updateScope === 'series'
              ? 'Are you sure you want to delete ALL classes in this series?'
              : 'Are you sure you want to delete this class?'
        }
        confirmLabel="Delete"
        isDestructive
      />

      <ConfirmModal
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={() => {
          const cancelBtn = document.getElementById('hidden-cancel-btn')
          if (cancelBtn) cancelBtn.click()
          setIsCancelConfirmOpen(false)
        }}
        title="Cancel Class"
        description="Are you sure you want to CANCEL this class? It will remain in history as cancelled."
        confirmLabel="Yes, Cancel Class"
        isDestructive
      />
    </Modal>
  )
}
