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

export function EditorPanel() {
  const { editor } = useIDE();
  const [tabs, setTabs] = useState<readonly EditorTab[]>([]);
  const [activeUri, setActiveUri] = useState<string | null>(null);
  const [splitDirection, setSplitDirection] = useState<
    "horizontal" | "vertical" | null
  >(null);

  useEffect(() => {
    const tabDisposable = editor.onTabsChanged((newTabs) => {
      setTabs([...newTabs]);
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
          }))}
          onActivate={(uri) => editor.activateTab(uri)}
          onClose={(uri) => editor.closeTab(uri)}
          onReorder={(fromIndex, toIndex) =>
            editor.reorderTab(fromIndex, toIndex)
          }
          onSplit={(direction) => setSplitDirection(direction)}
        />
      )}

      {/* Editor Area */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {activeUri ? (
          <Suspense
            fallback={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#666666",
                }}
              >
                Loading editor...
              </div>
            }
          >
            <div
              style={{
                display: "flex",
                flexDirection:
                  splitDirection === "horizontal" ? "column" : "row",
                height: "100%",
              }}
            >
              <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
                <MonacoWrapper editorManager={editor} />
              </div>
              {splitDirection && (
                <div
                  aria-label="Secondary editor split placeholder"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    borderLeft:
                      splitDirection === "vertical" ? "1px solid #333333" : 0,
                    borderTop:
                      splitDirection === "horizontal" ? "1px solid #333333" : 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#777777",
                  }}
                >
                  Split editor group placeholder
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
