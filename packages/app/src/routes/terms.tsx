import { Link } from 'react-router'
import type { MetaArgs } from 'react-router'
import { ShinyText } from '../components/ui'
import { useTranslation } from '../contexts/LanguageContext'

export function meta(_args: MetaArgs) {
  return [
    { title: 'Regulamin - Dance United' },
    { name: 'description', content: 'Regulamin sklepu i świadczenia usług' },
    // Note: Meta tags strictly require static strings for server rendering usually,
    // unless we access a server-side translation store. Keeping hardcoded for now as is typical.
  ]
}

export default function TermsPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-amber-50">
      <div className="mb-12">
        <ShinyText as="h1" variant="title" className="mb-4 text-4xl text-amber-400">
          {t('TERMS_PAGE_TITLE')}
        </ShinyText>
        <p className="text-lg opacity-80">{t('TERMS_SUBTITLE')}</p>
      </div>

      <div className="prose prose-invert prose-amber max-w-none">
        <h2>{t('TERMS_S1_HEADER')}</h2>
        <p>{t('TERMS_S1_P1')}</p>
        <p>{t('TERMS_S1_P2')}</p>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: translations need html */}
        <p dangerouslySetInnerHTML={{ __html: t('TERMS_S1_P3') }} />

        <h2>{t('TERMS_S2_HEADER')}</h2>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: translations need html */}
        <p dangerouslySetInnerHTML={{ __html: t('TERMS_DEF_P1') }} />

        <h2>{t('TERMS_S3_HEADER')}</h2>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: translations need html */}
        <p dangerouslySetInnerHTML={{ __html: t('TERMS_SERV_P1') }} />

        <h2>{t('TERMS_S4_HEADER')}</h2>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: translations need html */}
        <p dangerouslySetInnerHTML={{ __html: t('TERMS_WITHDRAW_P1') }} />

        <h2>{t('TERMS_S5_HEADER')}</h2>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: translations need html */}
        <p dangerouslySetInnerHTML={{ __html: t('TERMS_COMPLAINT_P1') }} />

        <h2>{t('TERMS_S6_HEADER')}</h2>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: translations need html */}
        <p dangerouslySetInnerHTML={{ __html: t('TERMS_DATA_P1') }} />
      </div>

      <div className="mt-12 border-amber-900/30 border-t pt-8">
        <Link to="/" className="text-amber-400 transition-colors hover:text-amber-300">
          {t('BACK_TO_HOME')}
        </Link>
      </div>
    </div>
  )
}
