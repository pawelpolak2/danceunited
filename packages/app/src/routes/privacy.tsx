import { Link } from 'react-router'
import type { MetaArgs } from 'react-router'
import { ShinyText } from '../components/ui'
import { useTranslation } from '../contexts/LanguageContext'

export function meta(_args: MetaArgs) {
  return [
    { title: 'Polityka Prywatności - Dance United' },
    { name: 'description', content: 'Zasady przetwarzania danych osobowych' },
  ]
}

export default function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-amber-50">
      <div className="mb-12">
        <ShinyText as="h1" variant="title" className="mb-4 text-4xl text-amber-400">
          {t('PRIVACY_PAGE_TITLE')}
        </ShinyText>
        <p className="text-lg opacity-80">{t('PRIVACY_EFFECTIVE_DATE')}</p>
      </div>

      <div className="prose prose-invert prose-amber max-w-none">
        <h2>{t('PRIVACY_S1_HEADER')}</h2>
        <p>{t('PRIVACY_ADMIN_P1')}</p>
        <p>{t('PRIVACY_ADMIN_P2')}</p>

        <h2>{t('PRIVACY_S2_HEADER')}</h2>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: translations need html */}
        <p dangerouslySetInnerHTML={{ __html: t('PRIVACY_PURPOSE_P1') }} />

        <h2>{t('PRIVACY_S3_HEADER')}</h2>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: translations need html */}
        <p dangerouslySetInnerHTML={{ __html: t('PRIVACY_RECIPIENTS_P1') }} />

        <h2>{t('PRIVACY_S4_HEADER')}</h2>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: translations need html */}
        <p dangerouslySetInnerHTML={{ __html: t('PRIVACY_RIGHTS_P1') }} />

        <h2>{t('PRIVACY_S5_HEADER')}</h2>
        <p>{t('PRIVACY_RETENTION_P1')}</p>
      </div>

      <div className="mt-12 border-amber-900/30 border-t pt-8">
        <Link to="/" className="text-amber-400 transition-colors hover:text-amber-300">
          {t('BACK_TO_HOME')}
        </Link>
      </div>
    </div>
  )
}
