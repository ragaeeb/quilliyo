# Contributor Notes
- Use `bun install` to manage dependencies and `bun run <script>` to execute project scripts.
- Run `bun run test` to execute the Vitest suite (configured with Testing Library) before shipping changes to hooks or React components. Back-end suites in `src/lib/**` and API route tests in `src/app/api/**` also run under the same command.
- Test files live next to their implementations using the `*.test.ts` / `*.test.tsx` naming pattern (no `__tests__` folders). Follow the existing `describe` + `it('should …')` style for specs.
- UI work relies on Radix primitives; prefer Testing Library queries that match accessible roles and names.
- Formatting and linting are handled by Biome (`bun run format` / `bun run lint`).
- TypeScript path aliases are defined in `tsconfig.json` (`@/` resolves to `src/`).
