# BiblioConnect

## CodeGraph

Use the local CodeGraph index for structural questions, dependencies, callers,
and component source. Prefer `codegraph_explore` when its MCP tool is available.
This repository is nested inside the workspace: pass this repository's absolute
path as `projectPath` when the MCP server starts from the parent workspace.

For sessions without the MCP tool, run from this repository:

```powershell
rtk proxy codegraph explore --max-files 4 "SymbolName file.jsx"
rtk proxy codegraph status
```

Keep queries focused and bound the number of files. Do not read the same current
source again after CodeGraph returns it. Read files directly when a stale-index
warning identifies them, and use `rtk proxy codegraph sync` if the watcher is not
active after edits. Use `rg` for exact text, styles, or files outside the index.

The `.codegraph/` directory is a generated local index. Do not commit its database.

## Current redesign brief

- Use the original BiblioConnect as the baseline.
- Keep React and migrate frontend styling to Tailwind.
- Follow a contemporary editorial direction and preserve the existing palette.
- Preserve existing user/admin flows, API contracts, Express, Prisma, and PostgreSQL.
- Add purposeful motion and a bounded book-related 3D scene with accessible fallbacks.
- Apply Emil Kowalski's design engineering skill during design refinement.
- Use Uiverse as an additional source of Tailwind components; adapt selected pieces
  to the approved identity and record attribution/license for copied code.
- New features and database changes are outside this initial frontend redesign.
