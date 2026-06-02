# Business Requirements & Process Mapping Tool

An AI-powered tool that turns a plain-English business problem description into a structured swimlane process map, a requirements register, and a stakeholder influence matrix — all in the browser, no server required.

## What it does

1. **Process Map** — generates a swimlane diagram (SVG) showing the proposed process across roles, with start, end, process, and decision nodes
2. **Requirements Register** — produces functional and non-functional requirements using "shall" language, tagged with priority (Must/Should/Could) and category
3. **Stakeholder Matrix** — identifies stakeholders with interest/influence ratings and plots them on a 2×2 grid with recommended actions

All output can be downloaded: the process map as an SVG file, the requirements and stakeholders as CSV.

## File structure

```
requirements-tool/
├── index.html              Main HTML structure (no inline styles or JS)
├── css/
│   └── styles.css          All visual styling + CSS custom properties
├── js/
│   ├── app.js              Main controller — state, event wiring, orchestration
│   ├── api.js              Anthropic API call + JSON parsing + typed errors
│   ├── render.js           Requirements table and stakeholder table/grid
│   ├── diagram.js          Inline SVG swimlane diagram generator
│   └── exports.js          SVG and CSV download helpers
├── data/
│   └── examples.js         Four example problems + one static sample output
└── README.md               This file
```

## How to run

Open `index.html` directly in any modern browser — **no build step, no server, no npm**.

```
double-click index.html
# or
open requirements-tool/index.html
# or serve with any static file server:
npx serve requirements-tool
```

### For the AI features (Generate Analysis button)

1. Get a free API key at [console.anthropic.com](https://console.anthropic.com)
2. Paste the key into the API Key field — it never leaves your browser
3. Describe (or load) a business problem and click **Generate Analysis**

The sample output in Section 4 renders on page load with no API key needed.

## How to deploy

1. Push the `requirements-tool/` folder to a GitHub repository
2. Go to **Settings → Pages** and set the source to your main branch
3. GitHub Pages will serve `index.html` — done

Or deploy to Netlify by dragging the folder into [app.netlify.com/drop](https://app.netlify.com/drop).

## Extending this project

- **Export to DOCX** — add [docx.js](https://docx.js.org/) via CDN and write a `downloadDOCX()` function in `exports.js`
- **BPMN XML export** — serialize `processData` to BPMN 2.0 XML (standard interchange format for process mining tools)
- **Version history** — save each analysis result to `localStorage` with a timestamp and add a history sidebar
- **Connect to a process mining tool** — call the Celonis or Signavio API to push the generated process model directly
- **Real-time collaboration** — use a CRDT library (e.g. Yjs) to let multiple analysts edit the problem description simultaneously

## Architecture notes

- **No global state leakage** — `api.js`, `diagram.js`, `render.js`, and `exports.js` are pure functions that receive data and DOM containers as arguments
- **Script load order** — `examples.js` → `api.js` → `diagram.js` → `render.js` → `exports.js` → `app.js` (enforced by `<script>` order in `index.html`)
- **CSS custom properties** — all colours defined at `:root` in `styles.css`; no hardcoded colour values in JS
- **Typed errors** — `api.js` throws `APIKeyError`, `RateLimitError`, `ParseError`, or `NetworkError`; `app.js` handles each distinctly
- **Graceful degradation** — if JS fails, the HTML structure is still readable and the hero/how-it-works sections remain visible
