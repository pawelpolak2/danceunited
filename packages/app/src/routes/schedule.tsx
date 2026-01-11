import { prisma } from 'db'
import { useState } from 'react'
import { useLoaderData, Form, useNavigation } from 'react-router'
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
              classId: { in: classes.map(c => c.id) }
          },
          select: { classId: true }
      })
      myAttendance = attendance.map(a => a.classId)
  }

  return { classes, user, myAttendance }
}

export async function action({ request }: Route.ActionArgs) {
    const user = await getCurrentUser(request)
    if (!user || user.role !== 'DANCER') {
        return { success: false, error: "Authorized dancers only" }
    }

    const formData = await request.formData()
    const classId = formData.get('classId') as string
    const intent = formData.get('intent') as string

    if (!classId) return { success: false, error: "Invalid class" }

    try {
        if (intent === 'enroll') {
             await prisma.attendance.create({
                 data: { userId: user.userId, classId }
             })
        } else if (intent === 'unenroll') {
            await prisma.attendance.deleteMany({
                where: { userId: user.userId, classId }
            })
        }
        return { success: true }
    } catch (e) {
        // Likely already enrolled (unique constraint)
        return { success: true } 
    }
}

export default function Schedule({ loaderData }: Route.ComponentProps) {
  const { classes, user, myAttendance } = loaderData
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const navigation = useNavigation()
  const isSubmitting = navigation.state === "submitting"

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
        isEnrolled: myAttendance.includes(c.id)
    }
  }))

  return (
    <div className="container mx-auto p-8 text-center relative">
      <ShinyText as="h1" variant="title" className="mb-8 text-4xl">
        Schedule
      </ShinyText>
      <ShinyText as="p" variant="body" className="text-xl mb-12">
        Find a class that fits your time.
      </ShinyText>
      
      <div className="bg-[#1a1a1a]/50 backdrop-blur-sm rounded-xl p-6 border border-[#ffd700]/20 shadow-xl">
          <DashboardCalendar 
              events={events} 
              readOnly={true} 
              onEventClick={(info) => {
                  setSelectedEvent({
                      id: info.event.id,
                      title: info.event.title,
                      start: info.event.start,
                      end: info.event.end,
                      ...info.event.extendedProps
                  })
              }}
          />
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-[#1a1a1a] border border-[#ffd700]/40 p-8 rounded-xl max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button 
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 text-[#ffd700]/60 hover:text-[#ffd700] transition-colors"
               >
                  ✕
               </button>
               <ShinyText as="h2" variant="title" className="text-2xl mb-4 text-[#ffd700]">{selectedEvent.title}</ShinyText>
               <div className="space-y-3 text-left">
                   <div className="flex justify-between items-center text-gray-400 text-sm">
                       <span>🕒 {selectedEvent.start?.toLocaleString([], {weekday: 'long', hour: '2-digit', minute:'2-digit'})} - {selectedEvent.end?.toLocaleString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       <span className="px-2 py-1 bg-[#ffd700]/10 rounded text-[#ffd700] text-xs font-bold border border-[#ffd700]/20">{selectedEvent.hall}</span>
                   </div>
                   <p className="text-gray-300 border-t border-gray-800 pt-3">{selectedEvent.description || "No description provided."}</p>
                   <div className="text-[#ffd700]/80 text-sm font-semibold pt-2">
                       💃 Trainer: {selectedEvent.trainer}
                   </div>
               </div>
               
               <div className="mt-8 pt-4 border-t border-[#ffd700]/10">
                   {selectedEvent.isEnrolled ? (
                       <Form method="post" onSubmit={() => setTimeout(() => setSelectedEvent(null), 500)}>
                           <input type="hidden" name="classId" value={selectedEvent.id} />
                           <button 
                              type="submit"
                              name="intent"
                              value="unenroll"
                              disabled={isSubmitting}
                              className="w-full py-2 bg-red-900/40 hover:bg-red-900/60 text-red-200 hover:text-white border border-red-500/30 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                           >
                              {isSubmitting ? 'Cancelling...' : 'Cancel Enrollment 🚫'}
                           </button>
                       </Form>
                   ) : !user ? (
                        <a href="/login" className="block w-full py-2 bg-[#ffd700]/10 hover:bg-[#ffd700]/20 text-[#ffd700] rounded-lg text-center border border-[#ffd700]/30 transition-colors">
                            Log in to Enroll
                        </a>
                   ) : user.role !== 'DANCER' ? (
                       <button disabled className="w-full py-2 bg-gray-800 text-gray-500 rounded-lg text-center border border-gray-700 cursor-not-allowed font-medium">
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
                              className="w-full py-2 bg-[#ffd700] hover:bg-[#e6c200] text-black font-bold rounded-lg transition-colors shadow-lg hover:shadow-[#ffd700]/20 disabled:opacity-50"
                           >
                              {isSubmitting ? 'Enrolling...' : 'Enroll Now ✨'}
                           </button>
                       </Form>
                   )}
               </div>

               <button 
                  onClick={() => setSelectedEvent(null)}
                  className="w-full mt-3 py-2 text-gray-500 hover:text-gray-300 transition-colors text-sm"
               >
                  Close
               </button>
           </div>
        </div>
      )}
    </div>
  )
}
