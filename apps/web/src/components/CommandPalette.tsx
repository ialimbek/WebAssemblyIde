/**
 * CommandPalette — quick access command launcher (Ctrl+Shift+P / Ctrl+P).
 * Supports command execution, file quick-open, and fuzzy matching.
 */

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useDeferredValue,
} from "react";
import { useWasmComponentRuntime } from "../hooks/useWasmComponentRuntime.js";

interface CommandItem {
  id: string;
  label: string;
  category?: string;
  shortcut?: string;
  action: () => void;
  icon?: string;
}

interface CommandPaletteProps {
  commands: CommandItem[];
  recentFiles?: string[];
  onOpenFile?: (path: string) => void;
  onClose: () => void;
}

export function CommandPalette({
  commands,
  recentFiles = [],
  onOpenFile,
  onClose,
}: CommandPaletteProps) {
  const wasm = useWasmComponentRuntime();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<"commands" | "files">("commands");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Detect mode from query prefix
  useEffect(() => {
    if (query.startsWith(">")) {
      setMode("commands");
    } else if (query.startsWith(":")) {
      setMode("files");
    } else {
      setMode(recentFiles.length > 0 ? "files" : "commands");
    }
  }, [query, recentFiles.length]);

  const normalizedQuery =
    query.startsWith(">") || query.startsWith(":")
      ? query.slice(1).trim()
      : query.trim();
  const deferredQuery = useDeferredValue(normalizedQuery);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!deferredQuery) return commands;
    const candidates = commands.map(
      (cmd) => `${cmd.label} ${cmd.id} ${cmd.category ?? ""}`,
    );
    return wasm
      .scoreItemsByQuery(candidates, deferredQuery, 200)
      .map((item) => commands[item.index])
      .filter((cmd): cmd is CommandItem => Boolean(cmd));
  }, [commands, deferredQuery, wasm]);

  // Filter files
  const filteredFiles = useMemo(() => {
    const list = recentFiles;
    if (!deferredQuery) return list;
    return wasm
      .scoreItemsByQuery(list, deferredQuery, 300)
      .map((item) => list[item.index])
      .filter((filePath): filePath is string => Boolean(filePath));
  }, [recentFiles, deferredQuery, wasm]);

  const items = mode === "commands" ? filteredCommands : filteredFiles;
  const maxIndex = items.length - 1;

  // Reset selection on filter change
  useEffect(() => {
    setSelectedIndex(0);
  }, [normalizedQuery, mode]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, maxIndex));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (mode === "commands" && filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          } else if (mode === "files" && filteredFiles[selectedIndex]) {
            onOpenFile?.(filteredFiles[selectedIndex]);
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Tab":
          e.preventDefault();
          // Switch mode
          setMode((m) => (m === "commands" ? "files" : "commands"));
          break;
      }
    },
    [
      maxIndex,
      mode,
      filteredCommands,
      filteredFiles,
      selectedIndex,
      onClose,
      onOpenFile,
    ],
  );

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`,
    );
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        paddingTop: "15vh",
        background: "rgba(0,0,0,0.4)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 600,
          maxWidth: "90vw",
          background: "var(--dropdown-background, #252526)",
          border: "1px solid rgba(128,128,128,0.3)",
          borderRadius: 6,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "60vh",
          overflow: "hidden",
        }}
      >
        {/* Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 12px",
            borderBottom: "1px solid rgba(128,128,128,0.2)",
          }}
        >
          <span style={{ opacity: 0.5, marginRight: 8, fontSize: 14 }}>
            {mode === "commands" ? ">" : ":"}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "commands"
                ? "Type a command..."
                : "Search files by name..."
            }
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "var(--input-foreground, #cccccc)",
              fontSize: 14,
              outline: "none",
            }}
          />
          <span style={{ fontSize: 11, opacity: 0.4, marginLeft: 8 }}>
            Tab to switch
          </span>
        </div>

        {/* Mode tabs */}
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid rgba(128,128,128,0.15)",
            fontSize: 12,
          }}
        >
          <button
            onClick={() => setMode("commands")}
            style={{
              flex: 1,
              padding: "4px 8px",
              background:
                mode === "commands" ? "rgba(128,128,128,0.15)" : "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              opacity: mode === "commands" ? 1 : 0.5,
              borderBottom:
                mode === "commands"
                  ? "2px solid #007acc"
                  : "2px solid transparent",
            }}
          >
            Commands
          </button>
          <button
            onClick={() => setMode("files")}
            style={{
              flex: 1,
              padding: "4px 8px",
              background:
                mode === "files" ? "rgba(128,128,128,0.15)" : "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              opacity: mode === "files" ? 1 : 0.5,
              borderBottom:
                mode === "files"
                  ? "2px solid #007acc"
                  : "2px solid transparent",
            }}
          >
            Files
          </button>
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflow: "auto",
            padding: "4px 0",
          }}
        >
          {mode === "commands" &&
            filteredCommands.map((cmd, idx) => (
              <CommandItemRow
                key={cmd.id}
                command={cmd}
                index={idx}
                selected={idx === selectedIndex}
                onSelect={() => {
                  cmd.action();
                  onClose();
                }}
                onHover={() => setSelectedIndex(idx)}
              />
            ))}
          {mode === "files" &&
            filteredFiles.map((filePath, idx) => (
              <FileItemRow
                key={filePath}
                filePath={filePath}
                index={idx}
                selected={idx === selectedIndex}
                onSelect={() => {
                  onOpenFile?.(filePath);
                  onClose();
                }}
                onHover={() => setSelectedIndex(idx)}
              />
            ))}

          {items.length === 0 && (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                opacity: 0.5,
                fontSize: 13,
              }}
            >
              No results found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommandItemRow({
  command,
  index,
  selected,
  onSelect,
  onHover,
}: {
  command: CommandItem;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <div
      data-index={index}
      onClick={onSelect}
      onMouseEnter={onHover}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 16px",
        cursor: "pointer",
        background: selected
          ? "var(--list-activeSelectionBackground, #094771)"
          : "transparent",
        fontSize: 13,
      }}
    >
      {command.icon && (
        <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>
          {command.icon}
        </span>
      )}
      <span style={{ flex: 1 }}>{command.label}</span>
      {command.category && (
        <span style={{ opacity: 0.4, fontSize: 11 }}>{command.category}</span>
      )}
      {command.shortcut && (
        <kbd
          style={{
            fontSize: 11,
            opacity: 0.5,
            background: "rgba(128,128,128,0.15)",
            padding: "1px 4px",
            borderRadius: 3,
          }}
        >
          {command.shortcut}
        </kbd>
      )}
    </div>
  );
}

function FileItemRow({
  filePath,
  index,
  selected,
  onSelect,
  onHover,
}: {
  filePath: string;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
  const dirPath = filePath.slice(0, filePath.length - fileName.length);

  return (
    <div
      data-index={index}
      onClick={onSelect}
      onMouseEnter={onHover}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 16px",
        cursor: "pointer",
        background: selected
          ? "var(--list-activeSelectionBackground, #094771)"
          : "transparent",
        fontSize: 13,
      }}
    >
      <span
        style={{ fontSize: 14, width: 20, textAlign: "center", opacity: 0.6 }}
      >
        📄
      </span>
      <span style={{ flex: 1 }}>{fileName}</span>
      <span
        style={{
          opacity: 0.4,
          fontSize: 11,
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {dirPath}
      </span>
    </div>
  );
}
