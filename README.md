# Card Stack Carousel

A motion-first event recommendation carousel built for a chat-like assistant bubble.

## What’s implemented
- Swipeable card stack with layered depth and peek cards
- Card-to-card forward swipe with simultaneous front/back movement
- Card-to-list transition at the final index
- Backward list-to-card swipe with mirrored motion
- Page-dot indicator that updates only at commit
- Reduced-motion support with a 120ms cross-fade alternative
- Responsive width recalculation on resize
- Gesture interruption support for repeated swipes

## Tech stack
- React
- Inline CSS for fast, focused layout
- `requestAnimationFrame` driven animation choreography

## Notes
- `src/components/CardStackCarousel1.jsx` is the polished implementation shown in `src/App.jsx`
- The list mode is rendered as a compact vertical rows view after the last card
- A screen recording should be captured locally to demonstrate real-time feel and gesture quality

## Next improvements
- Add a native React Native version
- Add a dedicated reduced-motion visual polish for the list row entrance
- Provide a short video capture in the repo preview section
