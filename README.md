# Krak N Sip Brand Portfolio

One-page brand portfolio website for Krak N Sip, built for the ITWS06 Final Requirement.

Built with React, Vite, Tailwind CSS, GSAP and canvas-confetti. Fonts are self-hosted.

## Run it

```bash
npm install
npm run dev        # local development
npm run build      # production build into dist/
npm run preview    # serve the production build
```

## Replacing temporary content

Each item below needs one file and, at most, one line changed. No layout work is needed.

| Item | Where the file goes | What to change |
|---|---|---|
| Team photo | Overwrite `public/images/team/member-01.jpg` to `member-04.jpg` (portrait, 3:4) | Set `isTemporary: false` for that member in `src/data/team.js` |
| Primary logo | `public/images/logos/primary-logo.png` | Set `src` for `primary` in `src/data/logos.js` |
| Monochrome logo | `public/images/logos/monochrome-logo.png` | Set `src` for `monochrome` in `src/data/logos.js` |
| Logo process artwork | `public/images/logo-process/` | Add one entry per image to `logoProcess` in `src/data/logos.js` |

## Outstanding items

Replace before final submission:

- [ ] **Team photos.** All four are the same template image from Home.pdf page 2. The instructor requires owners' pictures.
- [ ] **Primary logo.** Placeholder frame is showing.
- [ ] **Monochrome logo.** Placeholder frame is showing.
- [ ] **Logo Design Process artwork.** Placeholder frame is showing. The instructor requires the logo process.

## Corrected artwork

The poster and six mockups had text errors, which were corrected on copies:

- `artwork/originals/` holds untouched extracts from Home.pdf.
- `artwork/corrected/` holds the edited copies.
- `artwork/comparisons/` holds before-and-after sheets.

To rebuild them:

```bash
python tools/backup_originals.py <Home.pdf> .
python tools/fix_artwork.py .
python tools/publish_artwork.py .
```

Run `tools/publish_artwork.py` again after `tools/extract_assets.py`, because that script restores the uncorrected images.

## Where things live

```
src/data/        All copy, team, logos, products and prizes
src/sections/    One file per part of the page
src/components/  Shared pieces: nav, straw progress, split cup, palette, frames
src/lib/         Wheel maths, motion setup
public/images/   Artwork extracted from Home.pdf
tools/           Scripts that extract artwork from Home.pdf
tests/           Unit tests, browser tests, screenshot tool
```

## Tests

```bash
npm run test:unit                                    # wheel maths
npm run build && npx vite preview --port 4173        # then, in a second terminal:
npm run test:e2e                                     # browser tests
npm run shots -- http://localhost:4173               # screenshots into tests/screenshots
```

## Deployment

`netlify.toml` is ready, and the publish folder is `dist`. The large source files in the `krak-*` folders are not part of the build.
