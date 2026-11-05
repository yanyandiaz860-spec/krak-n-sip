/**
 * End-to-end checks against a running build.
 * Usage: npm run build && npx vite preview --port 4173 && node tests/e2e.mjs [baseUrl]
 */
import { chromium } from 'playwright'
import { teamMembers } from '../src/data/team.js'
import { brandPost, missionVision } from '../src/data/content.js'
import { prizes, DEMO_NOTICE } from '../src/data/wheel.js'

const BASE = process.argv[2] ?? 'http://localhost:4173'
const REAL_SPINS = Number(process.env.REAL_SPINS ?? 12)
const INSTANT_SPINS = Number(process.env.INSTANT_SPINS ?? 150)

const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}

const browser = await chromium.launch()

async function open(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'], ...options })
  const page = await context.newPage()
  const problems = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => problems.push(`failed: ${request.url()}`))
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`${response.status()}: ${response.url()}`)
  })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  return { context, page, problems }
}

async function walk(page) {
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' })
  const { total, step } = await page.evaluate(() => ({ total: document.documentElement.scrollHeight, step: Math.round(window.innerHeight * 0.6) }))
  for (let y = 0; y <= total; y += step) {
    await page.evaluate((top) => window.scrollTo(0, top), y)
    await page.waitForTimeout(60)
  }
}

