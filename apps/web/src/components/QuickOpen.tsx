import { CommandPalette } from "./CommandPalette.js";

export interface QuickOpenCommand {
  id: string;
  label: string;
  category?: string;
  shortcut?: string;
  action: () => void;
  icon?: string;
}

export interface QuickOpenProps {
  recentFiles: string[];
  commands?: QuickOpenCommand[];
  onOpenFile: (path: string) => void;
  onClose: () => void;
}

export function QuickOpen({
  recentFiles,
  commands,
  onOpenFile,
  onClose,
}: QuickOpenProps) {
  return (
    <CommandPalette
      commands={commands ?? []}
      recentFiles={recentFiles}
      onOpenFile={onOpenFile}
      onClose={onClose}
    />
  );
}
