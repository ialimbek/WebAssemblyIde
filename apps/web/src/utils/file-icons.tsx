import type { CSSProperties } from "react";

export type FileIconKind =
  | "folder"
  | "docker"
  | "git"
  | "npm"
  | "rust"
  | "tauri"
  | "react"
  | "typescript"
  | "javascript"
  | "python"
  | "go"
  | "html"
  | "css"
  | "json"
  | "markdown"
  | "config"
  | "env"
  | "image"
  | "shell"
  | "database"
  | "file";

export interface FileIconMeta {
  kind: FileIconKind;
  label: string;
  color: string;
}

export interface FileIconInput {
  name?: string;
  path?: string;
  extension?: string;
  isDirectory?: boolean;
  expanded?: boolean;
}

const icon = (kind: FileIconKind, label: string, color: string): FileIconMeta => ({ kind, label, color });
const basename = (value: string): string => value.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? value;
const extensionOf = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.startsWith(".") && lower.indexOf(".", 1) === -1) return "";
  return lower.includes(".") ? lower.split(".").pop() ?? "" : "";
};

export function getFileIconMeta(input: FileIconInput): FileIconMeta {
  const rawName = input.name ?? (input.path ? basename(input.path) : "");
  const name = rawName.toLowerCase();
  const ext = (input.extension || extensionOf(rawName)).toLowerCase();

  if (input.isDirectory) return icon("folder", input.expanded ? "folder-open" : "folder", "#dcb67a");
  if (name === "dockerfile" || name.endsWith(".dockerfile") || name === ".dockerignore") return icon("docker", "Docker", "#2496ed");
  if ([".gitignore", ".gitattributes", ".gitmodules"].includes(name)) return icon("git", "Git", "#f14e32");
  if (name === "package.json" || ["package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "pnpm-lock.yml", "yarn.lock", "bun.lockb"].includes(name)) return icon("npm", "npm", "#cb3837");
  if (name === "cargo.toml" || name === "cargo.lock" || ext === "rs") return icon("rust", "Rust", "#ce422b");
  if (name === "tauri.conf.json") return icon("tauri", "Tauri", "#24c8db");
  if (name.startsWith("tsconfig") || ext === "ts") return icon("typescript", "TypeScript", "#3178c6");
  if (name.startsWith("vite.config")) return icon("config", "Vite", "#646cff");
  if (name.startsWith("eslint") || name.startsWith(".eslintrc") || name.startsWith("prettier") || name.startsWith(".prettierrc") || name.includes("config") || [".npmrc", ".yarnrc", ".editorconfig", ".browserslistrc"].includes(name)) return icon("config", "Config", "#8b5cf6");
  if (name === "readme.md" || name.startsWith("readme.")) return icon("markdown", "Readme", "#2563eb");
  if (name === "license" || name.startsWith("license.")) return icon("file", "License", "#16a34a");
  if (name.startsWith(".env")) return icon("env", "Env", "#d97706");

  switch (ext) {
    case "tsx":
    case "jsx": return icon("react", "React", "#61dafb");
    case "js":
    case "mjs":
    case "cjs": return icon("javascript", "JavaScript", "#f7df1e");
    case "py": return icon("python", "Python", "#3776ab");
    case "go": return icon("go", "Go", "#00add8");
    case "html": return icon("html", "HTML", "#e34c26");
    case "css":
    case "scss":
    case "sass": return icon("css", "CSS", "#264de4");
    case "json":
    case "jsonc": return icon("json", "JSON", "#f2c94c");
    case "md":
    case "mdx": return icon("markdown", "Markdown", "#6c757d");
    case "toml":
    case "yml":
    case "yaml":
    case "xml": return icon("config", "Config", "#9c4221");
    case "sql":
    case "graphql":
    case "gql": return icon("database", "Database", "#336791");
    case "sh":
    case "bash":
    case "zsh":
    case "ps1": return icon("shell", "Shell", "#4eaa25");
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "svg": return icon("image", "Image", "#8b5cf6");
    default: return icon("file", "File", "#8a8f98");
  }
}

export function FileIconView({ icon, size = 18, style }: { icon: FileIconMeta; size?: number; style?: CSSProperties }) {
  const common = { fill: "none", stroke: icon.color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const textStyle = { fill: icon.color, fontSize: 7, fontWeight: 800, fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace" };

  return (
    <span aria-hidden="true" title={icon.label} style={{ width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", color: icon.color, flexShrink: 0, ...style }}>
      <svg width={size} height={size} viewBox="0 0 24 24" focusable="false">
        {icon.kind === "folder" && <path {...common} fill={`${icon.color}33`} d="M3 7.5h6l1.6 2H21v8.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />}
        {icon.kind === "docker" && <><path {...common} d="M4 14.5h12.5c.8 0 1.5-.5 2-1.2.6.2 1.2.2 1.9 0-.2 1.3-.9 2.5-2 3.4-1.1.9-2.5 1.3-4.1 1.3H8.2C6 18 4.5 16.8 4 14.5Z" /><path {...common} d="M7 13v-2h2v2M10 13v-2h2v2M13 13v-2h2v2M10 10V8h2v2M13 10V8h2v2" /></>}
        {icon.kind === "git" && <><path {...common} d="M7 7a2 2 0 1 0 0 .1M17 7a2 2 0 1 0 0 .1M12 17a2 2 0 1 0 0 .1M7 9v2a3 3 0 0 0 3 3h2M17 9v1a4 4 0 0 1-4 4h-1" /></>}
        {icon.kind === "react" && <><ellipse {...common} cx="12" cy="12" rx="9" ry="3.5" /><ellipse {...common} cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" /><ellipse {...common} cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" /><circle fill={icon.color} cx="12" cy="12" r="1.7" /></>}
        {icon.kind === "npm" && <><rect x="3" y="6" width="18" height="12" rx="1.5" fill={icon.color} /><text x="6" y="15" fill="#fff" fontSize="6.5" fontWeight="900">npm</text></>}
        {icon.kind === "typescript" && <><rect x="4" y="4" width="16" height="16" rx="2" fill={`${icon.color}22`} stroke={icon.color} /><text x="7" y="15.5" {...textStyle}>TS</text></>}
        {icon.kind === "javascript" && <><rect x="4" y="4" width="16" height="16" rx="2" fill={`${icon.color}44`} stroke={icon.color} /><text x="7" y="15.5" fill="#27251f" fontSize="7" fontWeight="900">JS</text></>}
        {!["folder", "docker", "git", "react", "npm", "typescript", "javascript"].includes(icon.kind) && <><path {...common} d="M6 3.8h8l4 4V20a1.2 1.2 0 0 1-1.2 1.2H6A1.2 1.2 0 0 1 4.8 20V5A1.2 1.2 0 0 1 6 3.8Z" /><path {...common} d="M14 4v4h4" />{icon.kind !== "file" && <text x="7" y="16" {...textStyle}>{icon.kind.slice(0, 2).toUpperCase()}</text>}</>}
      </svg>
    </span>
  );
}
