/**
 * Keybinding Manager — handles keyboard shortcuts registration,
 * conflict detection, and VS Code-compatible keybinding format.
 */

export interface Keybinding {
  key: string;
  command: string;
  when?: string;
  args?: unknown;
}

export interface KeybindingRule {
  id: string;
  keybinding: Keybinding;
  source: "default" | "user" | "extension";
  priority: number;
}

export type KeybindingHandler = (args?: unknown) => void;

export class KeybindingManager {
  private rules: Map<string, KeybindingRule[]> = new Map();
  private handlers: Map<string, KeybindingHandler> = new Map();
  private whenContext: Map<string, boolean> = new Map();
  private enabled = true;
  private globalListener: ((e: KeyboardEvent) => void) | null = null;

  registerKeybinding(rule: KeybindingRule): void {
    const key = rule.keybinding.key.toLowerCase();
    const existing = this.rules.get(key) ?? [];
    existing.push(rule);
    existing.sort((a, b) => b.priority - a.priority);
    this.rules.set(key, existing);
  }

  registerCommand(commandId: string, handler: KeybindingHandler): void {
    this.handlers.set(commandId, handler);
  }

  unregisterKeybinding(key: string, commandId: string): void {
    const normalizedKey = key.toLowerCase();
    const existing = this.rules.get(normalizedKey);
    if (!existing) return;
    const filtered = existing.filter((r) => r.keybinding.command !== commandId);
    if (filtered.length > 0) {
      this.rules.set(normalizedKey, filtered);
    } else {
      this.rules.delete(normalizedKey);
    }
  }

  setWhenContext(key: string, value: boolean): void {
    this.whenContext.set(key, value);
  }

  evaluateWhen(when?: string): boolean {
    if (!when) return true;
    // Simple when clause evaluation — supports && and || and ! prefix
    const orParts = when.split("||");
    for (const orPart of orParts) {
      const andParts = orPart.split("&&");
      let andResult = true;
      for (const andPart of andParts) {
        const trimmed = andPart.trim();
        const negated = trimmed.startsWith("!");
        const contextKey = negated ? trimmed.slice(1) : trimmed;
        const value = this.whenContext.get(contextKey) ?? false;
        if (negated ? value : !value) {
          andResult = false;
          break;
        }
      }
      if (andResult) return true;
    }
    return false;
  }

  /** Process a keyboard event and dispatch matching command. Returns true if handled. */
  handleKeyboardEvent(event: KeyboardEvent): boolean {
    if (!this.enabled) return false;

    const key = eventKeyToKeybindingString(event);
    const rules = this.rules.get(key.toLowerCase());
    if (!rules) return false;

    for (const rule of rules) {
      if (this.evaluateWhen(rule.keybinding.when)) {
        const handler = this.handlers.get(rule.keybinding.command);
        if (handler) {
          event.preventDefault();
          event.stopPropagation();
          handler(rule.keybinding.args);
          return true;
        }
      }
    }
    return false;
  }

  /** Attach global keyboard listener to a DOM element. */
  attachToGlobal(element: HTMLElement | Window): void {
    this.detachFromGlobal();
    this.globalListener = (e: KeyboardEvent) => {
      this.handleKeyboardEvent(e);
    };
    element.addEventListener("keydown", this.globalListener as EventListener);
  }

  detachFromGlobal(): void {
    if (this.globalListener) {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "keydown",
          this.globalListener as EventListener,
        );
      }
      this.globalListener = null;
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getKeybindingForCommand(commandId: string): Keybinding | undefined {
    for (const rules of this.rules.values()) {
      for (const rule of rules) {
        if (rule.keybinding.command === commandId) return rule.keybinding;
      }
    }
    return undefined;
  }

  getAllKeybindings(): KeybindingRule[] {
    const all: KeybindingRule[] = [];
    for (const rules of this.rules.values()) {
      all.push(...rules);
    }
    return all;
  }

  /** Register default IDE keybindings. */
  registerDefaults(): void {
    const defaults: KeybindingRule[] = [
      {
        id: "default.commandPalette",
        keybinding: {
          key: "ctrl+shift+p",
          command: "workbench.action.showCommands",
        },
        source: "default",
        priority: 100,
      },
      {
        id: "default.quickOpen",
        keybinding: { key: "ctrl+p", command: "workbench.action.quickOpen" },
        source: "default",
        priority: 100,
      },
      {
        id: "default.save",
        keybinding: { key: "ctrl+s", command: "workbench.action.files.save" },
        source: "default",
        priority: 100,
      },
      {
        id: "default.saveAll",
        keybinding: {
          key: "ctrl+shift+s",
          command: "workbench.action.files.saveAll",
        },
        source: "default",
        priority: 100,
      },
      {
        id: "default.closeTab",
        keybinding: {
          key: "ctrl+w",
          command: "workbench.action.closeActiveEditor",
        },
        source: "default",
        priority: 100,
      },
      {
        id: "default.toggleTerminal",
        keybinding: {
          key: "ctrl+`",
          command: "workbench.action.terminal.toggleTerminal",
        },
        source: "default",
        priority: 100,
      },
      {
        id: "default.goToLine",
        keybinding: { key: "ctrl+g", command: "editor.action.gotoLine" },
        source: "default",
        priority: 100,
      },
      {
        id: "default.goToSymbol",
        keybinding: {
          key: "ctrl+shift+o",
          command: "editor.action.gotoSymbol",
        },
        source: "default",
        priority: 100,
      },
      {
        id: "default.find",
        keybinding: { key: "ctrl+f", command: "actions.find" },
        source: "default",
        priority: 100,
      },
      {
        id: "default.replace",
        keybinding: {
          key: "ctrl+h",
          command: "editor.action.startFindReplaceAction",
        },
        source: "default",
        priority: 100,
      },
      {
        id: "default.undo",
        keybinding: { key: "ctrl+z", command: "undo" },
        source: "default",
        priority: 100,
      },
      {
        id: "default.redo",
        keybinding: { key: "ctrl+shift+z", command: "redo" },
        source: "default",
        priority: 100,
      },
      {
        id: "default.newFile",
        keybinding: {
          key: "ctrl+n",
          command: "workbench.action.files.newUntitledFile",
        },
        source: "default",
        priority: 100,
      },
      {
        id: "default.openFile",
        keybinding: {
          key: "ctrl+o",
          command: "workbench.action.files.openFile",
        },
        source: "default",
        priority: 100,
      },
    ];
    for (const rule of defaults) {
      this.registerKeybinding(rule);
    }
  }
}

/** Convert a KeyboardEvent to a keybinding string like "ctrl+shift+p". */
function eventKeyToKeybindingString(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("ctrl");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  if (event.metaKey) parts.push("meta");

  let key = event.key.toLowerCase();
  if (key === " ") key = "space";
  parts.push(key);
  return parts.join("+");
}
