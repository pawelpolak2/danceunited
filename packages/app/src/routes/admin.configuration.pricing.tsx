import { Ban, Pencil, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Form, useLoaderData, useSubmit } from 'react-router'
import { EditPackageModal } from '../components/configuration/EditPackageModal'
import { Checkbox } from '../components/ui/Checkbox'
import { ConfirmModal } from '../components/ui/ConfirmModal'
import { MetallicButton } from '../components/ui/MetallicButton'
import { ShinyText } from '../components/ui/ShinyText'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { Route } from './+types/admin.configuration.pricing'

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
    ]
  }

  const packages = await prisma.package.findMany({
    orderBy: { price: 'asc' },
    where,
    include: {
      classLinks: {
        select: { classTemplateId: true },
      },
    },
  })

  const classTemplates = await prisma.classTemplate.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      style: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  })

  const transformedPackages = packages.map((p) => ({
    ...p,
    price: p.price.toString(),
  }))

  return { packages: transformedPackages, classTemplates, search }
}

export const action = async ({ request }: Route.ActionArgs) => {
  const { prisma } = await import('db')
  const formData = await request.formData()
  const intent = formData.get('intent')

  if (intent === 'create_package') {
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const classCount = parseInt(formData.get('classCount') as string)
    const validityDays = parseInt(formData.get('validityDays') as string)
    const category = formData.get('category') as any
    // isActive is always true on creation
    const isActive = true

    const classTemplateIdsStr = formData.get('classTemplateIds') as string
    let classLinksCreate = {}

    if (classTemplateIdsStr) {
      try {
        const ids = JSON.parse(classTemplateIdsStr) as string[]
        if (ids.length > 0) {
          classLinksCreate = {
            create: ids.map((id) => ({ classTemplateId: id })),
          }
        }
      } catch (e) {
        console.error('Failed to parse template IDs', e)
      }
    }

    if (!name || Number.isNaN(price)) {
      return { success: false, error: 'Invalid package data' }
    }

    await prisma.package.create({
      data: {
        name,
        description,
        price,
        classCount,
        validityDays,
        category,
        isActive,
        classLinks: classLinksCreate,
      },
    })
  }

  if (intent === 'update_package') {
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const classCount = parseInt(formData.get('classCount') as string)
    const validityDays = parseInt(formData.get('validityDays') as string)
    const category = formData.get('category') as any
    const _isActive = formData.get('isActive') === 'on'

    const classTemplateIdsStr = formData.get('classTemplateIds') as string

    // Manage relations: Delete all existing and create new ones is simplest for now
    // Alternatively can use transactions or specific updates, but deleteMany + createMany is robust here

    let classLinksIds: string[] = []
    try {
      classLinksIds = JSON.parse(classTemplateIdsStr) as string[]
    } catch (e) {
      console.error('Failed to parse template IDs', e)
    }

    // Transaction to update package and relations
    await prisma.$transaction([
      prisma.package.update({
        where: { id },
        data: {
          name,
          description,
          price,
          classCount,
          validityDays,
          category,
        },
      }),
      // Reset links
      prisma.classTemplateToPackage.deleteMany({
        where: { packageId: id },
      }),
      // Create new links
      ...(classLinksIds.length > 0
        ? [
            prisma.classTemplateToPackage.createMany({
              data: classLinksIds.map((templateId) => ({
                packageId: id,
                classTemplateId: templateId,
              })),
            }),
          ]
        : []),
    ])
  }

  if (intent === 'toggle_package_active') {
    const id = formData.get('id') as string
    const isActive = formData.get('isActive') === 'true'
    await prisma.package.update({
      where: { id },
      data: { isActive },
    })
  }

  if (intent === 'delete_package') {
    const id = formData.get('id') as string
    // Soft delete
    await prisma.package.update({
      where: { id },
      data: { isActive: false },
    })
  }
  return { success: true }
}

// ... imports ...
import { useTranslation } from '../contexts/LanguageContext'

// ... existing code ...

