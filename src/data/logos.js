/**
 * Logo files.
 *
 * Primary, monochrome and the process artwork are still to be supplied. Until
 * then `src` stays null and the site shows a labelled placeholder frame.
 *
 * To add a file: put it in public/images/logos/ and set src, for example
 * src: '/images/logos/primary-logo.png'. Nothing else needs changing.
 */
export const logos = [
  { id: 'primary', label: 'Primary Logo', src: null, alt: 'Krak N Sip primary logo' },
  { id: 'secondary', label: 'Secondary Logo', src: '/images/brand/secondary-logo.webp', alt: 'Krak N Sip secondary logo: the squid and cup inside a round blue badge' },
  { id: 'monochrome', label: 'Monochrome Logo', src: null, alt: 'Krak N Sip monochrome logo' },
]

/**
 * Add one entry per process image, in order. An empty list shows the placeholder.
 * Example: { src: '/images/logo-process/sketch-01.jpg', alt: 'First pencil sketch' }
 */
export const logoProcess = []
