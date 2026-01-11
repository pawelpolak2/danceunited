import { prisma } from 'db'
import { useState } from 'react'
import { Form, useNavigation } from 'react-router'
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar'
import { ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/schedule'

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  const classes = await prisma.classInstance.findMany({
    where: {
      classTemplate: {
        isRestricted: false,
      },
      status: {
        not: 'CANCELLED',
      },
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      actualHall: true,
      classTemplate: {
        select: {
          name: true,
          description: true,
          trainer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
  })

  let myAttendance: string[] = []
  if (user) {
    const attendance = await prisma.attendance.findMany({
      where: {
        userId: user.userId,
        classId: { in: classes.map((c) => c.id) },
      },
      select: { classId: true },
    })
    myAttendance = attendance.map((a) => a.classId)
  }

  return { classes, user, myAttendance }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getCurrentUser(request)
  if (!user || user.role !== 'DANCER') {
    return { success: false, error: 'Authorized dancers only' }
  }

  const formData = await request.formData()
  const classId = formData.get('classId') as string
  const intent = formData.get('intent') as string

  if (!classId) return { success: false, error: 'Invalid class' }

  try {
    if (intent === 'enroll') {
      await prisma.attendance.create({
        data: { userId: user.userId, classId },
      })
    } else if (intent === 'unenroll') {
      await prisma.attendance.deleteMany({
        where: { userId: user.userId, classId },
      })
    }
    return { success: true }
  } catch (_e) {
    // Likely already enrolled (unique constraint) or error
    return { success: true }
  }
}

export default function Schedule({ loaderData }: Route.ComponentProps) {
  const { classes, user, myAttendance } = loaderData
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const events = classes.map((c) => ({
    id: c.id,
    title: c.classTemplate.name,
    start: c.startTime.toISOString(),
    end: c.endTime.toISOString(),
    backgroundColor: myAttendance.includes(c.id) ? '#4ade80' : '#ffd700', // Green if enrolled
    borderColor: myAttendance.includes(c.id) ? '#4ade80' : '#ffd700',
    textColor: '#000000',
    extendedProps: {
      description: c.classTemplate.description,
      trainer: `${c.classTemplate.trainer.firstName} ${c.classTemplate.trainer.lastName}`,
      hall: c.actualHall,
      isEnrolled: myAttendance.includes(c.id),
    },
  }))

  return (
    <div className="container relative mx-auto p-8 text-center">
      <ShinyText as="h1" variant="title" className="mb-8 text-4xl">
        Schedule
      </ShinyText>
      <ShinyText as="p" variant="body" className="mb-12 text-xl">
        Find a class that fits your time.
      </ShinyText>

      <div className="rounded-xl border border-[#ffd700]/20 bg-[#1a1a1a]/50 p-6 shadow-xl backdrop-blur-sm">
        <DashboardCalendar
          events={events}
          readOnly={true}
          onEventClick={(info) => {
            setSelectedEvent({
              id: info.event.id,
              title: info.event.title,
              start: info.event.start,
              end: info.event.end,
              ...info.event.extendedProps,
            })
          }}
        />
      </div>

      {selectedEvent && (
        <div className="fade-in fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200">
          <div className="zoom-in-95 relative w-full max-w-md animate-in rounded-xl border border-[#ffd700]/40 bg-[#1a1a1a] p-8 shadow-2xl duration-200">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-[#ffd700]/60 transition-colors hover:text-[#ffd700]"
            >
              ✕
            </button>
            <ShinyText as="h2" variant="title" className="mb-4 text-2xl text-[#ffd700]">
              {selectedEvent.title}
            </ShinyText>
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between text-gray-400 text-sm">
                <span>
                  🕒 {selectedEvent.start?.toLocaleString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' })}{' '}
                  - {selectedEvent.end?.toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="rounded border border-[#ffd700]/20 bg-[#ffd700]/10 px-2 py-1 font-bold text-[#ffd700] text-xs">
                  {selectedEvent.hall}
                </span>
              </div>
              <p className="border-gray-800 border-t pt-3 text-gray-300">
                {selectedEvent.description || 'No description provided.'}
              </p>
              <div className="pt-2 font-semibold text-[#ffd700]/80 text-sm">💃 Trainer: {selectedEvent.trainer}</div>
            </div>

            <div className="mt-8 border-[#ffd700]/10 border-t pt-4">
              {selectedEvent.isEnrolled ? (
                <Form method="post" onSubmit={() => setTimeout(() => setSelectedEvent(null), 500)}>
                  <input type="hidden" name="classId" value={selectedEvent.id} />
                  <button
                    type="submit"
                    name="intent"
                    value="unenroll"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-900/40 py-2 font-bold text-red-200 transition-colors hover:bg-red-900/60 hover:text-white"
                  >
                    {isSubmitting ? 'Cancelling...' : 'Cancel Enrollment 🚫'}
                  </button>
                </Form>
              ) : !user ? (
                <a
                  href="/login"
                  className="block w-full rounded-lg border border-[#ffd700]/30 bg-[#ffd700]/10 py-2 text-center text-[#ffd700] transition-colors hover:bg-[#ffd700]/20"
                >
                  Log in to Enroll
                </a>
              ) : user.role !== 'DANCER' ? (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-gray-700 bg-gray-800 py-2 text-center font-medium text-gray-500"
                >
                  Enrollment Restricted (Dancers Only)
                </button>
              ) : (
                <Form method="post" onSubmit={() => setTimeout(() => setSelectedEvent(null), 500)}>
                  <input type="hidden" name="classId" value={selectedEvent.id} />
                  <button
                    type="submit"
                    name="intent"
                    value="enroll"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-[#ffd700] py-2 font-bold text-black shadow-lg transition-colors hover:bg-[#e6c200] hover:shadow-[#ffd700]/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enrolling...' : 'Enroll Now ✨'}
                  </button>
                </Form>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="mt-3 w-full py-2 text-gray-500 text-sm transition-colors hover:text-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
