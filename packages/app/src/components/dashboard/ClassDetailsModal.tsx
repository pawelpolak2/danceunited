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
    isProcessing
}: ClassDetailsModalProps) {
    if (!isOpen || !classInstance) return null

    const startDate = new Date(classInstance.startTime)
    const endDate = new Date(classInstance.endTime)
    const dateStr = startDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
    const timeStr = `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-amber-500/30 bg-gray-900 shadow-2xl">
                {/* Header Gradient */}
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

                <div className="relative p-6">
                    <ShinyText as="h2" variant="heading" className="text-2xl font-bold mb-2">
                        {classInstance.title}
                    </ShinyText>

                    <div className="flex items-center gap-2 text-amber-200/80 mb-6 font-medium">
                        <User className="w-4 h-4" />
                        <span>with {classInstance.extendedProps?.trainerName || 'Trainer'}</span>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                            <Calendar className="w-5 h-5 text-amber-500 mt-0.5" />
                            <div>
                                <div className="text-gray-200 font-medium">{dateStr}</div>
                                <div className="text-gray-400 text-sm">{timeStr}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                            <MapPin className="w-5 h-5 text-amber-500" />
                            <div className="text-gray-200">{classInstance.extendedProps?.hall}</div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                            <Clock className="w-5 h-5 text-amber-500" />
                            <div className="text-gray-200">{Math.round(classInstance.extendedProps?.duration / 60)} minutes</div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-300 transition-colors"
                        >
                            Close
                        </button>

                        {isAttending ? (
                            <button
                                onClick={() => onCancel(classInstance.id)}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
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
