# Agent Evals App

A production-style static web application for evaluating an AI agent's behavior from traces.

## Architecture

The codebase is split into clear layers:

- `src/ui/` for DOM wiring, rendering, and interaction control
- `src/core/` for trace normalization and evaluation logic
- `src/services/` for external integrations such as model-based judging
- `src/data/` for sample traces and prompt templates
- `src/styles/` for design tokens, base styles, and component styling

## Structure

```text
.
├── docs/
│   └── index.html
├── src/
│   ├── core/
│   │   ├── judge.js
│   │   └── trace.js
│   ├── data/
│   │   └── examples.js
│   ├── services/
│   │   └── llmJudge.js
│   ├── styles/
│   │   ├── base.css
│   │   ├── components.css
│   │   └── tokens.css
│   ├── ui/
│   │   ├── controller.js
│   │   ├── dom.js
│   │   └── render.js
│   └── main.js
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
├── index.html
├── README.md
├── LICENSE
└── .gitignore
```

## Development model

This is still a static frontend app, but it is organized the way a small production client app would be:

- rendering is separated from evaluation logic
- core trace parsing is isolated from the UI
- external LLM calls live behind a service boundary
- sample data and prompt templates are not mixed into the UI layer
- styles are split into tokens, base primitives, and components

## Running locally

Open `index.html` directly in a browser, or serve the repository with any static file server.

## Deploying

Push to GitHub and enable GitHub Pages with GitHub Actions. The included workflow publishes the `docs/` directory.
