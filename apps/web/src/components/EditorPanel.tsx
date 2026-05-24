/**
 * EditorPanel — tab bar + Monaco editor component.
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { useIDE } from "../ide-context.js";
import type { EditorTab } from "@webassembly-ide/editor";
import { TabBar } from "@webassembly-ide/ui";

// Lazy-load Monaco wrapper for performance
const MonacoWrapper = lazy(() =>
  import("@webassembly-ide/editor").then((m) => ({ default: m.MonacoWrapper })),
);

/**
 * Map a file extension to a tab accent colour. Mirrors common VS Code style
 * colour cues so the user can visually distinguish file types at a glance.
 */
function colorForUri(uri: string): string | undefined {
  const ext = uri.split(/[/\\]/).pop()?.split(".").pop()?.toLowerCase();
  if (!ext) return undefined;
  switch (ext) {
    case "ts":
    case "tsx":
      return "#3178c6";
    case "js":
    case "jsx":
      return "#f0db4f";
    case "rs":
      return "#dea584";
    case "py":
      return "#3572a5";
    case "go":
      return "#00add8";
    case "json":
      return "#cbcb41";
    case "md":
    case "mdx":
      return "#6c6c6c";
    case "css":
    case "scss":
      return "#264de4";
    case "html":
      return "#e34c26";
    case "yml":
    case "yaml":
      return "#cb171e";
    case "toml":
      return "#9c4221";
    case "wasm":
      return "#654ff0";
    case "sh":
    case "bash":
      return "#4eaa25";
    default:
      return undefined;
  }
}

export function EditorPanel() {
  const { editor } = useIDE();
  const [tabs, setTabs] = useState<readonly EditorTab[]>(() => [
    ...editor.getTabs(),
  ]);
  const [activeUri, setActiveUri] = useState<string | null>(() =>
    editor.getActiveUri(),
  );
  const [splitDirection, setSplitDirection] = useState<
    "horizontal" | "vertical" | null
  >(null);

  useEffect(() => {
    const tabDisposable = editor.onTabsChanged((newTabs) => {
      setTabs([...newTabs]);
      setActiveUri(newTabs.find((tab) => tab.isActive)?.uri ?? editor.getActiveUri());
    });
    const activeDisposable = editor.onActiveTabChanged((uri) => {
      setActiveUri(uri);
    });

    return () => {
      tabDisposable.dispose();
      activeDisposable.dispose();
    };
  }, [editor]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tab Bar */}
      {tabs.length > 0 && (
        <TabBar
          tabs={tabs.map((tab) => ({
            id: tab.uri,
            title: tab.title,
            isActive: tab.isActive,
            isDirty: tab.isDirty,
            isPinned: tab.isPinned,
            color: colorForUri(tab.uri),
          }))}
          onActivate={(uri) => {
            setActiveUri(uri);
            editor.activateTab(uri);
          }}
          onClose={(uri) => editor.closeTab(uri)}
          onReorder={(fromIndex, toIndex) =>
            editor.reorderTab(fromIndex, toIndex)
          }
          onSplit={(direction) =>
            setSplitDirection((current) =>
              current === direction ? null : direction,
            )
          }
          onTogglePinned={(uri) => editor.togglePinned(uri)}
        />
      )}

      {/* Editor Area */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {activeUri ? (
          <Suspense
            fallback={
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#666666",
                }}
              >
                Loading editor...
              </div>
            }
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection:
                  splitDirection === "horizontal" ? "column" : "row",
                overflow: "hidden",
              }}
            >
              <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                <MonacoWrapper
                  key={`primary-${activeUri ?? "none"}`}
                  editorManager={editor}
                  activeUri={activeUri}
                />
              </div>
              {splitDirection && (
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    borderLeft:
                      splitDirection === "vertical" ? "1px solid #333333" : 0,
                    borderTop:
                      splitDirection === "horizontal"
                        ? "1px solid #333333"
                        : 0,
                  }}
                >
                  <MonacoWrapper
                    key={`secondary-${activeUri ?? "none"}-${splitDirection}`}
                    editorManager={editor}
                    activeUri={activeUri}
                  />
                </div>
              )}
            </div>
          </Suspense>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#666666",
              fontSize: "14px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "24px",
                  marginBottom: 8,
                  color: "#007acc",
                }}
              >
                WebAssemblyIde
              </div>
              <div>Open a file to start editing</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