/** Independent read of the wheel: which SVG segment is physically under the pointer. */
const readWheel = (page) =>
  page.evaluate(() => {
    const shell = document.querySelector('[data-testid=wheel-shell]').getBoundingClientRect()
    const stack = document.elementsFromPoint(shell.left + shell.width / 2, shell.top + shell.height / 6)
    const hit = stack.find((el) => el.dataset?.segment !== undefined)
    const rotor = document.querySelector('[data-testid=wheel-rotor]')
    const matrix = new DOMMatrix(getComputedStyle(rotor).transform)
    return {
      segment: hit?.dataset?.segment === undefined ? null : Number(hit.dataset.segment),
      prizeId: hit?.dataset?.prize ?? null,
      angle: ((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI + 360) % 360,
      winner: Number(rotor.dataset.winner),
      landed: Number(rotor.dataset.landed),
      text: document.querySelector('[data-prize-text]')?.textContent ?? null,
      covering: stack[0]?.tagName + '.' + String(stack[0]?.className?.baseVal ?? stack[0]?.className).slice(0, 24),
    }
  })

async function goToWheel(page) {
  await page.evaluate(() => document.querySelector('[data-testid=wheel-shell]').scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.waitForTimeout(400)
}

async function spinDone(page) {
  await page.waitForFunction(() => document.querySelector('[data-testid=spin-button]').textContent === 'Play Again' && document.querySelector('[data-prize-text]'), null, { timeout: 12000 })
  // Read what a visitor would see: wait until the browser has painted the result.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

function verifySpin(state) {
  const expected = prizes[state.segment]?.label
  return state.segment !== null && state.text === expected && state.winner === state.segment && state.landed === state.segment
}

// ---------------------------------------------------------------- content
{
  const { context, page, problems } = await open()
  await walk(page)
  const text = await page.evaluate(() => document.body.innerText)

  const required = {
    Mission: missionVision[0].body,
    Vision: missionVision[1].body,
    Goal: missionVision[2].body,
    History: "Inspired by Thailand's street-food culture",
    Founded: 'Founded in 2026',
    'Sample products': 'Cucum Krak',
    'Logo process container': 'Logo Design Process',
    'Logo breakdown': 'Breakdown',
    'Primary logo slot': 'Primary Logo',
    'Monochrome logo slot': 'Monochrome Logo',
    'Secondary logo label': 'Secondary Logo',
    'Logo typography': 'Custom hand-drawn lettering',
    'Primary palette hex': '#163893',
    'Secondary palette hex': '#1F65FF',
    'Post palette hex': '#77C9F4',
    'Post typography': 'Super-Cell Magic / Clash',
    'Poster palette hex': '#FFBE30',
    'Poster typography': 'Lemon Milk',
    'Demo notice': DEMO_NOTICE,
  }
  for (const [label, needle] of Object.entries(required)) check(`Content: ${label}`, text.includes(needle))
  for (const { name } of teamMembers) check(`Team name: ${name}`, text.includes(name))

  const caption = await page.locator('.caption-text').evaluate((el) => el.textContent)
  check('Caption matches the supplied text exactly', caption === brandPost.caption)
  check('Caption has no "See less"', !text.includes('See less'))
  check('Caption credits Vizcarra, Renato S.', caption.includes('Vizcarra, Renato S.'))
  check('Misspelling Vizcara is gone', !/Vizcara/.test(text))
  await page.locator('#letter-s').evaluate((el) => el.click())
  await page.waitForTimeout(300)
  const sLine = await page.locator('.breakdown-body').textContent()
  check('Approved S symbolism is shown', sLine === 'The curved squid body and cup help form the letter S, tying food and drink together.', sLine)
  check('Old S wording is gone', !(await page.evaluate(() => document.body.innerText)).includes('while trying food'))

  for (const banned of ['Lorem', 'lorem ipsum', 'RoyKrak', 'Grip', 'Slicehaus', 'Takoyaki']) check(`Banned text absent: ${banned}`, !text.includes(banned))
  check('No prices in page text', !/₱|\b(99|129|159)\b/.test(text.replace(/#[0-9A-Fa-f]{6}/g, '')))

  const placeholders = await page.locator('[data-placeholder]').evaluateAll((els) => els.map((el) => el.dataset.placeholder))
  check('Three placeholder frames shown', placeholders.length === 3, placeholders.join(', '))

  const broken = await page.evaluate(() => [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.src))
  check('No broken images', broken.length === 0, broken.join(' '))
  const unloaded = await page.evaluate(() => [...document.images].filter((img) => !img.complete).length)
  check('All images loaded after a full scroll', unloaded === 0, `${unloaded} pending`)
  const noAlt = await page.evaluate(() => [...document.images].filter((img) => !img.hasAttribute('alt')).length)
  check('Every image has an alt attribute', noAlt === 0)

  const headings = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => Number(h.tagName[1])))
  const skips = headings.filter((level, index) => index > 0 && level - headings[index - 1] > 1).length
  check('One h1 and no skipped heading levels', headings.filter((level) => level === 1).length === 1 && skips === 0)

  const posterSize = await page.locator('#poster .art-btn img').evaluate((img) => `${img.naturalWidth}x${img.naturalHeight}`)
  check('Corrected poster keeps its original size', posterSize === '864x1080', posterSize)
  check('No console errors, warnings or failed requests', problems.length === 0, problems.slice(0, 4).join(' | '))
  await context.close()
}

// ---------------------------------------------------------------- navigation and scroll story
{
  const { context, page, problems } = await open()
  const pinned = await page.locator('.pin-spacer').count()
  check('Desktop has exactly two pinned scenes', pinned === 2, `${pinned}`)

  const trayAt = () => page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('#home .cup-part-top img')).transform).m42)
  // Wait well past the intro: the tray must stay up until the visitor scrolls.
  await page.waitForTimeout(2500)
  const startTray = await trayAt()
  check('Hero tray stays above the cup until the visitor scrolls', startTray < -20, `${startTray.toFixed(1)}px`)
  const earlyNote = await page.evaluate(() => getComputedStyle(document.querySelector('.note-end')).visibility)
  check('Final tagline note waits for scrolling', earlyNote === 'hidden', earlyNote)
  await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 1.15, behavior: 'instant' }))
  await page.waitForTimeout(1100)
  const endTray = await trayAt()
  check('Scrolling seats the hero tray on the cup', Math.abs(endTray) < 1, `${endTray.toFixed(1)}px`)
  const notes = await page.evaluate(() => [...document.querySelectorAll('.hero-note')].every((el) => getComputedStyle(el).visibility === 'visible' && Number(getComputedStyle(el).opacity) > 0.9))
  check('Tagline notes all appear', notes)

  const strawEarly = await page.evaluate(() => Number(document.querySelector('[data-testid=straw] rect[fill="#FD791B"]')?.getAttribute('height') ?? -1))
  check('Straw is filling with orange in the top tray', strawEarly > 0, `${strawEarly.toFixed(1)}`)

  for (const id of ['brand', 'team', 'products', 'logo', 'post', 'poster', 'spin']) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.locator(`.nav-pill a[href="#${id}"]`).click()
    await page.waitForFunction(
      (target) =>
        new Promise((resolve) => {
          let last = window.scrollY
          let still = 0
          const timer = setInterval(() => {
            still = window.scrollY === last ? still + 1 : 0
            last = window.scrollY
            if (still > 5) {
              clearInterval(timer)
              resolve(true)
            }
          }, 60)
        }),
      id,
      { timeout: 8000 },
    )
    const top = await page.evaluate((target) => document.getElementById(target).getBoundingClientRect().top, id)
    check(`Nav link scrolls to #${id}`, top >= -4 && top < 130, `top ${Math.round(top)}px`)
  }

  const strawLate = await page.evaluate(() => document.querySelector('[data-testid=straw] rect[height]:nth-of-type(2)')?.getAttribute('fill'))
  check('Straw turns blue past the rim', strawLate === '#1F65FF', strawLate)

  // Logo breakdown: scroll drives it, tabs jump in it
  const span = await page.evaluate(() => {
    const spacer = document.getElementById('logo-breakdown').closest('.pin-spacer')
    const top = spacer.getBoundingClientRect().top + window.scrollY
    return { top, length: spacer.offsetHeight - window.innerHeight }
  })
  for (const [progress, heading] of [[0.15, 'K is for Krak'], [0.5, 'S is for Sip'], [0.85, 'I is for Sip']]) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), span.top + span.length * progress)
    await page.waitForTimeout(250)
    const shown = await page.locator('#breakdown-panel h3').textContent()
    check(`Scrolling the breakdown shows "${heading}"`, shown === heading, shown)
  }
  await page.locator('#letter-k').click()
  await page.waitForTimeout(400)
  check('Letter tab K works while pinned', (await page.locator('#breakdown-panel h3').textContent()) === 'K is for Krak')

  check('No console problems during navigation', problems.length === 0, problems.slice(0, 3).join(' | '))
  await context.close()
}

