import { ErrorBoundary } from "@webassembly-ide/ui";
import { IDEProvider, AppContent } from "@webassembly-ide/web";

/**
 * Desktop App component — full IDE shell with Tauri backend integration.
 *
 * Uses the same IDEProvider and AppContent as the web app.
 * The Tauri file-system adapter is selected automatically at runtime
 * when the Tauri runtime is detected.
 */
export function App() {
  return (
    <ErrorBoundary>
      <IDEProvider>
        <AppContent />
      </IDEProvider>
    </ErrorBoundary>
  );
}
