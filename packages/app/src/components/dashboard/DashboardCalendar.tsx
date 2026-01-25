import type { DateSelectArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
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
  height?: string | number | 'auto'
}

// Full config including listWeek
const desktopHeaderConfig = {
  left: 'prev,next today',
  center: 'title',
  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
} as const

const mobileHeaderConfig = {
  left: 'prev,next',
  center: 'title',
  right: '',
} as const

const buttonTextConfig = {
  today: 'today',
  month: 'month',
  week: 'week',
  day: 'day',
  list: 'list',
} as const

const calendarPlugins = [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]

const eventTimeFormatConfig = {
  hour: '2-digit',
  minute: '2-digit',
  meridiem: false,
  hour12: false,
} as const

const slotLabelFormatConfig = {
  hour: '2-digit',
  minute: '2-digit',
  meridiem: false,
  hour12: false,
} as const

function DashboardCalendarComponent({
  events = [],
  onDateSelect,
  onEventClick,
  onEventDrop,
  readOnly = false,
  editable = false,
  height = 600,
}: DashboardCalendarProps) {
  const [isClient, setIsClient] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const calendarRef = useRef<FullCalendar>(null)

  // Mobile detection and SSR hydration safety
  useEffect(() => {
    setIsClient(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Memoize default events
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

  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      if (readOnly) return
      onDateSelect?.(selectInfo)
    },
    [onDateSelect, readOnly]
  )

  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      onEventClick?.(clickInfo)
    },
    [onEventClick]
  )

  const calendarEvents = useMemo(() => {
    return events.length > 0 ? events : defaultEvents
  }, [events, defaultEvents])

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
    <div className="dashboard-calendar overflow-hidden rounded-xl border border-amber-900/20 bg-gray-900/30 p-2 sm:p-4">
      <FullCalendar
        ref={calendarRef}
        plugins={calendarPlugins}
        initialView={isMobile ? 'listWeek' : 'dayGridMonth'}
        headerToolbar={isMobile ? mobileHeaderConfig : desktopHeaderConfig}
        events={calendarEvents}
        selectable={!readOnly}
        selectMirror={!readOnly}
        dayMaxEvents={true}
        weekends={true}
        select={handleDateSelect}
        eventClick={handleEventClick}
        editable={editable && !readOnly}
        eventDrop={onEventDrop}
        displayEventEnd={!isMobile}
        height={isMobile ? 'auto' : height}
        aspectRatio={isMobile ? 0.7 : 1.8}
        handleWindowResize={true}
        stickyHeaderDates={true}
        eventClassNames="calendar-event"
        dayHeaderClassNames="calendar-day-header"
        buttonText={buttonTextConfig}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: false,
          hour12: false,
        }}
        slotLabelFormat={slotLabelFormatConfig}
        dayHeaderFormat={isMobile ? { weekday: 'narrow' } : { weekday: 'short' }}
        titleFormat={isMobile ? { month: 'short', year: 'numeric' } : { month: 'long', year: 'numeric' }}
        listDayFormat={isMobile ? { weekday: 'short', day: 'numeric' } : { weekday: 'long', month: 'long', day: 'numeric' }}
        listDaySideFormat={isMobile ? false : { year: 'numeric' }}
      />
    </div>
  )
}

export const DashboardCalendar = React.memo(DashboardCalendarComponent)
