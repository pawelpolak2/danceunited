import { ShinyText } from './ShinyText'

interface FormErrorProps {
  message?: string
  errors?: Record<string, string>
}

export function FormError({ message, errors }: FormErrorProps) {
  if (!message && (!errors || Object.keys(errors).length === 0)) {
    return null
  }

  return (
    <div className="form-error-container">
      {message && (
        <p className="mb-2 text-sm">
          <ShinyText variant="body" className="text-red-400 text-sm">
            {message}
          </ShinyText>
        </p>
      )}
      {errors && Object.keys(errors).length > 0 && (
        <ul className="list-inside list-disc space-y-1 text-sm">
          {Object.values(errors).map((error, index) => (
            <li key={index}>
              <ShinyText variant="body" className="text-red-400 text-sm">
                {error}
              </ShinyText>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
