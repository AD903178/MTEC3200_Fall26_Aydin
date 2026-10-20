"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import RainAudioControl from "../rain-audio-control";
import ThemeToggle from "../theme-toggle";

type CheckInStatus = "on-time" | "later" | "missed";

type CheckIn = {
  date: string;
  status: CheckInStatus;
  note: string;
};

type CheckInSnapshot = {
  entries: CheckIn[];
  checkInError: string | null;
  bedtimePlan: { bedtime: string; reminder: string } | null;
  planError: string | null;
};

const CHECK_INS_STORAGE_KEY = "night-reset-check-ins";
const CHECK_INS_CHANGE_EVENT = "night-reset:check-ins-change";
const PLAN_STORAGE_KEY = "night-reset-plan";
const PLAN_CHANGE_EVENT = "night-reset:plan-change";
const emptySnapshot: CheckInSnapshot = {
  entries: [],
  checkInError: null,
  bedtimePlan: null,
  planError: null,
};
let cachedSnapshot: CheckInSnapshot | undefined;
let cachedToday: string | undefined;
const listeners = new Set<() => void>();

function isCheckInStatus(value: unknown): value is CheckInStatus {
  return value === "on-time" || value === "later" || value === "missed";
}

function isCheckIn(value: unknown): value is CheckIn {
  if (
    typeof value !== "object" ||
    value === null ||
    !("date" in value) ||
    !("status" in value) ||
    !("note" in value)
  ) {
    return false;
  }

  return (
    typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    isCheckInStatus(value.status) &&
    typeof value.note === "string"
  );
}

function isBedtimePlan(value: unknown): value is { bedtime: string; reminder: string } {
  if (
    typeof value !== "object" ||
    value === null ||
    !("bedtime" in value) ||
    !("reminder" in value)
  ) {
    return false;
  }

  return (
    typeof value.bedtime === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value.bedtime) &&
    typeof value.reminder === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value.reminder)
  );
}

function getCheckInSnapshot(): CheckInSnapshot {
  if (cachedSnapshot) {
    return cachedSnapshot;
  }

  let entries: CheckIn[] = [];
  let checkInError: string | null = null;
  let bedtimePlan: CheckInSnapshot["bedtimePlan"] = null;
  let planError: string | null = null;

  try {
    const storedEntries = window.localStorage.getItem(CHECK_INS_STORAGE_KEY);
    if (storedEntries) {
      const parsedEntries: unknown = JSON.parse(storedEntries);
      if (!Array.isArray(parsedEntries) || !parsedEntries.every(isCheckIn)) {
        checkInError = "Your saved check-ins could not be read. Your history has not been changed.";
      } else {
        entries = parsedEntries;
      }
    }
  } catch {
    checkInError = "Your check-ins could not be loaded from this browser.";
  }

  try {
    const storedPlan = window.localStorage.getItem(PLAN_STORAGE_KEY);
    if (storedPlan) {
      const parsedPlan: unknown = JSON.parse(storedPlan);
      if (isBedtimePlan(parsedPlan)) {
        bedtimePlan = parsedPlan;
      } else {
        planError = "Your bedtime plan could not be read.";
      }
    }
  } catch {
    planError = "Your bedtime plan could not be loaded from this browser.";
  }

  cachedSnapshot = { entries, checkInError, bedtimePlan, planError };
  return cachedSnapshot;
}

function getServerSnapshot() {
  return emptySnapshot;
}

function notifyListeners() {
  cachedSnapshot = undefined;
  for (const listener of listeners) {
    listener();
  }
}

function handleStorageChange(event: StorageEvent) {
  if (event.key === CHECK_INS_STORAGE_KEY || event.key === PLAN_STORAGE_KEY || event.key === null) {
    notifyListeners();
  }
}

