import { Link } from 'react-router'
import { useTranslation } from '../../contexts/LanguageContext'
import { Checkbox } from '../ui/Checkbox'

interface LegalConsentsProps {
  tosAccepted: boolean
  privacyAccepted: boolean
  onTosChange: (accepted: boolean) => void
  onPrivacyChange: (accepted: boolean) => void
  errors?: {
    tos?: string
    privacy?: string
  }
}

export function LegalConsents({
  tosAccepted,
  privacyAccepted,
  onTosChange,
  onPrivacyChange,
  errors,
}: LegalConsentsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Checkbox
          name="tosAccepted"
          checked={tosAccepted}
          onChange={(e) => onTosChange(e.target.checked)}
          required
          label={
            <span className="text-gray-300 text-sm">
              {t('LEGAL_CONSENT_PREFIX')}
              <Link to="/terms" target="_blank" className="text-amber-400 underline hover:text-amber-300">
                {t('LEGAL_TERMS_LINK')}
              </Link>
            </span>
          }
        />
        {errors?.tos && <p className="text-red-500 text-xs">{errors.tos}</p>}
      </div>

      <div className="space-y-2">
        <Checkbox
          name="privacyAccepted"
          checked={privacyAccepted}
          onChange={(e) => onPrivacyChange(e.target.checked)}
          required
          label={
            <span className="text-gray-300 text-sm">
              {t('LEGAL_CONSENT_PREFIX')}
              <Link to="/privacy" target="_blank" className="text-amber-400 underline hover:text-amber-300">
                {t('LEGAL_PRIVACY_LINK')}
              </Link>
            </span>
          }
        />
        {errors?.privacy && <p className="text-red-500 text-xs">{errors.privacy}</p>}
      </div>
    </div>
  )
}
