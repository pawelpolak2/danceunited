import type { DateSelectArg, EventClickArg } from '@fullcalendar/core'
import { prisma } from 'db'
import { useState } from 'react'
import { redirect, useFetcher, useLoaderData } from 'react-router'
import { CreateClassTemplateModal } from '../components/dashboard/CreateClassTemplateModal'
import { DashboardCalendar } from '../components/dashboard/DashboardCalendar'
import { EditClassModal } from '../components/dashboard/EditClassModal'
import { ScheduleClassModal } from '../components/dashboard/ScheduleClassModal'
import { MetallicButton, ShinyText } from '../components/ui'
import { getCurrentUser } from '../lib/auth.server'
import type { Route } from './+types/trainer-dashboard'

// biome-ignore lint/correctness/noEmptyPattern: this is boilerplate code!
export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Trainer Dashboard - Dance United' },
    { name: 'description', content: 'Trainer dashboard and class management' },
  ]
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request)

  if (!user) {
    return redirect('/login')
  }

  // Only trainers can access this dashboard
  if (user.role !== 'TRAINER') {
    return redirect('/')
  }

  // Fetch dance styles for the modal
  const danceStyles = await prisma.danceStyle.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  // Fetch class templates for scheduling
  const classTemplates = await prisma.classTemplate.findMany({
    where: { isActive: true },
    // Ideally filter by trainerId or allow all if sharing is enabled
    // For now assuming trainers can schedule their own templates or public ones
    orderBy: { name: 'asc' },
    select: { id: true, name: true, duration: true, hallId: true },
  })

  // Fetch created classes (instances) for the calendar
  // Fetching all future classes or a range. For simplicity, fetching all relevant ones.
  const classes = await prisma.classInstance.findMany({
    where: {
      actualTrainerId: user.userId, // Show classes taught by this trainer
      // potentially also show classes where they are substituting, etc.
    },
    include: {
      classTemplate: true,
    },
    // Notes: recurrenceGroupId is included by default with findMany unless selected specifically
  })

  // Serialize classes for the client side (convert Dates to ISO strings)
  const serializedClasses = classes.map((c) => ({
    ...c,
    startTime: c.startTime.toISOString(),
    endTime: c.endTime.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))

  const events = classes.map((c) => ({
    id: c.id,
    title: c.classTemplate.name,
    start: c.startTime.toISOString(),
    end: c.endTime.toISOString(),
    backgroundColor: c.actualHall === 'HALL1' ? '#d97706' : '#78350f', // Amber-600 vs Amber-900
    borderColor: '#b45309',
  }))

  return { user, danceStyles, classTemplates, events, classes: serializedClasses }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getCurrentUser(request)
  if (!user || user.role !== 'TRAINER') {
    return redirect('/')
  }

  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'createClassTemplate') {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const level = formData.get('level') as any
    const durationMinutes = parseInt(formData.get('duration') as string, 10) || 60
    const durationSeconds = durationMinutes * 60
    const styleId = formData.get('styleId') as string
    const hallId = formData.get('hallId') as any
    const isRestricted = formData.get('isRestricted') === 'on'

    if (!name || !styleId) {
      return { error: 'Name and Style are required' }
    }

    try {
      await prisma.classTemplate.create({
        data: {
          name,
          description,
          level,
          duration: durationSeconds,
          styleId,
          hallId,
          isRestricted,
          trainerId: user.userId,
        },
      })
      return { success: true, intent: 'createClassTemplate' }
    } catch (error) {
      console.error('Failed to create class template:', error)
      return { error: 'Failed to create class template' }
    }
  }

  if (intent === 'scheduleClass') {
    const classTemplateId = formData.get('classTemplateId') as string
    const startTimeStr = formData.get('startTime') as string
    const hall = formData.get('hall') as any
    const notes = formData.get('notes') as string

    // Recurrence fields
    const isRecurring = formData.get('isRecurring') === 'on'
    const recurrenceEndType = formData.get('recurrenceEndType') as string
    const recurrenceCount = parseInt(formData.get('recurrenceCount') as string) || 4
    const recurrenceEndDateStr = formData.get('recurrenceEndDate') as string

    if (!classTemplateId || !startTimeStr) {
      return { error: 'Missing required fields' }
    }

    try {
      const template = await prisma.classTemplate.findUnique({
        where: { id: classTemplateId },
        select: { duration: true },
      })

      if (!template) {
        return { error: 'Class template not found' }
      }

      const instancesData = []
      const baseStartTime = new Date(startTimeStr)
      const recurrenceGroupId = isRecurring ? crypto.randomUUID() : null

      // Default to just one instance
      let maxCount = 1

      if (isRecurring) {
        if (recurrenceEndType === 'count') {
          maxCount = recurrenceCount
        } else if (recurrenceEndType === 'date' && recurrenceEndDateStr) {
          // Calculate weeks difference roughly or loop until date
          // Safety cap at 52 weeks (1 year)
          maxCount = 52
        }
      }

      for (let i = 0; i < maxCount; i++) {
        const instanceStartTime = new Date(baseStartTime)
        // Add weeks
        instanceStartTime.setDate(baseStartTime.getDate() + i * 7)

        // Check end date condition if strictly date based
        if (isRecurring && recurrenceEndType === 'date' && recurrenceEndDateStr) {
          const endDate = new Date(recurrenceEndDateStr)
          // Set end date to end of day to include classes on that day
          endDate.setHours(23, 59, 59)
          if (instanceStartTime > endDate) break
        }

        const instanceEndTime = new Date(instanceStartTime.getTime() + template.duration * 1000)

        instancesData.push({
          classTemplateId,
          startTime: instanceStartTime,
          endTime: instanceEndTime,
          actualHall: hall,
          actualTrainerId: user.userId,
          notes,
          recurrenceGroupId,
        })
      }

      // Use transaction to create all
      await prisma.$transaction(instancesData.map((data) => prisma.classInstance.create({ data })))

      return { success: true, intent: 'scheduleClass' }
    } catch (error) {
      console.error('Failed to schedule class:', error)
      return { error: 'Failed to schedule class' }
    }
  }

  if (intent === 'updateClass') {
    const classInstanceId = formData.get('classInstanceId') as string
    const startTimeStr = formData.get('startTime') as string
    const hall = formData.get('hall') as any
    const notes = formData.get('notes') as string
    const updateScope = formData.get('updateScope') as string

    if (!classInstanceId || !startTimeStr) {
      return { error: 'Missing required fields' }
    }

    try {
      // Fetch instance to get its template duration and recurrence info
      const instance = await prisma.classInstance.findUnique({
        where: { id: classInstanceId },
        include: { classTemplate: { select: { duration: true } } },
      })

      if (!instance) {
        return { error: 'Class instance not found' }
      }

      // Ensure user is the trainer
      if (instance.actualTrainerId !== user.userId) {
        return { error: 'Unauthorized to edit this class' }
      }

      const newStartTime = new Date(startTimeStr)
      const templateDuration = instance.classTemplate.duration

      if (updateScope === 'series' && instance.recurrenceGroupId) {
        // Calculate time difference
        const timeDiff = newStartTime.getTime() - instance.startTime.getTime()

        // Find all future instances in the group (or all? usually all future, but "series" implies all)
        // Let's do all for consistency to keep the series aligned
        const seriesInstances = await prisma.classInstance.findMany({
          where: { recurrenceGroupId: instance.recurrenceGroupId },
        })

        const updates = seriesInstances.map((s) => {
          const sNewStart = new Date(s.startTime.getTime() + timeDiff)
          const sNewEnd = new Date(sNewStart.getTime() + templateDuration * 1000)

          return prisma.classInstance.update({
            where: { id: s.id },
            data: {
              startTime: sNewStart,
              endTime: sNewEnd,
              actualHall: hall,
              notes, // Apply notes to all? Yes, simpler for now.
            },
          })
        })

        await prisma.$transaction(updates)
      } else {
        // Single update
        const endTime = new Date(newStartTime.getTime() + templateDuration * 1000)
        await prisma.classInstance.update({
          where: { id: classInstanceId },
          data: {
            startTime: newStartTime,
            endTime,
            actualHall: hall,
            notes,
          },
        })
      }

      return { success: true, intent: 'updateClass' }
    } catch (error) {
      console.error('Failed to update class:', error)
      return { error: 'Failed to update class' }
    }
  }

  if (intent === 'deleteClass') {
    const classInstanceId = formData.get('classInstanceId') as string
    const updateScope = formData.get('updateScope') as string

    if (!classInstanceId) {
      return { error: 'Missing required fields' }
    }

    try {
      const instance = await prisma.classInstance.findUnique({
        where: { id: classInstanceId },
      })

      if (!instance) {
        return { error: 'Class instance not found' }
      }

      if (instance.actualTrainerId !== user.userId) {
        return { error: 'Unauthorized to delete this class' }
      }

      if (updateScope === 'series' && instance.recurrenceGroupId) {
        await prisma.classInstance.deleteMany({
          where: { recurrenceGroupId: instance.recurrenceGroupId },
        })
      } else {
        await prisma.classInstance.delete({
          where: { id: classInstanceId },
        })
      }

      return { success: true, intent: 'deleteClass' }
    } catch (error) {
      console.error('Failed to delete class:', error)
      return { error: 'Failed to delete class' }
    }
  }

  return null
}