// ---------------------------------------------------------------- product explorer
{
  const { context, page, problems } = await open()
  await page.evaluate(() => document.getElementById('products').scrollIntoView({ behavior: 'instant' }))
  await page.waitForTimeout(500)

  for (const [slug, name] of [['lemo', 'Lemo Krak'], ['berrie', 'Berrie Krak'], ['coke', 'Coke Krak'], ['cucum', 'Cucum Krak']]) {
    await page.locator(`#tab-${slug}`).click()
    await page.waitForTimeout(1100)
    const state = await page.evaluate(() => ({
      tab: document.querySelector('.flavour-tab[aria-selected=true]').textContent,
      cup: document.querySelector('.stage .cup-part-bottom img').getAttribute('src'),
      tray: document.querySelector('.stage .cup-part-top img').getAttribute('src'),
      sign: document.querySelector('.stage-sign').getAttribute('src'),
      visible: getComputedStyle(document.querySelector('.stage .cup-part-top img')).opacity,
    }))
    check(`Explorer switches to ${name}`, state.tab === name && state.cup.includes(`${slug}-cup`) && state.tray.includes(`${slug}-tray`) && state.sign.includes(slug) && state.visible === '1')
  }

  await page.locator('.hotspot').nth(0).click()
  await page.waitForTimeout(500)
  check('Top hotspot highlights the tray', (await page.locator('.stage').getAttribute('data-focus')) === 'top' && (await page.locator('.part-note').nth(0).getAttribute('aria-pressed')) === 'true')
  await page.locator('.hotspot').nth(1).click()
  await page.waitForTimeout(300)
  check('Bottom hotspot highlights the cup', (await page.locator('.stage').getAttribute('data-focus')) === 'bottom')
  await page.locator('.part-note').nth(1).click()
  check('Second press clears the highlight', (await page.locator('.stage').getAttribute('data-focus')) === null)

  await page.locator('#tab-cucum').focus()
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(200)
  check('Arrow key moves between flavours', (await page.evaluate(() => document.activeElement.id)) === 'tab-lemo')
  await page.keyboard.press('End')
  check('End key jumps to the last flavour', (await page.evaluate(() => document.activeElement.id)) === 'tab-coke')

  // Switching quickly must not leave a half-faded cup
  for (const slug of ['lemo', 'berrie', 'coke', 'cucum', 'lemo']) await page.locator(`#tab-${slug}`).click()
  await page.waitForTimeout(1400)
  const settled = await page.evaluate(() => ['.cup-part-top img', '.cup-part-bottom img', '.stage-sign', '.stage-garnish'].map((s) => getComputedStyle(document.querySelector(`.stage ${s}`)).opacity))
  check('Rapid switching settles fully visible', settled.every((value) => value === '1'), settled.join(','))
  check('No console problems in the explorer', problems.length === 0, problems.slice(0, 3).join(' | '))
  await context.close()
}

