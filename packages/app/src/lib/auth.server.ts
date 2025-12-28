import bcrypt from 'bcryptjs'
import { prisma } from 'db'

export interface UserSession {
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
}

const _SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production'
const SESSION_COOKIE_NAME = 'danceunited_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }
  return { valid: true }
}

/**
 * Create a session cookie
 */
export function createSessionCookie(sessionData: UserSession): string {
  // In production, use a proper session store (Redis, database, etc.)
  // For now, we'll use a simple JSON-encoded cookie
  const sessionValue = Buffer.from(JSON.stringify(sessionData)).toString('base64')
  return `${SESSION_COOKIE_NAME}=${sessionValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}; ${
    process.env.NODE_ENV === 'production' ? 'Secure;' : ''
  }`
}

/**
 * Parse session from cookie
 */
export function parseSession(cookieHeader: string | null): UserSession | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, string>
  )

  const sessionValue = cookies[SESSION_COOKIE_NAME]
  if (!sessionValue) return null

  try {
    const sessionData = JSON.parse(Buffer.from(sessionValue, 'base64').toString())
    return sessionData as UserSession
  } catch {
    return null
  }
}

/**
 * Get current user from request
 */
export async function getCurrentUser(request: Request): Promise<UserSession | null> {
  const cookieHeader = request.headers.get('Cookie')
  const session = parseSession(cookieHeader)

  if (!session) return null

  // Verify user still exists and is active
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
  })

  if (!user || !user.isActive) return null

  return {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  }
}

/**
 * Create logout cookie (clears session)
 */
export function createLogoutCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ${
    process.env.NODE_ENV === 'production' ? 'Secure;' : ''
  }`
}
