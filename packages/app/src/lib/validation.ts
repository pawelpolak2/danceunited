/**
 * Validation utilities for form inputs
 */

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Validate registration form data
 */
export function validateRegistration(data: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  password?: string | null
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.firstName = 'First name is required'
  } else if (data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters'
  } else if (data.firstName.trim().length > 100) {
    errors.firstName = 'First name must be less than 100 characters'
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.lastName = 'Last name is required'
  } else if (data.lastName.trim().length < 2) {
    errors.lastName = 'Last name must be at least 2 characters'
  } else if (data.lastName.trim().length > 100) {
    errors.lastName = 'Last name must be less than 100 characters'
  }

  if (!data.email || data.email.trim().length === 0) {
    errors.email = 'Email is required'
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }
  }

  if (!data.password || data.password.length === 0) {
    errors.password = 'Password is required'
  } else {
    if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
    } else if (!/[A-Z]/.test(data.password)) {
      errors.password = 'Password must contain at least one uppercase letter'
    } else if (!/[a-z]/.test(data.password)) {
      errors.password = 'Password must contain at least one lowercase letter'
    } else if (!/[0-9]/.test(data.password)) {
      errors.password = 'Password must contain at least one number'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate login form data
 */
export function validateLogin(data: {
  email?: string | null
  password?: string | null
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.email || data.email.trim().length === 0) {
    errors.email = 'Email is required'
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address'
    }
  }

  if (!data.password || data.password.length === 0) {
    errors.password = 'Password is required'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
