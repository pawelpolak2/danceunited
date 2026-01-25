export const p24Config = {
  merchantId: Number(process.env.P24_MERCHANT_ID) || 0,
  posId: Number(process.env.P24_POS_ID) || 0,
  crc: process.env.P24_CRC || '',
  apiKey: process.env.P24_API_KEY || '',
  sandbox: process.env.P24_SANDBOX === 'true',
  urlReturn: process.env.P24_URL_RETURN || 'http://localhost:5173/dancer/my-packages', // Default for local dev
  urlStatus: process.env.P24_URL_STATUS || 'http://localhost:5173/api/p24/notify', // Default for local dev
}

export const getP24Url = (sandbox: boolean) =>
  sandbox ? 'https://sandbox.przelewy24.pl' : 'https://secure.przelewy24.pl'
