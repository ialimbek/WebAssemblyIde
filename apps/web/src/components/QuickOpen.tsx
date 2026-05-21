import { CommandPalette } from "./CommandPalette.js";

export interface QuickOpenProps {
  recentFiles: string[];
  onOpenFile: (path: string) => void;
  onClose: () => void;
}

export function QuickOpen({
  recentFiles,
  onOpenFile,
  onClose,
}: QuickOpenProps) {
  return (
    <CommandPalette
      commands={[]}
      recentFiles={recentFiles}
      onOpenFile={onOpenFile}
      onClose={onClose}
    />
  );
}
