export interface WelcomeScreenProps {
  recentFiles: string[];
  onOpenQuickOpen: () => void;
  onOpenMarketplace: () => void;
}

export function WelcomeScreen({
  recentFiles,
  onOpenQuickOpen,
  onOpenMarketplace,
}: WelcomeScreenProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "#cccccc",
      }}
    >
      <div style={{ maxWidth: 560, width: "100%", padding: 24 }}>
        <h1 style={{ color: "#4da3ff" }}>WebAssemblyIde</h1>
        <p>
          AI-native IDE shell with Monaco, Tauri, Agent Runtime and Wasm
          services.
        </p>
        <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
          <button type="button" onClick={onOpenQuickOpen}>
            Quick Open
          </button>
          <button type="button" onClick={onOpenMarketplace}>
            Extensions
          </button>
        </div>
        <h2 style={{ fontSize: 14 }}>Recent files</h2>
        <ul>
          {recentFiles.slice(0, 5).map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
