import { useEffect, useState } from 'react'
import { Form, useNavigation } from 'react-router'
import { Checkbox } from '../ui/Checkbox'
import { Combobox } from '../ui/Combobox'
import { MetallicButton } from '../ui/MetallicButton'
import { Modal } from '../ui/Modal'
import { WhitelistManager } from './WhitelistManager'

// These should match your Prism schema enums and relations
interface DanceStyle {
  id: string
  name: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string // Added email to match WhitelistManager User
}

interface ClassTemplate {
  id: string
  name: string
  description?: string | null
  styleId: string
  trainerId: string
  hallId: string // DanceHall enum
  level: string // ClassLevel enum
  duration: number
  isActive: boolean
  isWhitelistEnabled: boolean
  whitelist?: { user: User }[]
}

interface EditTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  template: ClassTemplate | null // null means "Create Mode"
  styles: DanceStyle[]
  trainers: User[]
  users: User[]
}

const CLASS_LEVELS = ['OPEN', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const DANCE_HALLS = ['HALL1', 'HALL2']

export function EditTemplateModal({ isOpen, onClose, template, styles, trainers, users }: EditTemplateModalProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [styleId, setStyleId] = useState('')
  const [trainerId, setTrainerId] = useState('')
  const [hallId, setHallId] = useState('HALL1')
  const [level, setLevel] = useState('OPEN')
  const [duration, setDuration] = useState(60) // minutes
  const [isActive, setIsActive] = useState(true)
  const [isWhitelistEnabled, setIsWhitelistEnabled] = useState(false)

  // Create Mode Whitelist State
  const [pendingWhitelist, setPendingWhitelist] = useState<User[]>([])

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      if (template) {
        setName(template.name)
        setDescription(template.description || '')
        setStyleId(template.styleId)
        setTrainerId(template.trainerId)
        setHallId(template.hallId)
        setLevel(template.level)
        setDuration(Math.round(template.duration / 60))
        setIsActive(template.isActive)
        setIsWhitelistEnabled(template.isWhitelistEnabled)
      } else {
        // Defaults for Create
        setName('')
        setDescription('')
        setStyleId(styles[0]?.id || '')
        setTrainerId(trainers[0]?.id || '')
        setHallId('HALL1')
        setLevel('OPEN')
        setDuration(60)
        setIsActive(true)
        setIsWhitelistEnabled(false)
        setPendingWhitelist([])
      }
    }
  }, [isOpen, template?.id])

  if (!isOpen) return null

  const isEdit = !!template

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Template' : 'Create Template'}>
      <Form
        method="post"
        className="space-y-4"
        onSubmit={(_e) => {
          // Are you sure? logic could go here
          setTimeout(onClose, 100)
        }}
      >
        <input type="hidden" name="intent" value={isEdit ? 'update_template' : 'create_template'} />
        {isEdit && <input type="hidden" name="id" value={template.id} />}
        {!isEdit && isWhitelistEnabled && (
          <input type="hidden" name="whitelistUserIds" value={JSON.stringify(pendingWhitelist.map((u) => u.id))} />
        )}

        {/* Name */}
        <div className="space-y-1">
          <label htmlFor="tpl-name" className="block font-medium text-gray-400 text-xs">
            Template Name
          </label>
          <input
            id="tpl-name"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
            placeholder="e.g. Hip Hop Beginners"
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label htmlFor="tpl-desc" className="block font-medium text-gray-400 text-xs">
            Description
          </label>
          <textarea
            id="tpl-desc"
            name="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
            placeholder="Optional description..."
          />
        </div>

        {/* Row 1: Style & Trainer */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block font-medium text-gray-400 text-xs">Style</label>
            <Combobox
              name="styleId"
              value={styleId}
              onChange={setStyleId}
              options={styles.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Select Style"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block font-medium text-gray-400 text-xs">Default Trainer</label>
            <Combobox
              name="trainerId"
              value={trainerId}
              onChange={setTrainerId}
              options={trainers.map((t) => ({ value: t.id, label: `${t.firstName} ${t.lastName}` }))}
              placeholder="Select Trainer"
              required
            />
          </div>
        </div>

        {/* Row 2: Hall & Level */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block font-medium text-gray-400 text-xs">Default Hall</label>
            <select
              name="hallId"
              value={hallId}
              onChange={(e) => setHallId(e.target.value)}
              className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
            >
              {DANCE_HALLS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block font-medium text-gray-400 text-xs">Level</label>
            <select
              name="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
            >
              {CLASS_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <label className="block font-medium text-gray-400 text-xs">Duration (minutes)</label>
          <input
            type="number"
            name="duration"
            required
            min="15"
            step="5"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
          />
        </div>

        {/* Switches */}
        <div className="flex justify-between gap-4 border-white/10 border-t pt-4">
          <Checkbox
            name="isActive"
            checked={isActive}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsActive(e.target.checked)}
            label="Active"
          />

          <Checkbox
            name="isWhitelistEnabled"
            checked={isWhitelistEnabled}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsWhitelistEnabled(e.target.checked)}
            label="Restricted Access (Whitelist)"
          />
        </div>

        {isWhitelistEnabled && (
          <div className="border-white/10 border-t pt-4">
            {template ? (
              <WhitelistManager
                templateId={template.id}
                initialWhitelist={template.whitelist || []}
                allUsers={users}
                mode="live"
              />
            ) : (
              <WhitelistManager
                initialWhitelist={pendingWhitelist.map((u) => ({ user: u }))}
                allUsers={users}
                mode="local"
                onUpdate={setPendingWhitelist}
              />
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-400 text-sm transition-colors hover:text-white"
          >
            Cancel
          </button>
          <MetallicButton type="submit" disabled={isSubmitting} className="min-w-[100px] rounded-md border-2 px-4 py-2">
            {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </MetallicButton>
        </div>
      </Form>
    </Modal>
  )
}
