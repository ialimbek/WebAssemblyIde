# TS to AssemblyScript Port Attempt Report

Generated: 2026-06-06T09:29:16.220Z
AssemblyScript compiler: node_modules/assemblyscript/bin/asc.js (--target release --noEmit)

## Summary

- Total TS/TSX files attempted: **110**
- PORTED (AS compiler accepted as-is): **1**
- REJECTED (AS compiler refused): **109**
- Port rate: **0.91%**

## By Category

| Category | Ported | Rejected |
|----------|--------|----------|
| Agent subagent | 0 | 10 |
| App module | 0 | 3 |
| Constants | 1 | 3 |
| Library module | 0 | 42 |
| Other | 0 | 1 |
| React component (.tsx) | 0 | 32 |
| Test (vitest) | 0 | 5 |
| Type-only declarations | 0 | 6 |
| Utility | 0 | 5 |
| Vite config | 0 | 2 |

## PORTED files (AssemblyScript compiler accepted)

- `packages/shared/src/constants/app.ts` _(Constants)_

## REJECTED files (with first compiler error)

| File | Category | Reason |
|------|----------|--------|
| `apps/desktop/src/App.tsx` | React component (.tsx) | ERROR TS1110: Type expected. |
| `apps/desktop/src/index.tsx` | React component (.tsx) | ERROR TS1005: '>' expected. |
| `apps/desktop/vite.config.ts` | Vite config | ERROR TS1109: Expression expected. |
| `apps/web/src/App.tsx` | React component (.tsx) | compilation failed |
| `apps/web/src/components/AgentPanel.tsx` | React component (.tsx) | ERROR AS100: Not implemented: Mixed default and named imports |
| `apps/web/src/components/CommandPalette.tsx` | React component (.tsx) | ERROR AS100: Not implemented: Mixed default and named imports |
| `apps/web/src/components/CorePanels.tsx` | React component (.tsx) | ERROR AS100: Not implemented: Mixed default and named imports |
| `apps/web/src/components/EditorPanel.tsx` | React component (.tsx) | ERROR TS1005: 'from' expected. |
| `apps/web/src/components/ExplorerPanel.tsx` | React component (.tsx) | ERROR AS100: Not implemented: Mixed default and named imports |
| `apps/web/src/components/FileContextMenu.tsx` | React component (.tsx) | ERROR AS100: Not implemented: Mixed default and named imports |
| `apps/web/src/components/MarkdownPreview.tsx` | React component (.tsx) | ERROR TS1003: Identifier expected. |
| `apps/web/src/components/Marketplace.tsx` | React component (.tsx) | ERROR TS1005: '}' expected. |
| `apps/web/src/components/NavigationDialogs.tsx` | React component (.tsx) | ERROR AS219: Optional properties are not supported. |
| `apps/web/src/components/NotificationCenter.tsx` | React component (.tsx) | ERROR AS100: Not implemented: Mixed default and named imports |
| `apps/web/src/components/QuickOpen.tsx` | React component (.tsx) | ERROR AS219: Optional properties are not supported. |
| `apps/web/src/components/SearchPanel.tsx` | React component (.tsx) | ERROR AS100: Not implemented: Mixed default and named imports |
| `apps/web/src/components/StartupSplash.tsx` | React component (.tsx) | ERROR TS1003: Identifier expected. |
| `apps/web/src/components/TerminalPanel.tsx` | React component (.tsx) | ERROR AS100: Not implemented: Mixed default and named imports |
| `apps/web/src/components/WelcomeScreen.tsx` | React component (.tsx) | ERROR AS219: Optional properties are not supported. |
| `apps/web/src/ide-context.tsx` | React component (.tsx) | ERROR TS1005: '}' expected. |
| `apps/web/src/index.ts` | App module | ERROR TS6054: File '.agent-journals/researches/wasm-port-scratch/App.js.ts' not found. |
| `apps/web/src/main.tsx` | React component (.tsx) | ERROR TS1005: '>' expected. |
| `apps/web/src/platform/file-system-adapter.ts` | App module | ERROR TS1005: '}' expected. |
| `apps/web/src/services/GitService.ts` | App module | ERROR TS1005: 'from' expected. |
| `apps/web/src/utils/file-icons.tsx` | React component (.tsx) | ERROR TS1005: 'from' expected. |
| `apps/web/vite.config.ts` | Vite config | ERROR TS1109: Expression expected. |
| `packages/accessibility/src/index.ts` | Library module | TS-only type construct |
| `packages/agent-runtime/src/agent-orchestrator.ts` | Library module | ERROR TS1005: '}' expected. |
| `packages/agent-runtime/src/agent-runtime.test.ts` | Test (vitest) | ERROR TS1005: 'from' expected. |
| `packages/agent-runtime/src/agent-session.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/agent-runtime/src/agent-undo-adapter.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/agent-runtime/src/approval-guard.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/agent-runtime/src/audit-log.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/agent-runtime/src/index.ts` | Library module | ERROR TS1109: Expression expected. |
| `packages/agent-runtime/src/subagents/base-subagent.ts` | Agent subagent | ERROR TS1005: 'from' expected. |
| `packages/agent-runtime/src/subagents/executor-subagent.ts` | Agent subagent | ERROR TS1005: '}' expected. |
| `packages/agent-runtime/src/subagents/index.ts` | Agent subagent | ERROR TS1109: Expression expected. |
| `packages/agent-runtime/src/subagents/orchestrator.ts` | Agent subagent | ERROR TS1005: '}' expected. |
| `packages/agent-runtime/src/subagents/planner-subagent.ts` | Agent subagent | ERROR TS1005: '}' expected. |
| `packages/agent-runtime/src/subagents/reader-subagent.ts` | Agent subagent | ERROR TS1005: '}' expected. |
| `packages/agent-runtime/src/subagents/reviewer-subagent.ts` | Agent subagent | ERROR TS1005: '}' expected. |
| `packages/agent-runtime/src/subagents/searcher-subagent.ts` | Agent subagent | ERROR TS1005: '}' expected. |
| `packages/agent-runtime/src/subagents/types.ts` | Agent subagent | TS-only type construct |
| `packages/agent-runtime/src/subagents/writer-subagent.ts` | Agent subagent | ERROR TS1005: '}' expected. |
| `packages/agent-runtime/src/types.ts` | Type-only declarations | TS-only type construct |
| `packages/agent-tools/src/core-tools.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/agent-tools/src/index.ts` | Library module | ERROR TS1109: Expression expected. |
| `packages/agent-tools/src/tool-registry.test.ts` | Test (vitest) | ERROR TS1005: 'from' expected. |
| `packages/agent-tools/src/tool-registry.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/command-bus/src/command-bus.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/command-bus/src/event-bus.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/command-bus/src/index.ts` | Library module | ERROR TS1005: '}' expected. |
| `packages/editor/src/diff-editor.tsx` | React component (.tsx) | ERROR AS100: Not implemented: Mixed default and named imports |
| `packages/editor/src/editor-manager.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/editor/src/editor-model.test.ts` | Test (vitest) | ERROR TS1109: Expression expected. |
| `packages/editor/src/editor-model.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/editor/src/index.ts` | Library module | ERROR TS1109: Expression expected. |
| `packages/editor/src/monaco-languages.ts` | Library module | ERROR TS1005: '{' expected. |
| `packages/editor/src/monaco-theme-adapter.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/editor/src/monaco-wrapper.tsx` | React component (.tsx) | ERROR TS1005: '}' expected. |
| `packages/editor/src/types.ts` | Type-only declarations | TS-only type construct |
| `packages/i18n/src/index.ts` | Library module | ERROR AS219: Optional properties are not supported. |
| `packages/ide-core/src/auto-save.ts` | Library module | ERROR TS1110: Type expected. |
| `packages/ide-core/src/command-policy.ts` | Library module | TS-only type construct |
| `packages/ide-core/src/file-system.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/ide-core/src/index.ts` | Library module | ERROR TS1005: '}' expected. |
| `packages/ide-core/src/keybinding-manager.ts` | Library module | ERROR AS219: Optional properties are not supported. |
| `packages/ide-core/src/layout-manager.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/ide-core/src/marketplace.ts` | Library module | TS-only type construct |
| `packages/ide-core/src/panel-registry.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/ide-core/src/terminal-runtime.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/ide-core/src/theme-manager.ts` | Library module | TS-only type construct |
| `packages/ide-core/src/undo-redo.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/ide-core/src/workspace-manager.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/ide-core/src/workspace-types.ts` | Library module | ERROR AS219: Optional properties are not supported. |
| `packages/notifications/src/index.ts` | Library module | ERROR TS1005: '}' expected. |
| `packages/notifications/src/notification-manager.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/performance-core/src/index.ts` | Library module | ERROR TS1005: '}' expected. |
| `packages/performance-core/src/lazy-module-registry.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/performance-core/src/startup-contracts.test.ts` | Test (vitest) | ERROR TS6054: File '~lib/vitest.ts' not found. |
| `packages/performance-core/src/startup-contracts.ts` | Library module | TS-only type construct |
| `packages/performance-core/src/startup-profiler.ts` | Library module | ERROR AS219: Optional properties are not supported. |
| `packages/settings/src/index.ts` | Library module | ERROR TS1005: '}' expected. |
| `packages/settings/src/settings-manager.ts` | Library module | ERROR TS1005: 'from' expected. |
| `packages/shared/src/constants/commands.ts` | Constants | ERROR AS100: Not implemented: Const assertion |
| `packages/shared/src/constants/events.ts` | Constants | ERROR TS1110: Type expected. |
| `packages/shared/src/constants/permissions.ts` | Constants | ERROR TS1003: Identifier expected. |
| `packages/shared/src/index.ts` | Library module | ERROR TS1109: Expression expected. |
| `packages/shared/src/shared.test.ts` | Test (vitest) | ERROR TS6054: File '~lib/vitest.ts' not found. |
| `packages/shared/src/types/commands.ts` | Type-only declarations | ERROR AS219: Optional properties are not supported. |
| `packages/shared/src/types/common.ts` | Type-only declarations | ERROR TS1110: Type expected. |
| `packages/shared/src/types/events.ts` | Type-only declarations | ERROR TS1110: Type expected. |
| `packages/shared/src/types/result.ts` | Type-only declarations | TS-only type construct |
| `packages/shared/src/utils/assert.ts` | Utility | ERROR TS6054: File '~lib/@webassembly-ide/wasm-shared.ts' not found. |
| `packages/shared/src/utils/id.ts` | Utility | ERROR TS6054: File '~lib/@webassembly-ide/wasm-shared.ts' not found. |
| `packages/shared/src/utils/logger.ts` | Utility | ERROR TS1005: '}' expected. |
| `packages/shared/src/utils/object.ts` | Utility | ERROR TS1003: Identifier expected. |
| `packages/shared/src/utils/timing.ts` | Utility | ERROR TS1003: Identifier expected. |
| `packages/ui/src/common/Button.tsx` | React component (.tsx) | ERROR AS219: Optional properties are not supported. |
| `packages/ui/src/common/ErrorBoundary.tsx` | React component (.tsx) | ERROR AS219: Optional properties are not supported. |
| `packages/ui/src/index.ts` | Library module | ERROR TS1005: '}' expected. |
| `packages/ui/src/layout/AppShell.tsx` | React component (.tsx) | ERROR AS100: Not implemented: Mixed default and named imports |
| `packages/ui/src/layout/BottomPanel.tsx` | React component (.tsx) | ERROR AS219: Optional properties are not supported. |
| `packages/ui/src/layout/MenuBar.tsx` | React component (.tsx) | ERROR AS100: Not implemented: Mixed default and named imports |
| `packages/ui/src/layout/Panel.tsx` | React component (.tsx) | ERROR AS219: Optional properties are not supported. |
| `packages/ui/src/layout/Sidebar.tsx` | React component (.tsx) | ERROR AS219: Optional properties are not supported. |
| `packages/ui/src/layout/StatusBar.tsx` | React component (.tsx) | ERROR AS219: Optional properties are not supported. |
| `packages/ui/src/layout/TabBar.tsx` | React component (.tsx) | ERROR AS100: Not implemented: Mixed default and named imports |
| `vitest.config.ts` | Other | ERROR TS6054: File '~lib/vitest/config.ts' not found. |
