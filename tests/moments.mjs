/**
 * Captures the interactive moments a static section shot cannot show.
 * Usage: node tests/moments.mjs [baseUrl]
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] ?? 'http://localhost:4173'
const out = 'tests/screenshots/moments'
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
const shot = (page, name) => page.screenshot({ path: `${out}/${name}.jpg`, type: 'jpeg', quality: 80 })
const jump = (page, selector, block = 'center') =>
  page.evaluate(([s, b]) => document.querySelector(s).scrollIntoView({ block: b, behavior: 'instant' }), [selector, block])

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(base, { waitUntil: 'networkidle' })
await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' })
await page.waitForTimeout(1200)
await shot(page, 'hero-tray-lifted')
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.18))
await page.waitForTimeout(1200)
await shot(page, 'hero-cup-assembled')

await jump(page, '#products', 'start')
await page.waitForTimeout(600)
await page.locator('.hotspot').nth(0).click()
await page.waitForTimeout(700)
await shot(page, 'explorer-top-tray-hotspot')
await page.locator('#tab-coke').click()
await page.waitForTimeout(1300)
await page.locator('.hotspot').nth(1).click()
await page.waitForTimeout(700)
await shot(page, 'explorer-coke-bottom-cup')

const span = await page.evaluate(() => {
  const spacer = document.getElementById('logo-breakdown').closest('.pin-spacer')
  return { top: spacer.getBoundingClientRect().top + window.scrollY, length: spacer.offsetHeight - window.innerHeight }
})
await page.evaluate((y) => window.scrollTo(0, y), span.top + span.length * 0.5)
await page.waitForTimeout(900)
await shot(page, 'logo-breakdown-s')

await jump(page, '[data-testid=wheel-shell]')
await page.waitForTimeout(500)
await page.getByTestId('spin-button').click()
await page.waitForTimeout(1600)
await shot(page, 'wheel-spinning')
// Keep spinning until a prize lands, so the shot shows full confetti.
for (let attempt = 0; attempt < 8; attempt += 1) {
  await page.waitForFunction(() => document.querySelector('[data-testid=spin-button]').textContent === 'Play Again', null, { timeout: 12000 })
  await page.waitForTimeout(450)
  const text = await page.locator('[data-prize-text]').textContent()
  if (text !== 'Try Again') break
  await page.waitForTimeout(1500)
  await page.getByTestId('spin-button').click()
}
await shot(page, 'wheel-result-confetti')
await page.close()

const phone = await browser.newPage({ viewport: { width: 390, height: 844 } })
await phone.goto(base, { waitUntil: 'networkidle' })
await phone.waitForTimeout(3300)
await shot(phone, 'phone-hero')
await phone.getByRole('button', { name: 'Menu', exact: true }).click()
await phone.waitForTimeout(300)
await shot(phone, 'phone-menu')
await browser.close()
console.log('moments captured')