// ---------------------------------------------------------------- wheel, real animation
{
  const { context, page, problems } = await open()
  await goToWheel(page)
  const button = page.getByTestId('spin-button')
  check('Spin button starts as "Spin the wheel"', (await button.textContent()) === 'Spin the wheel')

  // Confetti is checked on a spin that wins something, which is most of them
  await page.evaluate(() => {
    window.__canvases = 0
    new MutationObserver((list) => {
      for (const { addedNodes } of list) for (const node of addedNodes) if (node.tagName === 'CANVAS') window.__canvases += 1
    }).observe(document.body, { childList: true })
  })

  let good = 0
  const seen = new Set()
  let rapidOk = true
  let disabledOk = true
  let edgesOk = true
  let accelOk = true
  for (let spin = 0; spin < REAL_SPINS; spin += 1) {
    await button.click()
    await page.waitForTimeout(150)
    disabledOk &&= (await button.getAttribute('aria-disabled')) === 'true' && (await button.textContent()) === 'Spinning...'
    const firstWinner = await page.getByTestId('wheel-rotor').getAttribute('data-winner')

    if (spin === 0) {
      // sample the angle to prove it speeds up then slows down
      const samples = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const rotor = document.querySelector('[data-testid=wheel-rotor]')
            const read = () => {
              const m = new DOMMatrix(getComputedStyle(rotor).transform)
              return ((Math.atan2(m.b, m.a) * 180) / Math.PI + 360) % 360
            }
            const out = []
            let last = read()
            const start = performance.now()
            const tick = () => {
              const now = read()
              out.push((now - last + 360) % 360)
              last = now
              if (performance.now() - start < 4900) requestAnimationFrame(tick)
              else resolve(out)
            }
            requestAnimationFrame(tick)
          }),
      )
      const third = Math.floor(samples.length / 3)
      const mean = (list) => list.reduce((sum, value) => sum + value, 0) / list.length
      const early = mean(samples.slice(0, 8))
      const peak = Math.max(...samples.slice(0, third))
      const late = mean(samples.slice(-12))
      accelOk = early < peak && late < peak / 6
      check('Wheel speeds up, then gradually slows', accelOk, `early ${early.toFixed(1)}, peak ${peak.toFixed(1)}, late ${late.toFixed(2)} deg/frame`)
    } else {
      for (let click = 0; click < 6; click += 1) await button.click({ force: true })
      rapidOk &&= (await page.getByTestId('wheel-rotor').getAttribute('data-winner')) === firstWinner
    }
    await spinDone(page)
    const state = await readWheel(page)
    if (verifySpin(state)) good += 1
    else console.log('   mismatch', state)
    seen.add(state.segment)
    const centre = state.segment * 60
    const distance = Math.abs(((360 - state.angle - centre + 540) % 360) - 180)
    edgesOk &&= distance <= 23.01
    await page.waitForTimeout(120)
  }
  check(`Prize equals the segment under the pointer on all ${REAL_SPINS} real spins`, good === REAL_SPINS, `${good}/${REAL_SPINS}, ${seen.size} different prizes`)
  check('Spin control is disabled during every spin', disabledOk)
  check('Rapid clicking cannot start a second spin', rapidOk)
  check('Wheel always stops clear of a segment edge', edgesOk)
  check('Button returns as "Play Again"', (await button.textContent()) === 'Play Again')
  const canvases = await page.evaluate(() => window.__canvases)
  check('Confetti canvas appears after stopping', canvases > 0, `${canvases} bursts`)
  check('Result is announced in a live region', (await page.getByTestId('result').getAttribute('aria-live')) === 'polite')

  await button.focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(200)
  check('Keyboard Enter starts a spin and focus stays on the button', (await button.textContent()) === 'Spinning...' && (await page.evaluate(() => document.activeElement.dataset.testid)) === 'spin-button')
  await spinDone(page)
  await page.keyboard.press('Space')
  await page.waitForTimeout(200)
  check('Keyboard Space spins again', (await button.textContent()) === 'Spinning...')
  await spinDone(page)
  check('No console problems on the wheel', problems.length === 0, problems.slice(0, 3).join(' | '))
  await context.close()
}

