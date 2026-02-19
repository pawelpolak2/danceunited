import { Link } from 'react-router'
import { useTranslation } from '../contexts/LanguageContext'

export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="flex-none border-amber-900/20 border-t bg-gray-950 py-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 text-gray-400 text-sm md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <img src="/logos/logo-transparent.webp" alt="Dance United" className="h-8 w-auto opacity-80" />
            <span className="font-bold font-serif text-amber-500 uppercase tracking-wider">{t('BRAND_NAME')}</span>
          </div>
          <p className="opacity-70">{t('FOOTER_DESCRIPTION')}</p>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-amber-500 uppercase tracking-wider">{t('FOOTER_COMPANY')}</h3>
          <ul className="space-y-2">
            <li>DANCE UNITED SP. Z O.O.</li>
            <li>ul. JOACHIMA LELEWELA 48</li>
            <li>61-409 POZNAŃ</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-amber-500 uppercase tracking-wider">{t('FOOTER_LEGAL')}</h3>
          <ul className="space-y-2">
            <li>NIP: 7792455144</li>
            <li>KRS: 0000654614</li>
            <li>REGON: 365803012</li>
            <li>
              <Link to="/terms" target="_blank" className="transition-colors hover:text-amber-400">
                {t('FOOTER_TERMS')}
              </Link>
            </li>
            <li>
              <Link to="/privacy" target="_blank" className="transition-colors hover:text-amber-400">
                {t('FOOTER_PRIVACY')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-bold text-amber-500 uppercase tracking-wider">{t('FOOTER_CONTACT')}</h3>
          <ul className="space-y-2">
            <li>
              <a href="mailto:info@danceunited.pl" className="transition-colors hover:text-amber-400">
                info@danceunited.pl
              </a>
            </li>
            <li>
              <a href="tel:797797078" className="transition-colors hover:text-amber-400">
                797 797 078
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-12 border-amber-900/10 border-t pt-8 text-center text-xs opacity-50">
        &copy; {new Date().getFullYear()} DANCE UNITED SP. Z O.O. {t('FOOTER_RIGHTS')}
      </div>
    </footer>
  )
}
