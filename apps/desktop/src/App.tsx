import { ErrorBoundary } from "@webassembly-ide/ui";
import { AppShell } from "@webassembly-ide/ui";
import { StatusBar } from "@webassembly-ide/ui";
import { APP_NAME, APP_VERSION } from "@webassembly-ide/shared";

/**
 * Desktop App component — renders the IDE shell layout.
 * Shares the same UI as the web app, but with Tauri backend integration.
 */
export function App() {
  return (
    <ErrorBoundary>
      <AppShell
        sidebar={
          <div style={{ padding: "8px" }}>
            <h3
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#999999",
                marginBottom: "12px",
              }}
            >
              Explorer
            </h3>
            <div style={{ color: "#666666", fontSize: "12px" }}>
              Open a workspace to get started
            </div>
          </div>
        }
        editor={
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
                  marginBottom: "8px",
                  color: "#007acc",
                }}
              >
                {APP_NAME} Desktop
              </div>
              <div>Open a file to start editing</div>
            </div>
          </div>
        }
        bottomPanel={
          <div style={{ padding: "8px", color: "#666666", fontSize: "12px" }}>
            Terminal / Problems / Output
          </div>
        }
        statusBar={
          <StatusBar
            left={
              <span>
                {APP_NAME} Desktop v{APP_VERSION}
              </span>
            }
            right={<span>Ready</span>}
          />
        }
      />
    </ErrorBoundary>
  );
}
