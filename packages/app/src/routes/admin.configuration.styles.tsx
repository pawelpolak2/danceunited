import { Trash2 } from 'lucide-react'
import { Form, useLoaderData } from 'react-router'
import { MetallicButton } from '../components/ui/MetallicButton'
import { ShinyText } from '../components/ui/ShinyText'
import type { Route } from './+types/admin.configuration.styles'

export const loader = async () => {
  const { prisma } = await import('db')
  const danceStyles = await prisma.danceStyle.findMany({
    orderBy: { name: 'asc' },
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

  if (intent === 'delete_style') {
    const id = formData.get('id') as string
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

  return (
    <div className="space-y-6">
      <div>
        <ShinyText as="h1" variant="title" className="mb-2 font-bold text-3xl text-white">
          Dance Styles
        </ShinyText>
        <p className="text-gray-400">Manage available dance styles.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-6">
        <h3 className="mb-6 font-bold text-gold text-xl">Existing Styles</h3>

        {/* Create Style Form */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4">
          <h4 className="mb-4 font-bold text-sm text-white uppercase tracking-wider">Add New Dance Style</h4>
          <Form method="post" className="flex flex-col items-end gap-4 md:flex-row">
            <input type="hidden" name="intent" value="create_style" />

            <div className="w-full flex-[2] space-y-1">
              <label className="text-gray-400 text-xs">Style Name</label>
              <input
                name="name"
                required
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
                placeholder="e.g. Hip Hop"
              />
            </div>
            <div className="w-full flex-[3] space-y-1">
              <label className="text-gray-400 text-xs">Description</label>
              <input
                name="description"
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
                placeholder="Short description..."
              />
            </div>

            <MetallicButton type="submit" className="w-full rounded-md border-2 border-gold/50 px-4 py-2 md:w-auto">
              Add Style
            </MetallicButton>
          </Form>
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
                </div>
                <Form method="post" onSubmit={(e) => !confirm(`Delete ${style.name}?`) && e.preventDefault()}>
                  <input type="hidden" name="intent" value="delete_style" />
                  <input type="hidden" name="id" value={style.id} />
                  <button
                    type="submit"
                    className="text-red-400 opacity-0 transition-opacity hover:text-red-300 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </Form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
