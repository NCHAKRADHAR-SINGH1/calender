# Interactive Wall Calendar Component

A polished React/Next.js implementation of an interactive wall-calendar UI inspired by a physical tear-off desk/wall calendar.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- CSS (custom visual system)
- localStorage for client-side persistence

## Features Implemented

- Wall-calendar visual language with ring binding, hero image, and layered paper-sheet layout
- Day range selection
- Clear visual states for start, end, and in-range dates
- Hover preview while selecting the end date
- Integrated notes
- Month memo
- Day-specific note
- Range-specific note
- Data persistence using localStorage (no backend)
- Fully responsive behavior
- Desktop: segmented notes + calendar layout
- Mobile: stacked layout with touch-friendly controls
- Extra polish
- Scene switcher for hero image
- Month transition animation
- Today marker

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open http://localhost:3000

## Build and Lint

```bash
npm run lint
npm run build
```

## Submission Links

- Repository: https://github.com/NCHAKRADHAR-SINGH1/calender
- Video demo (required): Add your Loom/YouTube recording URL here
- Live demo (optional): https://calender-pink-five.vercel.app/

## Implementation Notes

- All state is managed on the client side as requested.
- No backend or API is used.
- The visual style intentionally mirrors the provided inspiration while keeping interactions modern and responsive.
