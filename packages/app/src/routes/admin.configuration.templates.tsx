import { Ban, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Form, useLoaderData, useSubmit } from 'react-router'
import { EditTemplateModal } from '../components/configuration/EditTemplateModal'
import { Checkbox } from '../components/ui/Checkbox'
import { MetallicButton } from '../components/ui/MetallicButton'
import { MetallicTooltip } from '../components/ui/MetallicTooltip'
import { ShinyText } from '../components/ui/ShinyText'
import type { Route } from './+types/admin.configuration.templates'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { prisma } = await import('db')
  const url = new URL(request.url)
  const search = url.searchParams.get('q') || ''

  const where: any = {}
  if (search) {
    const term = search.trim()
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { style: { name: { contains: term, mode: 'insensitive' } } },
      { trainer: { firstName: { contains: term, mode: 'insensitive' } } },
      { trainer: { lastName: { contains: term, mode: 'insensitive' } } },
    ]
  }

  // Load Templates
  const templates = await prisma.classTemplate.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      style: true,
      trainer: true,
      _count: { select: { classInstances: true } },
      whitelist: { include: { user: true } },
    },
  })

  const danceStyles = await prisma.danceStyle.findMany({
    orderBy: { name: 'asc' },
  })

  // Load Trainers for dropdown
  const trainers = await prisma.user.findMany({
    where: {
      role: { in: ['TRAINER', 'MANAGER'] },
      isActive: true,
    },
    orderBy: { firstName: 'asc' },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  // Load Dancers/All Users for Whitelist
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { firstName: 'asc' },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  return { templates, danceStyles, trainers, users, search }
}

export const action = async ({ request }: Route.ActionArgs) => {
  const { prisma } = await import('db')
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create_template') {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const styleId = formData.get('styleId') as string
    const trainerId = formData.get('trainerId') as string
    const hallId = formData.get('hallId') as any
    const level = formData.get('level') as any
    const duration = parseInt(formData.get('duration') as string) * 60 // convert to seconds
    const isActive = formData.get('isActive') === 'on'
    const isIndividual = formData.get('isIndividual') === 'on'
    const isWhitelistEnabled = formData.get('isWhitelistEnabled') === 'on'

    // Parse whitelist from create form
    const whitelistUserIdsStr = formData.get('whitelistUserIds') as string
    let whitelistCreateData = {}

    if (isWhitelistEnabled && whitelistUserIdsStr) {
      try {
        const ids = JSON.parse(whitelistUserIdsStr) as string[]
        if (ids.length > 0) {
          whitelistCreateData = {
            create: ids.map((userId) => ({ userId })),
          }
        }
      } catch (e) {
        console.error('Failed to parse whitelist IDs', e)
      }
    }

    await prisma.classTemplate.create({
      data: {
        name,
        description,
        styleId,
        trainerId,
        hallId,
        level,
        duration,
        isActive,
        isIndividual,
        isWhitelistEnabled,
        whitelist: whitelistCreateData,
      },
    })
  }

  if (intent === 'update_template') {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const styleId = formData.get('styleId') as string
    const trainerId = formData.get('trainerId') as string
    const hallId = formData.get('hallId') as any
    const level = formData.get('level') as any
    const duration = parseInt(formData.get('duration') as string) * 60

    const isActive = formData.get('isActive') === 'on'
    const isIndividual = formData.get('isIndividual') === 'on'
    const isWhitelistEnabled = formData.get('isWhitelistEnabled') === 'on'

    await prisma.classTemplate.update({
      where: { id },
      data: {
        name,
        description,
        styleId,
        trainerId,
        hallId,
        level,
        duration,
        isActive,
        isIndividual,
        isWhitelistEnabled,
      },
    })
  }

  if (intent === 'toggle_template_active') {
    const id = formData.get('id') as string
    const isActive = formData.get('isActive') === 'true'
    await prisma.classTemplate.update({
      where: { id },
      data: { isActive },
    })
  }

  if (intent === 'delete_template') {
    const id = formData.get('id') as string
    const usage = await prisma.classInstance.count({ where: { classTemplateId: id } })
    if (usage === 0) {
      await prisma.classTemplate.delete({ where: { id } })
    } else {
      return { success: false, error: 'Cannot delete template in use' }
    }
  }

  if (intent === 'add_whitelist_user') {
    const templateId = formData.get('templateId') as string
    const userId = formData.get('userId') as string
    await prisma.classWhitelist.create({
      data: { classTemplateId: templateId, userId },
    })
  }

  if (intent === 'remove_whitelist_user') {
    const templateId = formData.get('templateId') as string
    const userId = formData.get('userId') as string
    await prisma.classWhitelist.delete({
      where: {
        userId_classTemplateId: { userId, classTemplateId: templateId },
      },
    })
  }

  return { success: true }
}

