/**
 * Captures each section at each screen size by scrolling like a visitor.
 * Usage: node tests/screenshots.mjs [baseUrl] [widths] [ids]
 *   e.g. node tests/screenshots.mjs http://localhost:5199 1440,390 home,spin
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const base = process.argv[2] ?? 'http://localhost:4173'
const onlyWidths = process.argv[3]?.split(',').map(Number)
const onlyIds = process.argv[4]?.split(',')

const SIZES = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
].filter(({ width }) => !onlyWidths || onlyWidths.includes(width))

const ALL_IDS = ['home', 'brand', 'story', 'mission', 'team', 'unique', 'products', 'rim', 'logo', 'logo-breakdown', 'logo-system', 'post', 'poster', 'spin', 'applications', 'footer']
const IDS = ALL_IDS.filter((id) => !onlyIds || onlyIds.includes(id))

const browser = await chromium.launch()
for (const size of SIZES) {
  mkdirSync(`tests/screenshots/${size.name}`, { recursive: true })
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height } })
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' })

  // Walk the page once so scroll-triggered reveals have fired.
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < total; y += Math.round(size.height * 0.6)) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(90)
  }

  for (const id of IDS) {
    const top = await page.evaluate((target) => {
      const el = target === 'footer' ? document.querySelector('footer') : document.getElementById(target)
      const holder = el.closest('.pin-spacer') ?? el
      return holder.getBoundingClientRect().top + window.scrollY
    }, id)
    await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, top - (id === 'home' ? 0 : 8)))
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `tests/screenshots/${size.name}/${String(ALL_IDS.indexOf(id) + 1).padStart(2, '0')}-${id}.jpg`, type: 'jpeg', quality: 78 })
  }
  await page.close()
  console.log(`${size.name}: done`)
}
await browser.close()
