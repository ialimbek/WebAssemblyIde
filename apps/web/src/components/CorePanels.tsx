export function ProblemsPanel() {
  return (
    <PlaceholderPanel
      title="Problems"
      body="Diagnostics from LSP, lint and build tools will appear here."
    />
  );
}

export function OutputPanel() {
  return (
    <PlaceholderPanel
      title="Output"
      body="Build, lint and task output channels will appear here."
    />
  );
}

export function DebugPanel() {
  return (
    <PlaceholderPanel
      title="Debug"
      body="Breakpoints, call stack, variables and debug sessions will appear here."
    />
  );
}

export function SourceControlPanel() {
  return (
    <PlaceholderPanel
      title="Source Control"
      body="Git status, diffs, commits, branches and stash workflows will appear here."
    />
  );
}

export function SettingsPanel() {
  return (
    <PlaceholderPanel
      title="Settings"
      body="JSON and GUI settings editor placeholder."
    />
  );
}

function PlaceholderPanel({ title, body }: { title: string; body: string }) {
  return (
    <section aria-label={title} style={{ padding: 12, color: "#cccccc" }}>
      <h2 style={{ fontSize: 14, marginTop: 0 }}>{title}</h2>
      <p style={{ fontSize: 12, opacity: 0.75 }}>{body}</p>
    </section>
  );
}
