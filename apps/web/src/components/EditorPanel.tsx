/**
 * EditorPanel — tab bar + Monaco editor component.
 */

import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { useIDE } from "../ide-context.js";
import type { EditorTab } from "@webassembly-ide/editor";
import { TabBar } from "@webassembly-ide/ui";
import { MarkdownPreview } from "./MarkdownPreview.js";
import { getDiffData } from "./CorePanels.js";
import { FileIconView, getFileIconMeta } from "../utils/file-icons.js";

const MonacoWrapper = lazy(() =>
  import("@webassembly-ide/editor").then((m) => ({ default: m.MonacoWrapper })),
);
const DiffEditor = lazy(() =>
  import("@webassembly-ide/editor").then((m) => ({ default: m.DiffEditor })),
);

const isPreviewUri = (uri: string | null) => uri?.startsWith("preview:");
const isDiffUri = (uri: string | null) => uri?.startsWith("diff:");
const isWelcomeUri = (uri: string | null) => uri === "welcome:";

function langForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return (
    { ts:"typescript", tsx:"typescript", js:"javascript", jsx:"javascript", rs:"rust", py:"python", go:"go", json:"json", css:"css", html:"html", yml:"yaml", yaml:"yaml", toml:"toml", sh:"shell", md:"markdown" }[ext]
  ) || "plaintext";
}

function DiffPanel({ uri }: { uri: string }) {
  const { theme } = useIDE();
  const realPath = uri.replace("diff:", "");
  const diffData = getDiffData(realPath);
  if (!diffData) {
    return <div style={{ padding: 24, color: "var(--descriptionForeground, #666)", textAlign: "center" }}>Diff data not available.</div>;
  }
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Suspense fallback={<div style={{ padding: 24, color: "var(--descriptionForeground, #666)", textAlign: "center" }}>Loading diff editor...</div>}>
        <DiffEditor original={diffData.original} modified={diffData.modified} language={langForPath(realPath)} inline={false} themeManager={theme} uri={realPath} />
      </Suspense>
    </div>
  );
}

function WelcomeScreenPanel() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100%", padding: 24, color: "var(--editor-foreground, #cccccc)", background: "var(--editor-background, linear-gradient(135deg, #1e1e1e 0%, #252526 100%))" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 8, color: "var(--focusBorder, #007acc)" }}>Welcome</div>
        <div style={{ fontSize: 14, color: "var(--descriptionForeground, #666666)" }}>Choose a file or action to get started</div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 9999, display: "flex",
  alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)",
};
const dialogBoxStyle: React.CSSProperties = {
  background: "var(--panel-background, var(--editorWidget-background, #252526))", border: "1px solid var(--sideBar-border, #454545)", borderRadius: 8,
  padding: 32, minWidth: 320, color: "var(--editor-foreground, #cccccc)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
};
const primaryBtnStyle: React.CSSProperties = {
  padding: "6px 24px", background: "var(--button-background, #0e639c)", border: "none",
  color: "var(--button-foreground, #fff)", borderRadius: 4, cursor: "pointer", fontSize: 13,
};
const secondaryBtnStyle: React.CSSProperties = {
  padding: "6px 16px", background: "transparent", border: "1px solid var(--sideBar-border, #555555)",
  color: "var(--editor-foreground, #cccccc)", borderRadius: 4, cursor: "pointer", fontSize: 13,
};