function subscribe(listener: () => void) {
  cachedSnapshot = undefined;
  listeners.add(listener);
  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(CHECK_INS_CHANGE_EVENT, notifyListeners);
  window.addEventListener(PLAN_CHANGE_EVENT, notifyListeners);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(CHECK_INS_CHANGE_EVENT, notifyListeners);
    window.removeEventListener(PLAN_CHANGE_EVENT, notifyListeners);
  };
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodaySnapshot() {
  const localToday = getLocalDateKey(new Date());
  if (localToday !== cachedToday) {
    cachedToday = localToday;
  }
  return cachedToday;
}

function getServerTodaySnapshot() {
  return "1970-01-01";
}

function subscribeToToday(listener: () => void) {
  const intervalId = window.setInterval(() => {
    const newToday = getLocalDateKey(new Date());
    if (newToday !== cachedToday) {
      cachedToday = newToday;
      listener();
    }
  }, 60_000);

  return () => window.clearInterval(intervalId);
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

const statusLabels: Record<CheckInStatus, string> = {
  "on-time": "I went to bed on time",
  later: "I went to bed a little later",
  missed: "Tonight didn’t go to plan",
};

export default function CheckInPage() {
  const snapshot = useSyncExternalStore(subscribe, getCheckInSnapshot, getServerSnapshot);
  const today = useSyncExternalStore(
    subscribeToToday,
    getTodaySnapshot,
    getServerTodaySnapshot,
  );
  const todayEntry = snapshot.entries.find((entry) => entry.date === today);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<CheckInStatus | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const recentEntries = [...snapshot.entries]
    .filter((entry) => entry.date !== today)
    .sort((first, second) => second.date.localeCompare(first.date))
    .slice(0, 5);
  const editingEntry = editingDate
    ? snapshot.entries.find((entry) => entry.date === editingDate)
    : null;
  const activeEntry = editingEntry ?? todayEntry;
  const activeDate = editingDate ?? today;
  const currentStatus = selectedStatus ?? activeEntry?.status ?? null;
  const currentNote = note ?? activeEntry?.note ?? "";

  function saveCheckIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedMessage("");
    setSaveError("");

    if (snapshot.checkInError) {
      setSaveError(snapshot.checkInError);
      return;
    }

    if (!currentStatus) {
      setFormError("Choose the option that feels closest to tonight.");
      return;
    }

    setFormError("");
    const updatedEntry: CheckIn = {
      date: activeDate,
      status: currentStatus,
      note: currentNote.trim(),
    };
    const updatedEntries = [
      ...snapshot.entries.filter((entry) => entry.date !== activeDate),
      updatedEntry,
    ].sort((first, second) => second.date.localeCompare(first.date));

    try {
      window.localStorage.setItem(CHECK_INS_STORAGE_KEY, JSON.stringify(updatedEntries));
      window.dispatchEvent(new Event(CHECK_INS_CHANGE_EVENT));
      setEditingDate(null);
      setSelectedStatus(null);
      setNote(null);
      setSavedMessage(
        activeDate === today
          ? "Your check-in is saved on this device."
          : "Your earlier check-in has been updated.",
      );
    } catch {
      setSaveError("Your browser could not save this check-in. Check its storage settings and try again.");
    }
  }

  function deleteCheckIn(date: string) {
    const entryToDelete = snapshot.entries.find((entry) => entry.date === date);
    if (!entryToDelete || snapshot.checkInError) {
      return;
    }

    setSaveError("");
    setSavedMessage("");
    try {
      const remainingEntries = snapshot.entries.filter((entry) => entry.date !== date);
      if (remainingEntries.length === 0) {
        window.localStorage.removeItem(CHECK_INS_STORAGE_KEY);
      } else {
        window.localStorage.setItem(CHECK_INS_STORAGE_KEY, JSON.stringify(remainingEntries));
      }
      window.dispatchEvent(new Event(CHECK_INS_CHANGE_EVENT));
      if (date === editingDate || date === today) {
        setEditingDate(null);
        setSelectedStatus(null);
        setNote(null);
      }
      if (date !== today) {
        setSavedMessage("Your earlier check-in has been deleted.");
      }
    } catch {
      setSaveError("Your browser could not delete this check-in. Check its storage settings and try again.");
    }
  }

  function editCheckIn(entry: CheckIn) {
    setEditingDate(entry.date);
    setSelectedStatus(entry.status);
    setNote(entry.note);
    setSavedMessage("");
    setSaveError("");
  }

  return (
    <main className="night-app">
      <div className="page-shell">
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Night Reset home">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none">
                <path
                  d="M22.4 21.6A11.2 11.2 0 0 1 10.3 5.1 11.3 11.3 0 1 0 26.9 21a11.1 11.1 0 0 1-4.5.6Z"
                  fill="currentColor"
                />
                <path d="m22.5 5 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" fill="currentColor" />
              </svg>
            </span>
            <span>night reset</span>
          </Link>
          <div className="header-actions">
            <RainAudioControl />
            <Link className="header-link" href="/#bedtime-plan">
              Your bedtime plan <span aria-hidden="true">↗</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <section className="check-in-hero" aria-labelledby="check-in-heading">
          <div className="check-in-hero-copy">
            <p className="eyebrow"><span /> NO JUDGMENT, JUST A MOMENT</p>
            <h1 id="check-in-heading">How did tonight go?</h1>
            <p className="hero-description">
              Every night is different. Take a breath and check in with yourself.
            </p>
          </div>
          <div className="check-in-moon" aria-hidden="true">
            <span className="check-in-star star-a">✦</span>
            <span className="check-in-star star-b">✧</span>
            <span className="check-in-moon-shape" />
            <span className="check-in-hill" />
          </div>
          <span className="check-in-date">{formatDate(today)}</span>
        </section>

        <section className="check-in-layout" aria-label="Nightly check-in and recent history">
          <div className="check-in-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow card-eyebrow">TONIGHT’S CHECK-IN</p>
                <h2>What feels closest to your night?</h2>
              </div>
              <span className="step-number" aria-label="Step two">02</span>
            </div>
            <p className="card-intro">
              There’s no right answer. Your check-ins are just for you.
            </p>

            <form className="check-in-form" onSubmit={saveCheckIn}>
              <fieldset className="status-options">
                <legend className="sr-only">Choose how tonight went</legend>
                <label className={`status-option${currentStatus === "on-time" ? " selected" : ""}`}>
                  <input
                    type="radio"
                    name="check-in-status"
                    value="on-time"
                    checked={currentStatus === "on-time"}
                    onChange={() => {
                      setSelectedStatus("on-time");
                      setFormError("");
                    }}
                  />
                  <span className="status-symbol on-time-symbol" aria-hidden="true">✓</span>
                  <span className="status-copy">
                    <strong>I went to bed on time</strong>
                    <span>I followed the plan I made</span>
                  </span>
                  <span className="status-radio" aria-hidden="true" />
                </label>
                <label className={`status-option${currentStatus === "later" ? " selected" : ""}`}>
                  <input
                    type="radio"
                    name="check-in-status"
                    value="later"
                    checked={currentStatus === "later"}
                    onChange={() => {
                      setSelectedStatus("later");
                      setFormError("");
                    }}
                  />
                  <span className="status-symbol later-symbol" aria-hidden="true">◷</span>
                  <span className="status-copy">
                    <strong>I went to bed a little later</strong>
                    <span>I needed a bit more time tonight</span>
                  </span>
                  <span className="status-radio" aria-hidden="true" />
                </label>
                <label className={`status-option${currentStatus === "missed" ? " selected" : ""}`}>
                  <input
                    type="radio"
                    name="check-in-status"
                    value="missed"
                    checked={currentStatus === "missed"}
                    onChange={() => {
                      setSelectedStatus("missed");
                      setFormError("");
                    }}
                  />
                  <span className="status-symbol missed-symbol" aria-hidden="true">· · ·</span>
                  <span className="status-copy">
                    <strong>Tonight didn’t go to plan</strong>
                    <span>Tomorrow is another chance</span>
                  </span>
                  <span className="status-radio" aria-hidden="true" />
                </label>
              </fieldset>

              <label className="note-field">
                <span className="note-label">Anything you’d like to remember? <span>Optional</span></span>
                <textarea
                  value={currentNote}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="What helped you wind down, or made it tricky?"
                  maxLength={240}
                  rows={3}
                />
              </label>
              <div className="check-in-actions">
                <button className="save-button" type="submit">
                  {activeEntry
                    ? activeDate === today
                      ? "Update tonight’s check-in"
                      : "Update this check-in"
                    : activeDate === today
                      ? "Save tonight’s check-in"
                      : "Save this check-in"}
                  <span aria-hidden="true">→</span>
                </button>
                {activeEntry && (
                  <button
                    className="delete-check-in"
                    type="button"
                    onClick={() => deleteCheckIn(activeDate)}
                  >
                    Delete this check-in
                  </button>
                )}
                {editingDate && (
                  <button
                    className="delete-check-in"
                    type="button"
                    onClick={() => {
                      setEditingDate(null);
                      setSelectedStatus(null);
                      setNote(null);
                    }}
                  >
                    Cancel editing
                  </button>
                )}
              </div>
              <p
                className={`check-in-message${formError || saveError || snapshot.checkInError ? " form-message-error" : ""}`}
                aria-live="polite"
              >
                {formError ||
                  saveError ||
                  snapshot.checkInError ||
                  savedMessage ||
                  "Your check-ins stay on this device."}
              </p>
            </form>
          </div>

          <aside className="history-card" aria-labelledby="history-heading">
            <div className="history-heading">
              <div>
                <p className="eyebrow card-eyebrow">A LOOK BACK</p>
                <h2 id="history-heading">Recent nights</h2>
              </div>
              <span className="history-icon" aria-hidden="true">↗</span>
            </div>
            <p className="history-intro">A small picture of how things are going.</p>
            {snapshot.bedtimePlan && (
              <div className="bedtime-target">
                <span>YOUR BEDTIME GOAL</span>
                <strong>{formatTime(snapshot.bedtimePlan.bedtime)}</strong>
                <small>Wind-down at {formatTime(snapshot.bedtimePlan.reminder)}</small>
              </div>
            )}
            {snapshot.planError && <p className="plan-warning">{snapshot.planError}</p>}
            {recentEntries.length > 0 || todayEntry ? (
              <ol className="history-list">
                {todayEntry && (
                  <li className="history-entry">
                    <span className="history-day">{formatDate(today)}</span>
                    <span className={`history-dot ${todayEntry.status}`} aria-hidden="true" />
                    <span className="history-status">{statusLabels[todayEntry.status]}</span>
                    <div className="history-entry-actions">
                      <button type="button" onClick={() => editCheckIn(todayEntry)}>Edit</button>
                      <button type="button" onClick={() => deleteCheckIn(today)}>Delete</button>
                    </div>
                  </li>
                )}
                {recentEntries.map((entry) => (
                  <li className="history-entry" key={entry.date}>
                    <span className="history-day">{formatDate(entry.date)}</span>
                    <span className={`history-dot ${entry.status}`} aria-hidden="true" />
                    <span className="history-status">{statusLabels[entry.status]}</span>
                    <div className="history-entry-actions">
                      <button type="button" onClick={() => editCheckIn(entry)}>Edit</button>
                      <button type="button" onClick={() => deleteCheckIn(entry.date)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="history-empty">
                <span aria-hidden="true">☾</span>
                <p>Your recent check-ins will show up here, one night at a time.</p>
              </div>
            )}
            <div className="history-note">
              <span className="history-note-mark" aria-hidden="true">“</span>
              <p>Noticing is progress. Be kind to yourself along the way.</p>
            </div>
          </aside>
        </section>

        <footer className="page-footer">
          <span>Made for gentler nights.</span>
          <Link href="/">Back to your bedtime plan <span aria-hidden="true">↗</span></Link>
        </footer>
      </div>
    </main>
  );
}
