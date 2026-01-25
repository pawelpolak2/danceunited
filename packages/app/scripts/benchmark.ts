import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import puppeteer from 'puppeteer-core'

const publicUrls = [
  'http://localhost:3000/',
  'http://localhost:3000/schedule',
  'http://localhost:3000/about',
  'http://localhost:3000/gallery',
]

const protectedUrls = ['http://localhost:3000/trainer/dashboard', 'http://localhost:3000/trainer/schedule']

interface MetricResult {
  url: string
  score: number
  metrics: Record<string, string>
}

async function runAudit(url: string, port: number): Promise<MetricResult> {
  const options = {
    logLevel: 'error' as const,
    output: 'json' as const,
    onlyCategories: ['performance'],
    port: port,
  }
  // @ts-ignore
  const runnerResult = await lighthouse(url, options)

  if (!runnerResult) {
    throw new Error('Lighthouse failed to run')
  }

  const audits = runnerResult.lhr.audits
  const metrics = {
    FCP: audits['first-contentful-paint']?.displayValue || 'N/A',
    LCP: audits['largest-contentful-paint']?.displayValue || 'N/A',
    TBT: audits['total-blocking-time']?.displayValue || 'N/A',
    CLS: audits['cumulative-layout-shift']?.displayValue || 'N/A',
    SI: audits['speed-index']?.displayValue || 'N/A',
  }

  return {
    url,
    score: runnerResult.lhr.categories.performance?.score || 0,
    metrics,
  }
}
;(async () => {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })

  const resp = await fetch(`http://localhost:${chrome.port}/json/version`)
  const { webSocketDebuggerUrl } = await resp.json()
  const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl })
  const page = await browser.newPage()
  try {
    await page.goto('http://localhost:3000/login')
    // Wait for form
    await page.waitForSelector('input[name="email"]')
    await page.type('input[name="email"]', 'benchmark_trainer@test.com')
    await page.type('input[name="password"]', 'password123')

    const submitBtn = await page.$('button[type="submit"]')
    if (submitBtn) {
      await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), submitBtn.click()])
    }

    if (page.url().includes('login')) {
      await page.goto('http://localhost:3000/register')
      await page.waitForSelector('input[name="firstName"]')
      await page.type('input[name="firstName"]', 'Bench')
      await page.type('input[name="lastName"]', 'Mark')
      await page.type('input[name="email"]', 'benchmark_trainer@test.com')
      await page.type('input[name="password"]', 'password123')

      const regBtn = await page.$('button[type="submit"]')
      if (regBtn) {
        await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), regBtn.click()])
      }
    }
  } catch (e) {
    console.error('Auth failed:', e)
  }

  await page.close()

  const results: MetricResult[] = []

  // Benchmark
  const allUrls = [...publicUrls, ...protectedUrls]

  for (const url of allUrls) {
    try {
      results.push(await runAudit(url, chrome.port))
    } catch (e) {
      console.error(`Failed to audit ${url}:`, e)
    }
  }

  await chrome.kill()
  results.forEach((_r) => {})
})()
