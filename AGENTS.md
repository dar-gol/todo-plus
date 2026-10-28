# Instrukcje dla Codexa

- Todo Plus to instalowalna PWA współdzieląca konto i rodzinę z Kitchen Plus.
- API i OpenAPI z `../kitchen-plus-api` są źródłem prawdy. Nie kopiuj DTO ręcznie.
- UI projektuj mobile-first, spokojnie i czytelnie, z dużymi celami dotykowymi.
- Użytkownik zawsze porusza się między dwiema listami: `Moja lista` i `Rodzina`.
- Powiadomienia push są częścią MVP, nie opcjonalnym późniejszym rozszerzeniem.
- Dokumentację zapisuj po polsku, a kod i identyfikatory po angielsku.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
