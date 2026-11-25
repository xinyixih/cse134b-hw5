# CSE 134B – Homework 5 (Xinyi Hu)

## Web Component
`<fun-facts>` is on the home page (`index.html`), defined in `fun-facts.js`.

## SSG Exercise (Part 4)
- Folder: `ssg-exercise/`
- Generator: Eleventy
- Pages to preview: Home (`index.njk`) and About (`about.njk`)
- Shared section: footer in `ssg-exercise/_includes/footer.njk`
- Install, build, and preview commands are in `ssg-exercise/README.md`

## Design Note
**Visitor goal:** Learn a few quick facts about me, or get a random fun fact
for a break while browsing my portfolio.

**Tracing one action: Surprise me:**
1. The visitor activates the "Surprise me" button inside `<fun-facts>`.
2. Its click listener calls `loadRandomFact()`, which disables the button and
   sets the status (`role="status"`) to "Loading a random fact…".
3. `fetch()` sends a GET request to the Useless Facts API
4. The code checks `response.ok`, parses the JSON, and checks that `text` is a string.
5. If success, the fact is placed in the page with `textContent`, the detail
   line changes to "Random fact from the web", and the status says
   "Random fact loaded."
6. IF failure (offline, bad status, etc.), the status says
   "Couldn't load a fact. Check your connection and press Surprise me to try again." The rest of the page keeps working.
7. In both cases the button is re-enabled, so the visitor can retry without reloading.

**Other features:** The "Compact view" button outside the component toggles
the observed `compact` attribute, which hides the detail line. The choice is
saved in `localStorage` (`hw5-fun-facts-mode`) and restored on reload. The
component uses CSS custom properties (`--facts-bg`, `--facts-text`,
`--facts-border`) set from the site's theme, so it fits both light and dark themes.