// ---------------------------------------------------------------- reduced motion
{
  const { context, page, problems } = await open({ reducedMotion: 'reduce' })
  check('Reduced motion: no pinned scenes', (await page.locator('.pin-spacer').count()) === 0)
  const tray = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('#home .cup-part-top img')).transform).m42)
  check('Reduced motion: hero cup is already assembled', Math.abs(tray) < 0.5)
  const notes = await page.evaluate(() => [...document.querySelectorAll('.hero-note')].every((el) => getComputedStyle(el).visibility === 'visible'))
  check('Reduced motion: tagline notes are visible', notes)
  const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((el) => Number(getComputedStyle(el).opacity) < 1).length)
  check('Reduced motion: nothing is left hidden', hidden === 0, `${hidden} hidden`)
  const moving = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
  check('Reduced motion: no running CSS animations', moving === 0, `${moving}`)

  await page.locator('#letter-s').click()
  check('Reduced motion: logo tabs still work', (await page.locator('#breakdown-panel h3').textContent()) === 'S is for Sip')

  await goToWheel(page)
  await page.evaluate(() => {
    window.__canvases = 0
    new MutationObserver((list) => {
      for (const { addedNodes } of list) for (const node of addedNodes) if (node.tagName === 'CANVAS') window.__canvases += 1
    }).observe(document.body, { childList: true })
  })
  const button = page.getByTestId('spin-button')
  let good = 0
  const tally = Array(prizes.length).fill(0)
  for (let spin = 0; spin < INSTANT_SPINS; spin += 1) {
    await button.click()
    await spinDone(page)
    const state = await readWheel(page)
    if (verifySpin(state)) good += 1
    else console.log('   mismatch', state)
    tally[state.segment] += 1
  }
  check(`Reduced motion: prize matches the pointer on all ${INSTANT_SPINS} spins`, good === INSTANT_SPINS, `${good}/${INSTANT_SPINS}, spread ${tally.join('/')}`)
  check('Every prize can be won', tally.every((count) => count > 0))
  check('Reduced motion: no confetti', (await page.evaluate(() => window.__canvases)) === 0)
  check('Reduced motion: no console problems', problems.length === 0, problems.slice(0, 3).join(' | '))
  await context.close()
}

// ---------------------------------------------------------------- layout across screens
for (const [width, height] of [[320, 640], [360, 740], [390, 844], [768, 1024], [820, 1180], [1024, 768], [1280, 720], [1440, 900], [1920, 1080]]) {
  const { context, page, problems } = await open({ viewport: { width, height } })
  await walk(page)
  const overflow = await page.evaluate(() => {
    const limit = window.innerWidth + 1
    const offenders = [...document.querySelectorAll('h1,h2,h3,h4,p,li,a,button,figure,img,article')]
      .filter((el) => !el.closest('[aria-hidden=true]') && !el.closest('.rim-ice') && el.getAttribute('alt') !== '')
      .filter((el) => {
        const box = el.getBoundingClientRect()
        return box.width > 0 && (box.right > limit || box.left < -1)
      })
      .map((el) => `${el.tagName}.${String(el.className).slice(0, 30)}`)
    return { scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth, offenders: offenders.slice(0, 5) }
  })
  check(`${width}x${height}: no horizontal overflow`, overflow.scroll <= 0 && overflow.offenders.length === 0, overflow.offenders.join(' ') || `${overflow.scroll}px`)

  const small = await page.evaluate(() =>
    [...document.querySelectorAll('button, a[href]')]
      .filter((el) => el.offsetParent !== null && !el.classList.contains('skip-link'))
      .filter((el) => {
        const box = el.getBoundingClientRect()
        return box.height < 44 || box.width < 44
      })
      .map((el) => `${el.tagName} "${el.textContent.slice(0, 20)}"`),
  )
  check(`${width}x${height}: all touch targets are at least 44px`, small.length === 0, small.slice(0, 4).join(', '))

  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll('.btn, .team-name, .part-note, .flavour-tab, .drop-name, .letter-tab')]
      .filter((el) => el.offsetParent !== null && (el.scrollWidth > el.clientWidth + 1))
      .map((el) => el.textContent.slice(0, 20)),
  )
  check(`${width}x${height}: no clipped labels`, clipped.length === 0, clipped.join(', '))
  check(`${width}x${height}: no console problems`, problems.length === 0, problems.slice(0, 2).join(' | '))
  await context.close()
}

