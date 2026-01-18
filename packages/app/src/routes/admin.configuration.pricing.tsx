import { Trash2 } from 'lucide-react'
import { Form, useLoaderData } from 'react-router'
import { MetallicButton } from '../components/ui/MetallicButton'
import { ShinyText } from '../components/ui/ShinyText'
import type { Route } from './+types/admin.configuration.pricing'

export const loader = async () => {
  const { prisma } = await import('db')
  const packages = await prisma.package.findMany({
    orderBy: { price: 'asc' },
    where: { isActive: true },
  })
  return { packages }
}

export const action = async ({ request }: Route.ActionArgs) => {
  const { prisma } = await import('db')
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create_package') {
    const name = formData.get('name') as string
    const price = parseFloat(formData.get('price') as string)

    if (!name || Number.isNaN(price)) {
      return { success: false, error: 'Invalid package data' }
    }

    await prisma.package.create({
      data: { name, price, isActive: true, classCount: 1, validityDays: 30 },
    })
  }

  if (intent === 'delete_package') {
    const id = formData.get('id') as string
    await prisma.package.update({
      where: { id },
      data: { isActive: false },
    })
  }
  return { success: true }
}

export default function PricingConfiguration() {
  const { packages } = useLoaderData<typeof loader>()

  return (
    <div className="space-y-6">
      <div>
        <ShinyText as="h1" variant="title" className="mb-2 font-bold text-3xl text-white">
          Pricing Configuration
        </ShinyText>
        <p className="text-gray-400">Manage packages and pricing options.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-6">
        <h3 className="mb-6 font-bold text-gold text-xl">Current Packages</h3>

        {/* Create Package Form */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-4">
          <h4 className="mb-4 font-bold text-sm text-white uppercase tracking-wider">Create New Package</h4>
          <Form method="post" className="flex flex-col items-end gap-4 md:flex-row">
            <input type="hidden" name="intent" value="create_package" />

            <div className="w-full flex-[2] space-y-1">
              <label className="text-gray-400 text-xs">Package Name</label>
              <input
                name="name"
                required
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
                placeholder="e.g. 10 Class Pass"
              />
            </div>

            <div className="w-full flex-1 space-y-1">
              <label className="text-gray-400 text-xs">Price</label>
              <input
                name="price"
                type="number"
                step="0.01"
                required
                className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-gold"
                placeholder="0.00"
              />
            </div>

            <MetallicButton type="submit" className="w-full rounded-md border-2 border-gold/50 px-4 py-2 md:w-auto">
              Create
            </MetallicButton>
          </Form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-white/10 border-b text-gray-500 text-xs uppercase">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500 italic">
                    No packages found.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="border-white/5 border-b transition-colors hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-white">{pkg.name}</td>
                    <td className="px-4 py-3 font-bold text-gold">{Number(pkg.price ?? 0).toFixed(2)} zł</td>
                    <td className="px-4 py-3">
                      {pkg.isActive ? (
                        <span className="rounded border border-green-800 bg-green-900/40 px-2 py-1 text-green-400 text-xs">
                          Active
                        </span>
                      ) : (
                        <span className="rounded border border-red-800 bg-red-900/40 px-2 py-1 text-red-400 text-xs">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Form
                        method="post"
                        onSubmit={(e) => !confirm('Delete this package?') && e.preventDefault()}
                        style={{ display: 'inline-block' }}
                      >
                        <input type="hidden" name="intent" value="delete_package" />
                        <input type="hidden" name="id" value={pkg.id} />
                        <button type="submit" className="p-1 text-gray-400 transition-colors hover:text-red-400">
                          <Trash2 size={16} />
                        </button>
                      </Form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
