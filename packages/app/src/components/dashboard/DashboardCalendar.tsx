import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ShinyText } from '../ui'

interface DashboardCalendarProps {
  events?: EventInput[]
  onDateSelect?: (selectInfo: DateSelectArg) => void
  onEventClick?: (clickInfo: EventClickArg) => void
  onEventDrop?: (dropInfo: EventDropArg) => void
  readOnly?: boolean
  editable?: boolean
}

// Move static config outside component to prevent re-creation
const headerToolbarConfig = {
  left: 'prev,next today',
  center: 'title',
  right: 'dayGridMonth,timeGridWeek,timeGridDay',
} as const

const buttonTextConfig = {
  today: 'today',
  month: 'month',
  week: 'week',
  day: 'day',
} as const

const calendarPlugins = [dayGridPlugin, timeGridPlugin, interactionPlugin]

function DashboardCalendarComponent({
  events = [],
  onDateSelect,
  onEventClick,
  onEventDrop,
  readOnly = false,
  editable = false,
}: DashboardCalendarProps) {
  const [isClient, setIsClient] = useState(false)
  const calendarRef = useRef<FullCalendar>(null)

  // Only render on client to avoid SSR hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Memoize default events to prevent recreation on every render
  const defaultEvents = useMemo<EventInput[]>(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    return [
      {
        id: '1',
        title: 'Ballet Basics',
        start: `${todayStr}T10:00:00`,
        end: `${todayStr}T11:00:00`,
        backgroundColor: '#ffd700',
        borderColor: '#ffd700',
      },
    ]
  }, [])

  // Memoize handlers to prevent recreation
  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      if (readOnly) return

      if (onDateSelect) {
        onDateSelect(selectInfo)
      } else {
        // Default: show alert (will be replaced with booking modal)
        alert(`Selected: ${selectInfo.startStr} to ${selectInfo.endStr}`)
      }
    },
    [onDateSelect, readOnly]
  )

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      // Allow click in readOnly mode for details view, but don't show default alert if readOnly
      if (onEventClick) {
        onEventClick(clickInfo)
      } else if (!readOnly) {
        // Default: show event details only if not readOnly (unless handled by parent)
        alert(`Event: ${clickInfo.event.title}`)
      }
    },
    [onEventClick, readOnly]
  )

  // Memoize events array
  const calendarEvents = useMemo(() => {
    return events.length > 0 ? events : defaultEvents
  }, [events, defaultEvents])

  // Show placeholder during SSR
  if (!isClient) {
    return (
      <div className="dashboard-calendar" style={{ minHeight: '600px' }}>
        <div className="flex h-full items-center justify-center">
          <ShinyText variant="body">Loading calendar...</ShinyText>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-calendar">
      <FullCalendar
        ref={calendarRef}
        plugins={calendarPlugins}
        initialView="dayGridMonth"
        headerToolbar={headerToolbarConfig}
        events={calendarEvents}
        selectable={!readOnly}
        selectMirror={!readOnly}
        dayMaxEvents={false}
        weekends={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        editable={editable}
        eventDrop={onEventDrop}
        height={600}
        aspectRatio={1.8}
        eventClassNames="calendar-event"
        dayHeaderClassNames="calendar-day-header"
        buttonText={buttonTextConfig}
      />
    </div>
  )
}

export const DashboardCalendar = React.memo(DashboardCalendarComponent)
