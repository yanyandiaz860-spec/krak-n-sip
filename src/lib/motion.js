import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Media queries shared by every animated section. */
export const MOTION_OK = '(prefers-reduced-motion: no-preference)'
export const REDUCED = '(prefers-reduced-motion: reduce)'
/** Pinned scroll scenes only run on large screens with motion allowed. */
export const PINNED = '(min-width: 1024px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)'
export const UNPINNED = '(prefers-reduced-motion: no-preference) and (max-width: 1023.98px), (prefers-reduced-motion: no-preference) and (max-height: 619.98px)'

export const prefersReducedMotion = () => window.matchMedia(REDUCED).matches

export { gsap, ScrollTrigger, useGSAP }
