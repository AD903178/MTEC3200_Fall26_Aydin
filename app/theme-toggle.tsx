"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";
type ThemeSnapshot = { theme: Theme; storageError: boolean };

const THEME_STORAGE_KEY = "night-reset-theme";
const defaultSnapshot: ThemeSnapshot = { theme: "light", storageError: false };
let cachedSnapshot = defaultSnapshot;
let hasLoadedTheme = false;
const listeners = new Set<() => void>();

function getThemeSnapshot() {
  if (hasLoadedTheme) {
    return cachedSnapshot;
  }

  hasLoadedTheme = true;
  try {
    const theme = window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
    cachedSnapshot = { theme, storageError: false };
  } catch {
    cachedSnapshot = { theme: "light", storageError: true };
  }

  return cachedSnapshot;
}

function getServerThemeSnapshot() {
  return defaultSnapshot;
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function handleStorageChange(event: StorageEvent) {
  if (event.key !== THEME_STORAGE_KEY && event.key !== null) {
    return;
  }

  const theme = event.newValue === "dark" ? "dark" : "light";
  hasLoadedTheme = true;
  cachedSnapshot = { theme, storageError: false };
  document.documentElement.dataset.theme = theme;
  notifyListeners();
}

function subscribeToTheme(listener: () => void) {
  listeners.add(listener);
  const snapshot = getThemeSnapshot();
  document.documentElement.dataset.theme = snapshot.theme;
  window.addEventListener("storage", handleStorageChange);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorageChange);
  };
}

export default function ThemeToggle() {
  const snapshot = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  function toggleTheme() {
    const nextTheme = snapshot.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = nextTheme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      hasLoadedTheme = true;
      cachedSnapshot = { theme: nextTheme, storageError: false };
    } catch {
      hasLoadedTheme = true;
      cachedSnapshot = { theme: nextTheme, storageError: true };
    }
    notifyListeners();
  }

  return (
    <div className="theme-control">
      <button
        className="theme-toggle"
        type="button"
        aria-label={`Switch to ${snapshot.theme === "light" ? "dark" : "light"} mode`}
        aria-pressed={snapshot.theme === "dark"}
        title={`Switch to ${snapshot.theme === "light" ? "dark" : "light"} mode`}
        onClick={toggleTheme}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {snapshot.theme === "light" ? (
            <path
              d="M20.2 15.1A8.3 8.3 0 0 1 8.9 3.8a8.3 8.3 0 1 0 11.3 11.3Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <>
              <circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.7" />
              <path
                d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
      </button>
      {snapshot.storageError && (
        <span className="theme-status" role="status">
          Theme preference could not be saved in this browser.
        </span>
      )}
    </div>
  );
}
