import { Form, useNavigation } from 'react-router'
import { FormField } from '../ui/FormField'
import { MetallicButton } from '../ui/MetallicButton'
import { Modal } from '../ui/Modal'

interface DanceStyle {
  id: string
  name: string
}

interface CreateClassTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  danceStyles: DanceStyle[]
  trainers: { id: string; firstName: string; lastName: string }[]
}

export function CreateClassTemplateModal({ isOpen, onClose, danceStyles, trainers }: CreateClassTemplateModalProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Class Template">
      <Form method="post" className="space-y-4" onSubmit={() => setTimeout(onClose, 100)}>
        <input type="hidden" name="intent" value="createClassTemplate" />

        <FormField label="Class Name" name="name" required placeholder="e.g. Salsa Beginners" />

        <div className="space-y-1">
          <label htmlFor="description" className="block font-cinzel font-medium text-amber-100/80 text-sm">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-md border border-amber-900/30 bg-gray-900/50 px-3 py-2 text-gold transition-all placeholder:text-gray-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="Describe what students will learn..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="trainerId" className="block font-cinzel font-medium text-amber-100/80 text-sm">
              Default Trainer
            </label>
            <select
              id="trainerId"
              name="trainerId"
              required
              className="w-full rounded-md border border-amber-900/30 bg-gray-900/50 px-3 py-2 text-gold transition-all focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 [&>option]:bg-gray-900"
            >
              <option value="" disabled selected>
                Select a trainer
              </option>
              {trainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.firstName} {trainer.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="level" className="block font-cinzel font-medium text-amber-100/80 text-sm">
              Level
            </label>
            <select
              id="level"
              name="level"
              className="w-full rounded-md border border-amber-900/30 bg-gray-900/50 px-3 py-2 text-gold transition-all focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 [&>option]:bg-gray-900"
              defaultValue="OPEN"
            >
              <option value="OPEN">Open Level</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Duration (minutes)"
            name="duration"
            type="number"
            defaultValue="60"
            placeholder="e.g. 60"
            required
          />

          <div className="space-y-1">
            <label htmlFor="hallId" className="block font-cinzel font-medium text-amber-100/80 text-sm">
              Default Hall
            </label>
            <select
              id="hallId"
              name="hallId"
              className="w-full rounded-md border border-amber-900/30 bg-gray-900/50 px-3 py-2 text-gold transition-all focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 [&>option]:bg-gray-900"
              defaultValue="HALL1"
            >
              <option value="HALL1">Hall 1</option>
              <option value="HALL2">Hall 2</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRestricted"
            name="isRestricted"
            className="h-4 w-4 rounded border-amber-900/30 bg-gray-900/50 text-amber-500 focus:ring-amber-500/20"
          />
          <label htmlFor="isRestricted" className="font-cinzel text-amber-100/80 text-sm">
            Restrict Visibility (Trainers & Enrolled only)
          </label>
        </div>

        <div className="space-y-1">
          <label htmlFor="styleId" className="block font-cinzel font-medium text-amber-100/80 text-sm">
            Dance Style
          </label>
          <select
            id="styleId"
            name="styleId"
            required
            className="w-full rounded-md border border-amber-900/30 bg-gray-900/50 px-3 py-2 text-gold transition-all focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 [&>option]:bg-gray-900"
          >
            <option value="" disabled selected>
              Select a style
            </option>
            {danceStyles.map((style) => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </select>
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
            {isSubmitting ? 'Creating...' : 'Create Class'}
          </MetallicButton>
        </div>
      </Form>
    </Modal>
  )
}
