/**
 * EditorPanel — tab bar + Monaco editor component.
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { useIDE } from "../ide-context.js";
import type { EditorTab } from "@webassembly-ide/editor";

// Lazy-load Monaco wrapper for performance
const MonacoWrapper = lazy(() =>
  import("@webassembly-ide/editor").then((m) => ({ default: m.MonacoWrapper })),
);

export function EditorPanel() {
  const { editor } = useIDE();
  const [tabs, setTabs] = useState<readonly EditorTab[]>([]);
  const [activeUri, setActiveUri] = useState<string | null>(null);

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
        <div
          style={{
            display: "flex",
            backgroundColor: "#1e1e1e",
            borderBottom: "1px solid #2d2d2d",
            minHeight: 35,
            overflow: "auto",
          }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.uri}
              onClick={() => editor.activateTab(tab.uri)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "13px",
                color: tab.isActive ? "#ffffff" : "#969696",
                backgroundColor: tab.isActive ? "#1e1e1e" : "#2d2d2d",
                borderRight: "1px solid #2d2d2d",
                whiteSpace: "nowrap",
                minWidth: 0,
                position: "relative",
              }}
            >
              {tab.isDirty && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#e8a838",
                    marginRight: 6,
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {tab.title}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  editor.closeTab(tab.uri);
                }}
                style={{
                  marginLeft: 8,
                  fontSize: "11px",
                  color: "#969696",
                  cursor: "pointer",
                  padding: "0 2px",
                  borderRadius: 3,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent";
                }}
              >
                ✕
              </span>
            </div>
          ))}
        </div>
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
            <MonacoWrapper editorManager={editor} />
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
