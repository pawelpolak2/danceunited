import { Calendar, Clock, MapPin, User } from 'lucide-react'
import { MetallicButton, ShinyText } from '../ui'

interface ClassDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  classInstance: any // Typed properly in usage
  isAttending: boolean
  onSignUp: (classId: string) => void
  onCancel: (classId: string) => void
  isProcessing: boolean
}

export function ClassDetailsModal({
  isOpen,
  onClose,
  classInstance,
  isAttending,
  onSignUp,
  onCancel,
  isProcessing,
}: ClassDetailsModalProps) {
  if (!isOpen || !classInstance) return null

  const startDate = new Date(classInstance.startTime || classInstance.start)
  const endDate = new Date(classInstance.endTime || classInstance.end)

  let dateStr = ''
  let timeStr = ''

  if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime())) {
    dateStr = startDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
    timeStr = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-amber-500/30 bg-gray-900 shadow-2xl">
        {/* Header Gradient */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-500/10 to-transparent" />

        <div className="relative p-6">
          <ShinyText as="h2" variant="title" className="mb-2 font-bold text-2xl">
            {classInstance.title}
          </ShinyText>

          <div className="mb-6 flex items-center gap-2 font-medium text-amber-200/80">
            <User className="h-4 w-4" />
            <span>with {classInstance.extendedProps?.trainerName || 'Trainer'}</span>
          </div>

          <div className="mb-8 space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-gray-700/50 bg-gray-800/50 p-3">
              <Calendar className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <div className="font-medium text-gray-200">{dateStr}</div>
                <div className="text-gray-400 text-sm">{timeStr}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-gray-700/50 bg-gray-800/50 p-3">
              <MapPin className="h-5 w-5 text-amber-500" />
              <div className="text-gray-200">{classInstance.extendedProps?.hall}</div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-gray-700/50 bg-gray-800/50 p-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div className="text-gray-200">{Math.round(classInstance.extendedProps?.duration / 60)} minutes</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-700 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-800"
            >
              Close
            </button>

            {isAttending ? (
              <button
                type="button"
                onClick={() => onCancel(classInstance.id)}
                disabled={isProcessing}
                className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Cancel Reservation'}
              </button>
            ) : (
              <MetallicButton
                onClick={() => onSignUp(classInstance.id)}
                disabled={isProcessing}
                className="flex-1 justify-center"
              >
                {isProcessing ? 'Signing up...' : 'Sign Up'}
              </MetallicButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
