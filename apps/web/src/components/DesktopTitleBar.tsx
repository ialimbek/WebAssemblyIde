/**
 * DesktopTitleBar — wires the shared TitleBar to Tauri window controls.
 *
 * Imports `@tauri-apps/api/window` lazily so this module can be tree-shaken
 * out of the browser build (and so it works as a no-op when accidentally
 * rendered outside Tauri).
 */

import { useCallback, useEffect, useState } from "react";
import { TitleBar, type TitleBarProps } from "@webassembly-ide/ui";
import { isTauriRuntime } from "../platform/file-system-adapter.js";

export type DesktopTitleBarProps = Omit<TitleBarProps, "controls">;

export function DesktopTitleBar(props: DesktopTitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const tauri = isTauriRuntime();

  useEffect(() => {
    if (!tauri) return;
    let cancelled = false;
    let unlisten: (() => void) | null = null;

    void import("@tauri-apps/api/window").then(async ({ getCurrentWindow }) => {
      if (cancelled) return;
      const win = getCurrentWindow();
      try {
        setIsMaximized(await win.isMaximized());
      } catch {
        /* ignore */
      }
      try {
        const dispose = await win.onResized(async () => {
          try {
            setIsMaximized(await win.isMaximized());
          } catch {
            /* ignore */
          }
        });
        if (cancelled) {
          dispose();
        } else {
          unlisten = dispose;
        }
      } catch {
        /* ignore */
      }
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [tauri]);

  const withWindow = useCallback(
    (action: (win: import("@tauri-apps/api/window").Window) => Promise<void>) => {
      if (!tauri) return;
      void import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        void action(getCurrentWindow()).catch(() => {
          /* swallow — window already gone */
        });
      });
    },
    [tauri],
  );

  return (
    <TitleBar
      {...props}
      showWindowControls={tauri && (props.showWindowControls ?? true)}
      controls={{
        isMaximized,
        minimize: () => withWindow((win) => win.minimize()),
        toggleMaximize: () =>
          withWindow(async (win) => {
            if (await win.isMaximized()) {
              await win.unmaximize();
            } else {
              await win.maximize();
            }
          }),
        close: () => withWindow((win) => win.close()),
      }}
    />
  );
}
