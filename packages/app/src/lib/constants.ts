/**
 * Application-wide constants
 */

export const APP_NAME = 'Dance United'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  LOGOUT: '/api/auth/logout',
} as const

export const FONTS = {
  TITLE: '"Cinzel", serif',
  BODY: '"EB Garamond", Georgia, serif',
} as const

export const COLORS = {
  GOLD: '#ffd700',
  GOLD_80: 'rgba(255, 215, 0, 0.8)',
  GOLD_60: 'rgba(255, 215, 0, 0.6)',
  GOLD_50: 'rgba(255, 215, 0, 0.5)',
  GOLD_40: 'rgba(255, 215, 0, 0.4)',
  GOLD_30: 'rgba(255, 215, 0, 0.3)',
} as const
