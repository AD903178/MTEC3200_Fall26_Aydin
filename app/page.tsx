"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";

type BedtimePlan = {
  bedtime: string;
  reminder: string;
};

const PLAN_STORAGE_KEY = "night-reset-plan";
const PLAN_CHANGE_EVENT = "night-reset:plan-change";

function isBedtimePlan(value: unknown): value is BedtimePlan {
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
    typeof value.reminder === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value.bedtime) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value.reminder)
  );
}

type PlanSnapshot = {
  plan: BedtimePlan | null;
  error: string | null;
};

const emptyPlanSnapshot: PlanSnapshot = { plan: null, error: null };
let cachedPlanSnapshot: PlanSnapshot | undefined;
const planListeners = new Set<() => void>();

function getPlanSnapshot(): PlanSnapshot {
  if (cachedPlanSnapshot) {
    return cachedPlanSnapshot;
  }

  try {
    const storedPlan = window.localStorage.getItem(PLAN_STORAGE_KEY);
    if (!storedPlan) {
      cachedPlanSnapshot = emptyPlanSnapshot;
    } else {
      const parsedPlan: unknown = JSON.parse(storedPlan);
      cachedPlanSnapshot = isBedtimePlan(parsedPlan)
        ? { plan: parsedPlan, error: null }
        : {
            plan: null,
            error: "Your saved plan could not be read. You can set a new one below.",
          };
    }
  } catch {
    cachedPlanSnapshot = {
      plan: null,
      error: "Your plan could not be loaded from this browser. You can still set a plan for now.",
    };
  }

  return cachedPlanSnapshot;
}

function getServerPlanSnapshot() {
  return emptyPlanSnapshot;
}

function notifyPlanChange() {
  cachedPlanSnapshot = undefined;
  for (const listener of planListeners) {
    listener();
  }
}

function handleStorageChange(event: StorageEvent) {
  if (event.key === PLAN_STORAGE_KEY || event.key === null) {
    notifyPlanChange();
  }
}

function subscribeToPlan(listener: () => void) {
  planListeners.add(listener);
  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(PLAN_CHANGE_EVENT, notifyPlanChange);

  return () => {
    planListeners.delete(listener);
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(PLAN_CHANGE_EVENT, notifyPlanChange);
  };
}

function formatTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

export default function Home() {
  const storedPlan = useSyncExternalStore(
    subscribeToPlan,
    getPlanSnapshot,
    getServerPlanSnapshot,
  );
  const [bedtime, setBedtime] = useState<string | null>(null);
  const [reminder, setReminder] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const savedPlan = storedPlan.plan;
  const message =
    formMessage?.text ??
    storedPlan.error ??
    "Your plan stays on this device. You can change it whenever you like.";
  const messageIsError = formMessage?.isError ?? Boolean(storedPlan.error);
  const bedtimeValue = bedtime ?? savedPlan?.bedtime ?? "";
  const reminderValue = reminder ?? savedPlan?.reminder ?? "";

  function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!bedtimeValue || !reminderValue) {
      setFormMessage({ text: "Choose both a bedtime and a wind-down reminder time.", isError: true });
      return;
    }

    const plan = { bedtime: bedtimeValue, reminder: reminderValue };

    try {
      window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
      window.dispatchEvent(new Event(PLAN_CHANGE_EVENT));
      setFormMessage({ text: "Your plan is saved on this device.", isError: false });
    } catch {
      setFormMessage({
        text: "Your browser could not save this plan. Check its storage settings and try again.",
        isError: true,
      });
    }
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
          <Link className="header-link" href="/check-in">
            Tonight’s check-in <span aria-hidden="true">↗</span>
          </Link>
        </header>

        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <p className="eyebrow"><span /> A LITTLE SPACE BEFORE SLEEP</p>
            <h1 id="hero-heading">Make room for a<br />quieter kind of night.</h1>
            <p className="hero-description">
              A gentle nudge to pause, wind down, and make bedtime feel more like your own.
            </p>
            <a className="hero-button" href="#bedtime-plan">
              Set up tonight <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="moon-scene" aria-hidden="true">
            <span className="moon-orbit orbit-one" />
            <span className="moon-orbit orbit-two" />
            <span className="moon-shape" />
            <span className="scene-star star-one">✦</span>
            <span className="scene-star star-two">✧</span>
            <span className="scene-star star-three">·</span>
            <span className="scene-hill hill-back" />
            <span className="scene-hill hill-front" />
          </div>
          <span className="hero-note">Small steps count.</span>
        </section>

        <section className="content-grid" aria-label="Your bedtime setup">
          <div className="plan-card" id="bedtime-plan">
            <div className="card-heading">
              <div>
                <p className="eyebrow card-eyebrow">YOUR FIRST STEP</p>
                <h2>Choose a time that feels right.</h2>
              </div>
              <span className="step-number" aria-label="Step one">01</span>
            </div>
            <p className="card-intro">
              Start with a bedtime goal and a little reminder to help you begin winding down.
            </p>

            <form className="plan-form" onSubmit={savePlan}>
              <div className="time-fields">
                <label className="time-field">
                  <span className="field-label">My bedtime</span>
                  <span className="input-wrap">
                    <span className="field-icon" aria-hidden="true">☾</span>
                    <input
                      aria-label="My bedtime"
                      type="time"
                      required
                      value={bedtimeValue}
                      onChange={(event) => {
                        setBedtime(event.target.value);
                        setFormMessage(null);
                      }}
                    />
                  </span>
                </label>
                <label className="time-field">
                  <span className="field-label">Remind me to wind down</span>
                  <span className="input-wrap">
                    <span className="field-icon reminder-icon" aria-hidden="true">◷</span>
                    <input
                      aria-label="Wind-down reminder time"
                      type="time"
                      required
                      value={reminderValue}
                      onChange={(event) => {
                        setReminder(event.target.value);
                        setFormMessage(null);
                      }}
                    />
                  </span>
                </label>
              </div>
              <button className="save-button" type="submit">
                {savedPlan ? "Update my plan" : "Save my bedtime plan"}
                <span aria-hidden="true">→</span>
              </button>
              <p
                className={`form-message${messageIsError ? " form-message-error" : ""}`}
                aria-live="polite"
              >
                {message}
              </p>
            </form>

            {savedPlan && (
              <div className="saved-summary">
                <span className="saved-check" aria-hidden="true">✓</span>
                <p>
                  Tonight, start winding down at <strong>{formatTime(savedPlan.reminder)}</strong>
                  {" "}and aim for <strong>{formatTime(savedPlan.bedtime)}</strong>.
                </p>
              </div>
            )}
          </div>

          <aside className="ritual-card" aria-labelledby="ritual-heading">
            <div className="ritual-topline">
              <span className="ritual-icon" aria-hidden="true">✳</span>
              <span className="ritual-label">A SOFTER LANDING</span>
            </div>
            <h2 id="ritual-heading">No perfect routine required.</h2>
            <p>When it’s time, try one small thing that helps you switch off.</p>
            <div className="ritual-divider" />
            <ul className="ritual-list">
              <li><span>01</span>Dim the lights around you</li>
              <li><span>02</span>Put your phone down for a moment</li>
              <li><span>03</span>Take a slow breath</li>
            </ul>
            <p className="ritual-footnote">A reminder is a nudge, not a rule.</p>
          </aside>
        </section>

        <footer className="page-footer">
          <span>Made for gentler nights.</span>
          <span>Your bedtime plan stays yours.</span>
        </footer>
      </div>
    </main>
  );
}
