/** Brand copy. Every line here comes from Home.pdf (page noted) unless marked otherwise. */

export const brand = {
  name: 'Krak N Sip',
  tagline: 'Tasty on the top, juicy at the bottom, non-stop.',
}

export const navLinks = [
  { id: 'brand', label: 'Brand' },
  { id: 'team', label: 'Team' },
  { id: 'products', label: 'Products' },
  { id: 'logo', label: 'Logo' },
  { id: 'post', label: 'Brand Post' },
  { id: 'poster', label: 'Poster' },
  { id: 'spin', label: 'Krak N Spin' },
]

// p3
export const meetTheBrand = [
  'Grilled octopus or squid on top, beverage below.',
  'Convenient, easy to carry, and made for on-the-go food lovers.',
  'Food and drink together in one unique cup.',
]

// p4
export const story = {
  founded: 'Founded in 2026',
  body: "Inspired by Thailand's street-food culture and its two-in-one snack cup concept, Krak N Sip reimagines the format with grilled octopus and squid paired with chilled drinks.",
}

// p5
export const missionVision = [
  {
    id: 'mission',
    title: 'Mission',
    body: 'To elevate the everyday street-food experience by making freshly grilled seafood and cold beverages accessible, enjoyable, and convenient for on-the-go food lovers.',
  },
  {
    id: 'vision',
    title: 'Vision',
    body: 'To transform local snacking culture by becoming the go-to brand for unique, hassle-free 2-in-1 food-and-drink combinations.',
  },
  {
    id: 'goal',
    title: 'Goal',
    body: 'Make a snack break more convenient, memorable, and satisfying.',
  },
]

// p6
export const uniqueAppeal = [
  { title: '2-in-1 cup', body: 'Grilled seafood and a cold drink in one portable design.' },
  { title: 'One-hand Convenience', body: 'Designed for customers who are moving around.' },
  { title: 'Social-ready', body: 'A distinctive and photogenic street-food experience.' },
]

// p18 to p21. The S line is the team's approved wording, which replaces the p20 text.
export const logoBreakdown = [
  {
    id: 'k',
    letter: 'K',
    heading: 'K is for Krak',
    body: 'The squid’s head and raised tentacle are intended to evoke the first letter of Krak.',
    image: '/images/brand/breakdown-k.webp',
  },
  {
    id: 's',
    letter: 'S',
    heading: 'S is for Sip',
    body: 'The curved squid body and cup help form the letter S, tying food and drink together.',
    image: '/images/brand/breakdown-s.webp',
  },
  {
    id: 'i',
    letter: 'I',
    heading: 'I is for Sip',
    body: 'The straw is a familiar drinking symbol and is intended to stand in visually for the letter I.',
    image: '/images/brand/breakdown-i.webp',
  },
]

// p22
export const logoComponents = [
  { title: 'Circular Emblem', body: 'Keeps the visual elements together in a compact badge.', image: '/images/brand/component-emblem.webp', width: 700, height: 644 },
  { title: 'Brand Name', body: 'The signature Krak N Sip lettering.', image: '/images/brand/component-name.webp', width: 900, height: 323 },
  { title: 'Water Droplets', body: 'A visual cue for freshness and drinks.', image: '/images/brand/component-droplets.webp', width: 247, height: 256 },
]

// p23 and p24
export const logoPalettes = [
  {
    title: 'Primary logo palette',
    colors: [
      { name: 'Orange', hex: '#FD791B' },
      { name: 'Blue', hex: '#163893' },
      { name: 'White', hex: '#FFFFFF' },
    ],
  },
  {
    title: 'Secondary logo palette',
    colors: [
      { name: 'Orange', hex: '#FD791B' },
      { name: 'Blue', hex: '#1F65FF' },
      { name: 'White', hex: '#FFFFFF' },
    ],
  },
]
export const logoTypography = 'Custom hand-drawn lettering: no standard font was used for the logo.'

// p43, plus the caption supplied by the team, with the approved Vizcarra spelling.
export const brandPost = {
  image: '/images/post/first-brand-post.webp',
  full: '/images/post/first-brand-post.png',
  alt: 'Krak N Sip first brand post: four Krak cups on a sunny beach under the headline Wait, have you tried this yet?',
  colors: [
    { name: 'Deep Blue', hex: '#145BDC' },
    { name: 'Orange', hex: '#F65B1B' },
    { name: 'Sky Blue', hex: '#77C9F4' },
    { name: 'Wood Brown', hex: '#8B390B' },
    { name: 'Sand/Cream', hex: '#FFF0D4' },
    { name: 'Leaf Green', hex: '#79A82F' },
  ],
  fonts: [
    { name: 'Super-Cell Magic / Clash' },
    { name: 'Roca One' },
    { name: 'Bobby Jones' },
    { name: 'Telegraf' },
  ],
  caption: `HERE WE GO AGAIN! THE HEAT IS RISING, AND SO ARE THE CRAVINGS.

But this time, we’ve got something new for you. 👀

🌴YOUR SUMMER SURVIVAL GUIDE:

Smoky & savory grilled seafood
Flavorful toppings
Ice-cold refreshing drink

Food + drink in ONE cup.

MEET KRAK N SIP!

Your new go-to for grilled seafood and refreshing drinks.

Krak your cravings. Sip the good vibes.

Krak N Sip
Delfin, Dan DC.
Lopez, Francheska Claire L.
Marañon, Hannah Cassandra Roi D.
Vizcarra, Renato S.`,
}

// p44
export const poster = {
  image: '/images/poster/promotional-poster.webp',
  full: '/images/poster/promotional-poster.png',
  alt: 'Krak N Sip promotional event poster: Ready to Krak and Spin? Every order gets a spin, with a six-segment prize wheel and four Krak cups.',
  colors: [
    { name: 'Bright Orange', hex: '#F65B1B' },
    { name: 'Royal Blue', hex: '#145BDC' },
    { name: 'White / Cream', hex: '#FFFDF7' },
    { name: 'Golden Yellow', hex: '#FFBE30' },
    { name: 'Deep Navy', hex: '#102A5B' },
  ],
  fonts: [
    { name: 'Lemon Milk' },
    { name: 'Poppins' },
    { name: 'Bangers', family: 'var(--font-comic)', weight: 400 },
  ],
}

// p35 to p42. Labels are plain descriptions of each mockup.
export const applications = [
  { id: 'stall', label: 'Food Stall', image: '/images/mockups/stall.webp', alt: 'Krak N Sip food stall mockup in orange and blue' },
  { id: 'carrier', label: 'Cup Carrier', image: '/images/mockups/cup-carrier.webp', alt: 'Branded orange and blue carrier holding a Krak cup' },
  { id: 'stand', label: 'Event Standee', image: '/images/mockups/poster-stand.webp', alt: 'Krak and Spin poster on a tripod stand' },
  { id: 'menu', label: 'Menu Board', image: '/images/mockups/menu-board.webp', alt: 'Krak N Sip menu board mockup' },
  { id: 'card', label: 'Loyalty Card', image: '/images/mockups/loyalty-card.webp', alt: 'Front and back of the Krak N Sip loyalty card' },
  { id: 'bag', label: 'Paper Bag', image: '/images/mockups/paper-bag.webp', alt: 'Kraft paper bag with the round Krak N Sip badge' },
  { id: 'cap', label: 'Cap', image: '/images/mockups/cap.webp', alt: 'Black cap with the Krak N Sip logo' },
  { id: 'apron', label: 'Apron', image: '/images/mockups/apron.webp', alt: 'Black apron with the Krak N Sip logo' },
]