export function EditorPanel() {
  const { editor, workspace, theme } = useIDE();
  const [tabs, setTabs] = useState<readonly EditorTab[]>(() => [...editor.getTabs()]);
  const [activeUri, setActiveUri] = useState<string | null>(() => editor.getActiveUri());
  const [splitDirection, setSplitDirection] = useState<"horizontal" | "vertical" | null>(null);
  const [dirtyCloseUri, setDirtyCloseUri] = useState<string | null>(null);
  const [dirtyCloseTitle, setDirtyCloseTitle] = useState("");

  useEffect(() => {
    const tabDisposable = editor.onTabsChanged((newTabs) => {
      setTabs([...newTabs]);
      setActiveUri(newTabs.find((tab) => tab.isActive)?.uri ?? editor.getActiveUri());
    });
    const activeDisposable = editor.onActiveTabChanged((uri) => { setActiveUri(uri); });
    return () => { tabDisposable.dispose(); activeDisposable.dispose(); };
  }, [editor]);

  const handleTabClose = useCallback((uri: string) => {
    const tab = tabs.find(t => t.uri === uri);
    if (tab?.isDirty) {
      setDirtyCloseUri(uri);
      setDirtyCloseTitle(tab.title);
    } else {
      editor.closeTab(uri);
    }
  }, [editor, tabs]);

  const handleSaveAndClose = useCallback(async () => {
    if (!dirtyCloseUri) return;
    try {
      const content = editor.models.getContent(dirtyCloseUri);
      if (content !== undefined) {
        await workspace.writeFile(dirtyCloseUri, { content, createDirs: true });
        editor.markSaved(dirtyCloseUri);
      }
    } catch { /* Continue even if save fails */ }
    editor.closeTab(dirtyCloseUri);
    setDirtyCloseUri(null);
  }, [dirtyCloseUri, editor, workspace]);

  const handleDontSaveClose = useCallback(() => {
    if (!dirtyCloseUri) return;
    editor.closeTab(dirtyCloseUri);
    setDirtyCloseUri(null);
  }, [dirtyCloseUri, editor]);

  const handleResetOriginalSize = useCallback(() => {
    setSplitDirection(null);
  }, []);

  useEffect(() => {
    const handleOriginalSizeReset = () => {
      setSplitDirection(null);
    };

    window.addEventListener("editor:reset-original-size", handleOriginalSizeReset);
    return () => {
      window.removeEventListener("editor:reset-original-size", handleOriginalSizeReset);
    };
  }, []);

  const renderEditorContent = () => {
    if (!activeUri) return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--descriptionForeground, #666666)", fontSize: "14px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: 8, color: "var(--focusBorder, #007acc)" }}>Codembly</div>
          <div>Open a file to start editing</div>
        </div>
      </div>
    );

    if (isDiffUri(activeUri)) {
      return <DiffPanel uri={activeUri} />;
    }

    if (isWelcomeUri(activeUri)) {
      return (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, overflow: "auto" }}>
            <WelcomeScreenPanel />
          </div>
        </div>
      );
    }

    if (isPreviewUri(activeUri)) {
      return <MarkdownPreview uri={activeUri} />;
    }

    return (
      <Suspense fallback={<div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--descriptionForeground, #666666)" }}>Loading editor...</div>}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: splitDirection === "horizontal" ? "column" : "row", overflow: "hidden" }}>
          <div style={{ flex: 1, minWidth: 0, minHeight: 0, height: "100%" }}>
            <MonacoWrapper key={`primary-${activeUri}`} editorManager={editor} activeUri={activeUri} onResetOriginalSize={handleResetOriginalSize} themeManager={theme} />
          </div>
          {splitDirection && (
            <div style={{ flex: 1, minWidth: 0, minHeight: 0, height: "100%", borderLeft: splitDirection === "vertical" ? "1px solid var(--sideBar-border, #333333)" : 0, borderTop: splitDirection === "horizontal" ? "1px solid var(--sideBar-border, #333333)" : 0 }}>
              <MonacoWrapper key={`secondary-${activeUri}-${splitDirection}`} editorManager={editor} activeUri={activeUri} onResetOriginalSize={handleResetOriginalSize} themeManager={theme} />
            </div>
          )}
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
            .monaco-editor .minimap {
              height: 100% !important;
              max-height: none !important;
              position: absolute !important;
              top: 0 !important;
              bottom: 0 !important;
              right: 0 !important;
              width: 120px !important;
              min-width: 120px !important;
              max-width: 120px !important;
              box-shadow: 0 12px 40px rgba(0,0,0,0.34) !important;
            }
            .monaco-editor .minimap-widgets {
              height: 100% !important;
              position: absolute !important;
              top: 0 !important;
              bottom: 0 !important;
              right: 0 !important;
              width: 120px !important;
            }
          `
        }} />
      </Suspense>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {tabs.length > 0 && (
        <TabBar
          tabs={tabs.map((tab) => {
            const icon = getFileIconMeta({ path: tab.uri, name: tab.title });
            return {
              id: tab.uri,
              title: tab.title,
              isActive: tab.isActive,
              isDirty: tab.isDirty,
              isPinned: tab.isPinned,
              color: icon.color,
              icon: <FileIconView icon={icon} size={17} />,
            };
          })}
          onActivate={(uri) => { setActiveUri(uri); editor.activateTab(uri); }}
          onClose={handleTabClose}
          onReorder={(fromIndex, toIndex) => editor.reorderTab(fromIndex, toIndex)}
          onSplit={(direction) => setSplitDirection((current) => current === direction ? null : direction)}
          onTogglePinned={(uri) => editor.togglePinned(uri)}
        />
      )}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {renderEditorContent()}
      </div>

      {/* Dirty file close dialog */}
      {dirtyCloseUri && (
        <div role="dialog" aria-label="Unsaved changes" style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) setDirtyCloseUri(null); }}>
          <div style={{ ...dialogBoxStyle, minWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "var(--editor-foreground, #e8e8e8)", textAlign: "center" }}>Unsaved Changes</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--editor-foreground, #cccccc)", lineHeight: 1.5, textAlign: "center" }}>
              Do you want to save changes to <strong style={{ color: "var(--editor-foreground, #e8e8e8)" }}>{dirtyCloseTitle}</strong>?
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => void handleSaveAndClose()} style={primaryBtnStyle}>Save</button>
              <button type="button" onClick={handleDontSaveClose} style={{ ...secondaryBtnStyle, color: "#f44747" }}>Don't Save</button>
              <button type="button" onClick={() => setDirtyCloseUri(null)} style={secondaryBtnStyle}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
