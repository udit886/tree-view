# 🌲 Tree View – Task 4 (Infollion Intern Assessment)

A visual hierarchical tree renderer built with **React + React Flow**.

## Features

| Feature | Status |
|---|---|
| Tree layout — parent centered above children | ✅ |
| No node overlap, calculated spacing | ✅ |
| Edges connecting parent → child | ✅ |
| Expand / Collapse subtrees | ✅ |
| Auto re-layout on collapse/expand | ✅ |
| **Bonus:** Hover highlighting | ✅ |
| **Bonus:** Click-to-select + node metadata panel | ✅ |
| **Bonus:** Search + highlight matching nodes | ✅ |
| **Bonus:** Auto zoom/pan (fitView) | ✅ |
| **Bonus:** Smooth expand/collapse animations | ✅ |

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

## Usage

| Action | How |
|---|---|
| Expand / Collapse | Click the **+/−** badge below any node |
| Select a node | Click the node body — shows metadata panel |
| Search | Type in the search box (matches highlight amber) |
| Zoom | Scroll wheel or use the Controls panel |
| Pan | Click + drag the canvas |

## Project Structure

```
├── index.html          # HTML entry point
├── package.json        # Dependencies
├── vite.config.js      # Vite + React plugin config
└── src/
    ├── main.jsx        # React entry point
    └── App.jsx         # All tree logic and UI (single file)
```

## Tech Stack

- **React 18** – UI framework
- **React Flow 11** – Graph/tree rendering engine
- **Vite** – Build tool / dev server