export default function TemplatesConfiguration() {
  const { templates, danceStyles: styles, trainers, users, search } = useLoaderData<typeof loader>()
  const submit = useSubmit()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null)

  // Search State
  const [query, setQuery] = useState(search)

  // Sync selectedTemplate with updated loader data
  useEffect(() => {
    if (selectedTemplate) {
      const updated = templates.find((t) => t.id === selectedTemplate.id)
      if (updated) {
        setSelectedTemplate(updated)
      }
    }
  }, [templates])

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== search) {
        submit({ q: query }, { method: 'get', replace: true })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query, search, submit])

  const [showInactive, setShowInactive] = useState(false)

  const filteredTemplates = templates.filter((t) => showInactive || t.isActive)

  return (
    <div className="space-y-6">
      <div>
        <ShinyText as="h1" variant="title" className="mb-2 font-bold text-3xl text-white">
          Class Templates
        </ShinyText>
        <p className="text-gray-400">Manage templates for classes.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-4">
            <h3 className="whitespace-nowrap font-bold text-gold text-xl">Templates List</h3>
            <Form className="w-full max-w-xs">
              <input
                type="text"
                name="q"
                placeholder="Search templates..."
                className="w-full rounded border border-amber-900/50 bg-gray-950 px-4 py-2 text-amber-100 text-sm placeholder-gray-600 focus:border-amber-500/50 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </Form>
          </div>
          <div className="flex items-center gap-4">
            <Checkbox
              checked={showInactive}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowInactive(e.target.checked)}
              label="Show Inactive"
            />
            <MetallicButton
              type="button"
              onClick={() => {
                setSelectedTemplate(null)
                setIsModalOpen(true)
              }}
              className="rounded-md border-2 border-gold/50 px-4 py-2"
            >
              + Create Template
            </MetallicButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-white/10 border-b text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Style</th>
                <th className="px-4 py-3">Defaults</th>
                <th className="px-4 py-3 text-center">In Use</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500 italic">
                    No templates found.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((tpl) => (
                  <tr key={tpl.id} className="border-white/5 border-b transition-colors hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{tpl.name}</div>
                      {tpl.description && <div className="text-gray-500 text-xs">{tpl.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">{tpl.style.name}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      <div>
                        <span className="text-gray-500">Hall:</span> {tpl.hallId}
                      </div>
                      <div>
                        <span className="text-gray-500">Trainer:</span> {tpl.trainer.firstName} {tpl.trainer.lastName}
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span> {Math.round(tpl.duration / 60)}m
                      </div>
                      {tpl.isIndividual && (
                        <div className="mt-1">
                          <span className="rounded border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[10px] text-gold uppercase">
                            Individual
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400 text-sm">{tpl._count.classInstances}</td>
                    <td className="px-4 py-3 text-center">
                      {tpl.isActive ? (
                        <span className="rounded border border-green-900/40 bg-green-900/20 px-2 py-1 text-green-400 text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-gray-400 text-xs">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(tpl)
                            setIsModalOpen(true)
                          }}
                          className="p-1 text-gold/80 transition-colors hover:text-gold"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        {/* Deactivate/Activate Toggle */}
                        <Form method="post" style={{ display: 'inline' }}>
                          <input type="hidden" name="intent" value="toggle_template_active" />
                          <input type="hidden" name="id" value={tpl.id} />
                          <input type="hidden" name="isActive" value={tpl.isActive ? 'false' : 'true'} />
                          <button
                            type="submit"
                            className={`p-1 transition-colors ${tpl.isActive ? 'text-amber-600 hover:text-amber-500' : 'text-green-600 hover:text-green-500'}`}
                            title={tpl.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {tpl.isActive ? <Ban size={16} /> : <RefreshCw size={16} />}
                          </button>
                        </Form>

                        <MetallicTooltip
                          content="Cannot delete template that is in use. Deactivate it instead."
                          shouldShow={tpl._count.classInstances > 0}
                          align="end"
                        >
                          <Form
                            method="post"
                            onSubmit={(e) => {
                              if (tpl._count.classInstances > 0) {
                                e.preventDefault()
                                return
                              }
                              if (!confirm('Permanently delete this template?')) e.preventDefault()
                            }}
                            style={{ display: 'inline' }}
                          >
                            <input type="hidden" name="intent" value="delete_template" />
                            <input type="hidden" name="id" value={tpl.id} />
                            <button
                              type="submit"
                              disabled={tpl._count.classInstances > 0}
                              className={`p-1 transition-colors ${
                                tpl._count.classInstances > 0
                                  ? 'cursor-not-allowed text-gray-600'
                                  : 'text-gray-400 hover:text-red-400'
                              }`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </Form>
                        </MetallicTooltip>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTemplate(null)
        }}
        template={selectedTemplate}
        styles={styles}
        trainers={trainers}
        users={users}
      />
    </div>
  )
}
