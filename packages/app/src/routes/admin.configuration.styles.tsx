import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Form, useLoaderData } from 'react-router'
import { EditStyleModal } from '../components/configuration/EditStyleModal'
import { MetallicButton } from '../components/ui/MetallicButton'
import { MetallicTooltip } from '../components/ui/MetallicTooltip'
import { ShinyText } from '../components/ui/ShinyText'
import type { Route } from './+types/admin.configuration.styles'

export const loader = async () => {
  const { prisma } = await import('db')
  const danceStyles = await prisma.danceStyle.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { classTemplates: true } },
    },
  })
  return { danceStyles }
}

export const action = async ({ request }: Route.ActionArgs) => {
  const { prisma } = await import('db')
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create_style') {
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    try {
      await prisma.danceStyle.create({
        data: { name, description },
      })
    } catch (_e) {
      return { success: false, error: 'Style already exists' }
    }
  }

  if (intent === 'update_style') {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    try {
      await prisma.danceStyle.update({
        where: { id },
        data: { name, description },
      })
    } catch (_e) {
      return { success: false, error: 'Failed to update style' }
    }
  }

  if (intent === 'delete_style') {
    const id = formData.get('id') as string
    const usage = await prisma.classTemplate.count({ where: { styleId: id } })

    if (usage > 0) {
      return { success: false, error: 'Cannot delete style in use' }
    }

    try {
      await prisma.danceStyle.delete({ where: { id } })
    } catch (_e) {
      // failed
    }
  }

  return { success: true }
}

export default function StylesConfiguration() {
  const { danceStyles: styles } = useLoaderData<typeof loader>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<any | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <ShinyText as="h1" variant="title" className="mb-2 font-bold text-3xl text-white">
          Dance Styles
        </ShinyText>
        <p className="text-gray-400">Manage available dance styles.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h3 className="font-bold text-gold text-xl">Existing Styles</h3>
          <MetallicButton
            type="button"
            onClick={() => {
              setSelectedStyle(null)
              setIsModalOpen(true)
            }}
            className="rounded-md border-2 border-gold/50 px-4 py-2"
          >
            + Add New Style
          </MetallicButton>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {styles.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-500 italic">No dance styles defined.</div>
          ) : (
            styles.map((style) => (
              <div
                key={style.id}
                className="group flex items-start justify-between rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:border-gold/30"
              >
                <div>
                  <h4 className="font-bold text-lg text-white">{style.name}</h4>
                  {style.description && <p className="mt-1 text-gray-400 text-sm">{style.description}</p>}
                  {style._count.classTemplates > 0 && (
                    <p className="mt-2 text-amber-500/80 text-xs">Used in {style._count.classTemplates} template(s)</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStyle(style)
                      setIsModalOpen(true)
                    }}
                    className="p-1 text-gold/80 transition-colors hover:text-gold"
                  >
                    <Pencil size={16} />
                  </button>

                  <MetallicTooltip
                    content="Cannot delete style that is in use."
                    shouldShow={style._count.classTemplates > 0}
                    align="end"
                  >
                    <Form
                      method="post"
                      onSubmit={(e) => {
                        if (style._count.classTemplates > 0) {
                          e.preventDefault()
                          return
                        }
                        if (!confirm(`Delete ${style.name}?`)) e.preventDefault()
                      }}
                    >
                      <input type="hidden" name="intent" value="delete_style" />
                      <input type="hidden" name="id" value={style.id} />
                      <button
                        type="submit"
                        disabled={style._count.classTemplates > 0}
                        className={`p-1 transition-colors ${
                          style._count.classTemplates > 0
                            ? 'cursor-not-allowed text-gray-600'
                            : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </Form>
                  </MetallicTooltip>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <EditStyleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} style={selectedStyle} />
    </div>
  )
}
