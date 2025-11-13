# Contributor Notes

- Use `bun install` to manage dependencies and `bun run <script>` to execute project scripts.
- Run `bun run test` to execute the Vitest suite (configured with Testing Library) before shipping changes to hooks or React components.
- UI work relies on Radix primitives; prefer Testing Library queries that match accessible roles and names.
- Formatting and linting are handled by Biome (`bun run format` / `bun run lint`).
