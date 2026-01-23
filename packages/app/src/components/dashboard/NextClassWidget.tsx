import { Calendar, Clock, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { MetallicButton, ShinyText } from '../ui'

interface NextClassProps {
  nextClass: {
    id: string
    name: string
    startTime: string
    endTime: string
    hall: string
    trainerName?: string // For dancers to see who is teaching
  } | null
  userRole: 'TRAINER' | 'DANCER'
}

export function NextClassWidget({ nextClass, userRole }: NextClassProps) {
  if (!nextClass) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gray-900/40 p-6 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center py-6 text-center">
          <Calendar className="mb-3 h-10 w-10 text-gray-600" />
          <h3 className="mb-1 font-serif text-gray-400 text-xl">No Upcoming Classes</h3>
          <p className="text-gray-500 text-sm">You have no classes scheduled for the immediate future.</p>
        </div>
      </div>
    )
  }

  const startDate = new Date(nextClass.startTime)
  const timeString = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateString = startDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })

  // Calculate time until class
  const now = new Date()
  const diffMs = startDate.getTime() - now.getTime()
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  let timeUntil = ''
  if (diffMs < 0) {
    timeUntil = 'Now / In Progress'
  } else if (diffHrs > 24) {
    timeUntil = `In ${Math.floor(diffHrs / 24)} days`
  } else if (diffHrs > 0) {
    timeUntil = `In ${diffHrs}h ${diffMins}m`
  } else {
    timeUntil = `In ${diffMins}m`
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-gray-900/80 to-gray-950/80 p-6 shadow-lg backdrop-blur-md transition-all hover:border-amber-500/50">
      {/* Background Glow */}
      <div className="-right-20 -top-20 absolute h-64 w-64 rounded-full bg-amber-500/10 blur-3xl transition-opacity group-hover:opacity-100" />

      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 font-medium text-amber-400 text-xs uppercase tracking-wider">
            Next Class • {timeUntil}
          </div>
          {userRole === 'TRAINER' ? (
            <Link to={`/trainer/schedule?date=${startDate.toISOString().split('T')[0]}`}>
              <Calendar className="h-5 w-5 text-gray-400 transition-colors hover:text-amber-400" />
            </Link>
          ) : (
            <Link to={`/dancer/schedule?date=${startDate.toISOString().split('T')[0]}`}>
              <Calendar className="h-5 w-5 text-gray-400 transition-colors hover:text-amber-400" />
            </Link>
          )}
        </div>

        <ShinyText as="h3" variant="title" className="mb-2 font-bold text-2xl text-white">
          {nextClass.name}
        </ShinyText>

        {nextClass.trainerName && <p className="mb-4 font-medium text-amber-200/80">with {nextClass.trainerName}</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-sm">
              {dateString} • {timeString}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <MapPin className="h-4 w-4 text-amber-500" />
            <span className="text-sm">{nextClass.hall}</span>
          </div>
        </div>

        <div className="mt-6">
          {userRole === 'TRAINER' ? (
            <MetallicButton className="w-full justify-center">Start Class Details</MetallicButton>
          ) : (
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
              <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-amber-600 to-amber-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
