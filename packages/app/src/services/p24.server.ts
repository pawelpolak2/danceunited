import crypto from 'node:crypto'
import { getP24Url, p24Config } from '../config/p24'

interface P24RegisterParams {
  sessionId: string
  amount: number // Amount in Groszy (e.g., 10 PLN = 1000)
  currency: string
  description: string
  email: string
  urlReturn: string
  urlStatus: string
  client?: string // Client name
  address?: string
  zip?: string
  city?: string
  country?: string
  phone?: string
  language?: string
  method?: number
  timeLimit?: number
  channel?: number
  waitForResult?: boolean
  regulationAccept?: boolean
  shipping?: number
  transferLabel?: string
  encoding?: string
  methodRefId?: string
  cart?: any
  additional?: any
}

interface P24RegisterResponse {
  data: {
    token: string
  }
  responseCode: number
}

interface P24VerifyParams {
  sessionId: string
  amount: number
  currency: string
  orderId: number
}

interface P24VerifyResponse {
  data: {
    status: string
  }
  responseCode: number
}

export class P24Service {
  private baseUrl: string
  private merchantId: number
  private posId: number
  private crc: string
  private apiKey: string

  constructor() {
    this.baseUrl = getP24Url(p24Config.sandbox)
    this.merchantId = p24Config.merchantId
    this.posId = p24Config.posId
    this.crc = p24Config.crc
    this.apiKey = p24Config.apiKey
  }

  private calculateSignature(data: string): string {
    const hash = crypto.createHash('sha384')
    hash.update(data)
    return hash.digest('hex')
  }

  // Generate sign for transaction registration
  // format: {"sessionId","merchantId","amount","currency","crc"}
  private generateRegisterSign(sessionId: string, amount: number, currency: string): string {
    const data = `{"sessionId":"${sessionId}","merchantId":${this.merchantId},"amount":${amount},"currency":"${currency}","crc":"${this.crc}"}`
    return this.calculateSignature(data)
  }

  // Generate sign for notification
  // format: {"merchantId","posId","sessionId","amount","originAmount","currency","orderId","methodId","statement","crc"}
  // NOTE: This checks the incoming signature, usually we recalculate to match
  public checkNotificationSign(
    merchantId: number,
    posId: number,
    sessionId: string,
    amount: number,
    originAmount: number,
    currency: string,
    orderId: number,
    methodId: number,
    statement: string,
    receivedSign: string
  ): boolean {
    const data = `{"merchantId":${merchantId},"posId":${posId},"sessionId":"${sessionId}","amount":${amount},"originAmount":${originAmount},"currency":"${currency}","orderId":${orderId},"methodId":${methodId},"statement":"${statement}","crc":"${this.crc}"}`
    const calculated = this.calculateSignature(data)
    return calculated === receivedSign
  }

  // Generate sign for verify
  // format: {"sessionId","orderId","amount","currency","crc"}
  private generateVerifySign(sessionId: string, orderId: number, amount: number, currency: string): string {
    const data = `{"sessionId":"${sessionId}","orderId":${orderId},"amount":${amount},"currency":"${currency}","crc":"${this.crc}"}`
    return this.calculateSignature(data)
  }

  async registerTransaction(params: P24RegisterParams): Promise<string> {
    const sign = this.generateRegisterSign(params.sessionId, params.amount, params.currency)

    const payload = {
      merchantId: this.merchantId,
      posId: this.posId,
      ...params,
      sign,
    }

    const response = await fetch(`${this.baseUrl}/api/v1/transaction/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${this.posId}:${this.apiKey}`).toString('base64')}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('P24 Registration Error:', response.status, errorText)
      throw new Error(`P24 Registration Failed: ${response.statusText} - ${errorText}`)
    }

    const result = (await response.json()) as P24RegisterResponse
    if (!result.data || !result.data.token) {
      throw new Error('P24 Registration: No token received')
    }

    return `${this.baseUrl}/trnRequest/${result.data.token}`
  }

  async verifyTransaction(params: P24VerifyParams): Promise<boolean> {
    const sign = this.generateVerifySign(params.sessionId, params.orderId, params.amount, params.currency)

    const payload = {
      merchantId: this.merchantId,
      posId: this.posId,
      ...params,
      sign,
    }

    const response = await fetch(`${this.baseUrl}/api/v1/transaction/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${this.posId}:${this.apiKey}`).toString('base64')}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      // Verification failed (e.g. already verified or invalid data)
      const errorText = await response.text()
      console.error('P24 Verify Error:', response.status, errorText)
      // We might return false here instead of throwing if we want to handle it gracefully
      return false
    }

    const result = (await response.json()) as P24VerifyResponse
    return result.data && result.data.status === 'success'
  }
}

export const p24Service = new P24Service()
