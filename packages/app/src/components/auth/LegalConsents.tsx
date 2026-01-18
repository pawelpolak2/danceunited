import { useState } from 'react'
import { Checkbox } from '../ui/Checkbox'
import { Modal } from '../ui/Modal'
import { ShinyText } from '../ui/ShinyText'

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
  const [showTos, setShowTos] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

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
              <button
                type="button"
                onClick={() => setShowTos(true)}
                className="text-amber-400 underline hover:text-amber-300"
              >
                Terms of Service
              </button>
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
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                className="text-amber-400 underline hover:text-amber-300"
              >
                Privacy Policy (RODO)
              </button>
            </span>
          }
        />
        {errors?.privacy && <p className="text-red-500 text-xs">{errors.privacy}</p>}
      </div>

      {/* Terms of Service Modal */}
      <Modal isOpen={showTos} onClose={() => setShowTos(false)} title="Terms of Service">
        <div className="max-h-[60vh] space-y-4 overflow-y-auto text-gray-300 text-sm">
          <ShinyText className="font-bold text-amber-400">1. Introduction</ShinyText>
          <p>
            Welcome to Dance United. By using our services, you agree to comply with and be bound by the following terms
            and conditions.
          </p>

          <ShinyText className="font-bold text-amber-400">2. Services</ShinyText>
          <p>
            We provide dance classes, workshops, and related events. Participation is at your own risk. Please consult
            with a physician before starting any physical activity.
          </p>

          <ShinyText className="font-bold text-amber-400">3. Payments & Cancellations</ShinyText>
          <p>
            Payments are due upon booking. Cancellations made less than 24 hours in advance may not be eligible for a
            refund.
          </p>

          <ShinyText className="font-bold text-amber-400">4. Code of Conduct</ShinyText>
          <p>
            We expect all members to treat others with respect. Harassment or inappropriate behavior will result in
            immediate termination of your membership.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onTosChange(true)
              setShowTos(false)
            }}
            className="rounded bg-amber-500 px-4 py-2 font-bold text-black hover:bg-amber-400"
          >
            Accept & Close
          </button>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy Policy & RODO">
        <div className="max-h-[60vh] space-y-4 overflow-y-auto text-gray-300 text-sm">
          <ShinyText className="font-bold text-amber-400">1. Data Controller</ShinyText>
          <p>
            The administrator of your personal data is Dance United. (Insert full address and contact details here).
          </p>

          <ShinyText className="font-bold text-amber-400">2. Purpose of Processing</ShinyText>
          <p>
            We process your data to:
            <ul className="ml-5 list-disc">
              <li>Manage class bookings and attendance</li>
              <li>Process payments</li>
              <li>Communicate schedule changes</li>
              <li>Ensure safety and security</li>
            </ul>
          </p>

          <ShinyText className="font-bold text-amber-400">3. Your Rights (RODO)</ShinyText>
          <p>
            Under GDPR (RODO), you have the right to:
            <ul className="ml-5 list-disc">
              <li>Access your data</li>
              <li>Correct your data</li>
              <li>Request deletion (Right to be forgotten)</li>
              <li>Object to processing</li>
            </ul>
          </p>

          <ShinyText className="font-bold text-amber-400">4. Data Retention</ShinyText>
          <p>
            We retain your data for as long as you are an active member and for legal/tax compliance purposes
            thereafter.
          </p>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onPrivacyChange(true)
              setShowPrivacy(false)
            }}
            className="rounded bg-amber-500 px-4 py-2 font-bold text-black hover:bg-amber-400"
          >
            Accept & Close
          </button>
        </div>
      </Modal>
    </div>
  )
}
