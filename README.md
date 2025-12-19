# hyperkube.dev

Personal site built as a static HTML/CSS/JS project. No build tooling or framework required. The repo contains the landing page, blog shell, and supporting JavaScript for the terminal-style assistant.

## Tech stack
- HTML5 + custom CSS (no preprocessors)
- Vanilla JavaScript (`js/llm.js`, `js/terminal.js`)
- Google Fonts (Fira Code, Inter)

## Project structure
- `index.html` — main landing page with the terminal experience
- `blog.html`, `post.html`, `projects-blog.html` — static content shells
- `js/llm.js` — lightweight assistant logic (weather helper, small chat)
- `js/terminal.js` — terminal UI behavior and animations
- `content/`, `games/` — supporting assets/content
- `games/zork/` — bundled Z-Machine interpreter (`jszm.js`) plus the Zork I story file (`zork1.z3`)

## Terminal extras
- **Games:** The `games/zork` bundle is wired into the terminal commands (`games`, `zork`, `quit`). It runs Zork I locally in the browser using the Z-Machine interpreter; no network calls are required for gameplay.
- **LLM helper:** `js/llm.js` powers the inline assistant. User input is sent client-side to `https://text.pollinations.ai` with a short chat history; responses are streamed back into the terminal. Weather queries are detected and proxied to `wttr.in`.

## Reuse note
This repo is a personal build, not a turnkey template or theme. Feel free to borrow ideas, but it was never intended for straight cloning/deploying, and I don’t offer support for that.

## License
MIT License — see [LICENSE](LICENSE) for the full text.