// ---------------------------------------------------------------- phone: touch and menu
{
  const { context, page, problems } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
  check('Phone: no pinned scenes', (await page.locator('.pin-spacer').count()) === 0)
  await page.waitForTimeout(3200)
  const tray = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector('#home .cup-part-top img')).transform).m42)
  check('Phone: hero cup assembles by itself', Math.abs(tray) < 0.5)

  await page.getByRole('button', { name: 'Menu', exact: true }).tap()
  check('Phone: menu opens', await page.locator('#mobile-menu').isVisible())
  await page.locator('#mobile-menu a[href="#spin"]').tap()
  await page.waitForTimeout(1500)
  check('Phone: menu link closes the menu and scrolls', (await page.locator('#mobile-menu').count()) === 0 && (await page.evaluate(() => Math.abs(document.getElementById('spin').getBoundingClientRect().top))) < 140)

  await goToWheel(page)
  await page.getByTestId('spin-button').tap()
  await spinDone(page)
  await goToWheel(page) // the tap may have scrolled the top of the wheel off a short screen
  const state = await readWheel(page)
  check('Phone: tap spins and the prize matches the pointer', verifySpin(state), `${state.text}, segment ${state.segment}`)

  await page.evaluate(() => document.getElementById('products').scrollIntoView({ behavior: 'instant' }))
  await page.waitForTimeout(500)
  await page.locator('#tab-berrie').tap()
  await page.waitForTimeout(1100)
  await page.locator('.hotspot').nth(1).tap()
  check('Phone: tapping flavours and hotspots works', (await page.locator('.stage').getAttribute('data-focus')) === 'bottom')
  check('Phone: no console problems', problems.length === 0, problems.slice(0, 3).join(' | '))
  await context.close()
}

// ---------------------------------------------------------------- dialogs, keyboard, palette
{
  const { context, page, problems } = await open()
  await page.keyboard.press('Tab')
  check('First Tab reaches the skip link', (await page.evaluate(() => document.activeElement.textContent)) === 'Skip to content')

  await walk(page)
  for (const [label, name] of [['#post', 'First ever brand post'], ['#poster', 'Promotional event poster'], ['#applications', 'Menu Board']]) {
    const trigger = page.getByRole('button', { name: `View full size: ${name}` })
    await trigger.scrollIntoViewIfNeeded()
    await page.waitForTimeout(250)
    await trigger.click()
    await page.waitForTimeout(250)
    const open = await page.locator('dialog[open] img').evaluate((img) => img.complete && img.naturalWidth > 0)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(150)
    check(`Lightbox opens and Escape closes it: ${label}`, open && (await page.locator('dialog').count()) === 0)
  }
  const focusBack = await page.evaluate(() => document.activeElement?.className ?? '')
  check('Focus returns to the artwork after closing', focusBack.includes('art-btn'), focusBack)

  const posterArt = await page.locator('#post .art-btn img').evaluate((img) => ({ ratio: img.clientWidth / img.clientHeight, natural: img.naturalWidth / img.naturalHeight, fit: getComputedStyle(img).objectFit }))
  check('Brand post is shown uncropped', Math.abs(posterArt.ratio - posterArt.natural) < 0.01)
  const posterFit = await page.locator('#poster .art-btn img').evaluate((img) => Math.abs(img.clientWidth / img.clientHeight - img.naturalWidth / img.naturalHeight))
  check('Poster is shown uncropped', posterFit < 0.01)

  await page.locator('#poster .drop-btn').first().click()
  await page.waitForTimeout(150)
  check('Palette drop copies its hex code', (await page.evaluate(() => navigator.clipboard.readText())) === '#F65B1B')

  // Every control can be reached by Tab
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  const stops = await page.evaluate(() => [...document.querySelectorAll('a[href], button')].filter((el) => el.tabIndex >= 0 && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden').length)
  const reached = new Set()
  await page.evaluate(() => document.body.focus())
  for (let press = 0; press < stops + 6; press += 1) {
    await page.keyboard.press('Tab')
    const id = await page.evaluate(() => {
      const el = document.activeElement
      return el === document.body ? null : [...document.querySelectorAll('a[href], button')].indexOf(el)
    })
    if (id) reached.add(id)
  }
  check('Tab reaches the interactive controls', reached.size >= stops - 1, `${reached.size} of ${stops}`)
  check('No console problems with dialogs', problems.length === 0, problems.slice(0, 3).join(' | '))
  await context.close()
}

await browser.close()

const failed = results.filter(({ ok }) => !ok)
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`)
failed.forEach(({ name }) => console.log(`  FAILED: ${name}`))
process.exit(failed.length ? 1 : 0)