export default function TrainerDashboardPage() {
  const { danceStyles, classTemplates, events, classes } = useLoaderData<typeof loader>()

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedClass, setSelectedClass] = useState<(typeof classes)[0] | null>(null)

  const fetcher = useFetcher()

  // Close modals on success
  if (fetcher.data?.success) {
    if (fetcher.data.intent === 'createClassTemplate' && isTemplateModalOpen) {
      setIsTemplateModalOpen(false)
    }
    if (fetcher.data.intent === 'scheduleClass' && isScheduleModalOpen) {
      setIsScheduleModalOpen(false)
    }
    if ((fetcher.data.intent === 'updateClass' || fetcher.data.intent === 'deleteClass') && isEditModalOpen) {
      setIsEditModalOpen(false)
    }
  }

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // selectInfo.start is the selected date (with time if timeGrid)
    setSelectedDate(selectInfo.start)
    setIsScheduleModalOpen(true)
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    const classId = clickInfo.event.id
    const foundClass = classes.find((c) => c.id === classId)
    if (foundClass) {
      setSelectedClass(foundClass)
      setIsEditModalOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <ShinyText as="h1" variant="title" className="mb-2 text-4xl">
              trainer dashboard
            </ShinyText>
            <ShinyText variant="body" className="text-lg opacity-80">
              manage your classes and schedule
            </ShinyText>
          </div>

          <div className="flex gap-3">
            <MetallicButton
              onClick={() => {
                setSelectedDate(new Date())
                setIsScheduleModalOpen(true)
              }}
            >
              Schedule Class
            </MetallicButton>
            <MetallicButton onClick={() => setIsTemplateModalOpen(true)}>Create Class Template</MetallicButton>
          </div>
        </div>

        <div className="rounded-lg border border-amber-900/20 bg-gray-900/30 p-4">
          <DashboardCalendar events={events} onDateSelect={handleDateSelect} onEventClick={handleEventClick} />
        </div>
      </div>

      <CreateClassTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        danceStyles={danceStyles}
      />

      <ScheduleClassModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        templates={classTemplates}
        defaultDate={selectedDate}
      />

      <EditClassModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        classInstance={selectedClass}
      />
    </div>
  )
}
