/**
 * The four sample products from Home.pdf. `rim` is where the tray meets the cup,
 * as a percentage of the image height, measured from the artwork.
 * Only the general two-in-one concept text is used; there are no per-flavour claims.
 */
export const products = [
  { id: 'cucum', name: 'Cucum Krak', image: '/images/products/cucum.webp', width: 858, height: 1200, rim: 44, tone: 'orange' },
  { id: 'lemo', name: 'Lemo Krak', image: '/images/products/lemo.webp', width: 868, height: 1200, rim: 44, tone: 'blue' },
  { id: 'berrie', name: 'Berrie Krak', image: '/images/products/berrie.webp', width: 887, height: 1200, rim: 44, tone: 'orange' },
  { id: 'coke', name: 'Coke Krak', image: '/images/products/coke.webp', width: 875, height: 1200, rim: 42, tone: 'blue' },
]

// p3, p4 and p25
export const cupParts = {
  top: {
    title: 'Top Tray',
    subtitle: 'Grilled seafood',
    body: 'Grilled octopus or squid (pusit). Smoky, savory seafood prepared for a satisfying snack.',
  },
  bottom: {
    title: 'Bottom Cup',
    subtitle: 'Chilled drink',
    body: 'A cold beverage below, so food and drink stay together in one unique cup.',
  },
}