export default function PricingConfiguration() {
  const { packages, classTemplates, search } = useLoaderData<typeof loader>()
  const submit = useSubmit()
  const { t } = useTranslation()

  // ... state ...
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null)
  const [deletingPackageId, setDeletingPackageId] = useState<string | null>(null)

  // Search State
  const [query, setQuery] = useState(search)

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

  const filteredPackages = packages.filter((pkg) => showInactive || pkg.isActive)

  return (
    <div className="space-y-6">
      <div>
        <ShinyText as="h1" variant="title" className="mb-2 font-bold text-3xl text-white">
          {t('ADMIN_PRICING_TITLE')}
        </ShinyText>
        <p className="text-gray-400">{t('ADMIN_PRICING_SUBTITLE')}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-4">
            <h3 className="whitespace-nowrap font-bold text-gold text-xl">{t('ADMIN_PRICING_PACKAGES_TITLE')}</h3>
            <Form className="w-full max-w-xs">
              <input
                type="text"
                name="q"
                placeholder={t('ADMIN_PRICING_SEARCH_PLACEHOLDER')}
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
              label={t('ADMIN_PRICING_SHOW_INACTIVE')}
            />
            <MetallicButton
              onClick={() => {
                setSelectedPackage(null)
                setIsModalOpen(true)
              }}
              className="rounded-md border-2 border-gold/50 px-4 py-2"
            >
              {t('ADMIN_PRICING_BTN_CREATE')}
            </MetallicButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-white/10 border-b text-gray-500 text-xs uppercase">
<<<<<<< HEAD
                <th className="px-4 py-3">{t('ADMIN_TABLE_NAME')}</th>
                <th className="px-4 py-3">{t('ADMIN_TABLE_CATEGORY')}</th>
                <th className="px-4 py-3">{t('ADMIN_TABLE_CLASSES')}</th>
                <th className="px-4 py-3">{t('ADMIN_TABLE_VALIDITY')}</th>
                <th className="px-4 py-3">{t('ADMIN_TABLE_PRICE')}</th>
                <th className="px-4 py-3">{t('ADMIN_TABLE_STATUS')}</th>
                <th className="px-4 py-3 text-right">{t('ADMIN_TABLE_ACTIONS')}</th>
=======
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 md:table-cell">Category</th>
                <th className="hidden px-4 py-3 md:table-cell">Classes</th>
                <th className="hidden px-4 py-3 md:table-cell">Validity</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="hidden px-4 py-3 text-center md:table-cell">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
>>>>>>> origin/main
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 italic">
                    {t('ADMIN_PRICING_NO_PACKAGES')}
                  </td>
                </tr>
              ) : (
                filteredPackages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    className="cursor-pointer border-white/5 border-b transition-colors hover:bg-white/5"
                    onClick={() => {
                      setSelectedPackage(pkg)
                      setIsModalOpen(true)
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{pkg.name}</div>
                      {pkg.description && <div className="text-gray-500 text-xs">{pkg.description}</div>}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-300 text-xs md:table-cell">{pkg.category}</td>
                    <td className="hidden px-4 py-3 text-gray-300 text-sm md:table-cell">{pkg.classCount}</td>
                    <td className="hidden px-4 py-3 text-gray-300 text-sm md:table-cell">{pkg.validityDays} days</td>
                    <td className="px-4 py-3 font-bold text-gold">{Number(pkg.price).toFixed(2)} zł</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <StatusBadge isActive={pkg.isActive} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPackage(pkg)
                            setIsModalOpen(true)
                          }}
                          className="p-1 text-gold/80 transition-colors hover:text-gold"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <Form method="post" style={{ display: 'inline-block' }} onSubmit={(e) => e.stopPropagation()}>
                          <input type="hidden" name="intent" value="toggle_package_active" />
                          <input type="hidden" name="id" value={pkg.id} />
                          <input type="hidden" name="isActive" value={pkg.isActive ? 'false' : 'true'} />
                          <button
                            type="submit"
                            onClick={(e) => e.stopPropagation()}
                            className={`p-1 transition-colors ${pkg.isActive ? 'text-amber-600 hover:text-amber-500' : 'text-green-600 hover:text-green-500'}`}
                            title={pkg.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {pkg.isActive ? <Ban size={16} /> : <RefreshCw size={16} />}
                          </button>
                        </Form>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingPackageId(pkg.id)
                          }}
                          className="p-1 text-gray-400 transition-colors hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditPackageModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedPackage(null)
        }}
        pkg={selectedPackage}
        classTemplates={classTemplates}
      />

      <ConfirmModal
        isOpen={!!deletingPackageId}
        onClose={() => setDeletingPackageId(null)}
        onConfirm={() => {
          if (deletingPackageId) {
            submit({ intent: 'delete_package', id: deletingPackageId }, { method: 'post' })
            setDeletingPackageId(null)
          }
        }}
        title={t('ADMIN_PRICING_DELETE_TITLE')}
        description={t('ADMIN_PRICING_DELETE_DESC')}
        confirmLabel={t('CONFIRM_DELETE')}
        isDestructive
      />
    </div>
  )
}
