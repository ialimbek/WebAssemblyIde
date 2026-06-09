import React from "react";
import { createRoot } from "react-dom/client";
import { StartupProfiler } from "@webassembly-ide/performance-core";
import { App } from "./App.js";

export const startupProfiler = new StartupProfiler();
const appShellMetric = startupProfiler.start("startup", "app-shell-first-paint");

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

requestAnimationFrame(() => startupProfiler.end(appShellMetric));
