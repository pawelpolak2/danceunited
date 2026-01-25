import { Link } from 'react-router'
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
              I accept the{' '}
              <Link to="/terms" target="_blank" className="text-amber-400 underline hover:text-amber-300">
                Terms of Service
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
              I accept the{' '}
              <Link to="/privacy" target="_blank" className="text-amber-400 underline hover:text-amber-300">
                Privacy Policy (RODO)
              </Link>
            </span>
          }
        />
        {errors?.privacy && <p className="text-red-500 text-xs">{errors.privacy}</p>}
      </div>
    </div>
  )
}
