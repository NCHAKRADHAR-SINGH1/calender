"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type NotesMap = Record<string, string>;

type PersistedState = {
  dayNotes: NotesMap;
  monthNotes: NotesMap;
  rangeNotes: NotesMap;
  heroIndex: number;
};

const STORAGE_KEY = "wall-calendar-state-v1";
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1463694775559-eea25626346b?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1443890923422-7819ed4101c0?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1800&q=80",
  "https://images.unsplash.com/photo-1458668383970-8ddd3927deed?auto=format&fit=crop&w=1800&q=80",
];

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const dayLabelFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
});

const verboseDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameMonth(a: Date | null, b: Date): boolean {
  if (!a) {
    return false;
  }

  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) {
    return false;
  }

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetween(target: Date, start: Date, end: Date): boolean {
  const t = target.getTime();
  const s = start.getTime();
  const e = end.getTime();
  return t >= Math.min(s, e) && t <= Math.max(s, e);
}

function toRangeKey(a: Date, b: Date): string {
  const start = a.getTime() <= b.getTime() ? a : b;
  const end = a.getTime() <= b.getTime() ? b : a;
  return `${toISODateString(start)}__${toISODateString(end)}`;
}

function buildCalendarGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const firstDayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - firstDayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

function loadInitialState(): PersistedState {
  if (typeof window === "undefined") {
    return {
      dayNotes: {},
      monthNotes: {},
      rangeNotes: {},
      heroIndex: 0,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        dayNotes: {},
        monthNotes: {},
        rangeNotes: {},
        heroIndex: 0,
      };
    }

    const parsed = JSON.parse(raw) as PersistedState;
    return {
      dayNotes: parsed.dayNotes ?? {},
      monthNotes: parsed.monthNotes ?? {},
      rangeNotes: parsed.rangeNotes ?? {},
      heroIndex: Number.isInteger(parsed.heroIndex) ? parsed.heroIndex : 0,
    };
  } catch {
    return {
      dayNotes: {},
      monthNotes: {},
      rangeNotes: {},
      heroIndex: 0,
    };
  }
}

export default function WallCalendar() {
  const [persisted] = useState<PersistedState>(() => loadInitialState());

  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [focusedDate, setFocusedDate] = useState<Date | null>(new Date());

  const [dayNotes, setDayNotes] = useState<NotesMap>(persisted.dayNotes);
  const [monthNotes, setMonthNotes] = useState<NotesMap>(persisted.monthNotes);
  const [rangeNotes, setRangeNotes] = useState<NotesMap>(persisted.rangeNotes);
  const [heroIndex, setHeroIndex] = useState(
    persisted.heroIndex % HERO_IMAGES.length,
  );
  const [sceneFadeKey, setSceneFadeKey] = useState(0);
  const [monthDraft, setMonthDraft] = useState("");
  const [dayDraft, setDayDraft] = useState("");
  const [rangeDraft, setRangeDraft] = useState("");
  const [monthSaved, setMonthSaved] = useState(false);
  const [daySaved, setDaySaved] = useState(false);
  const [rangeSaved, setRangeSaved] = useState(false);
  const [showSavedNotes, setShowSavedNotes] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: PersistedState = {
      dayNotes,
      monthNotes,
      rangeNotes,
      heroIndex,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [dayNotes, monthNotes, rangeNotes, heroIndex]);

  const monthKey = useMemo(() => toMonthKey(currentMonth), [currentMonth]);
  const monthTitle = useMemo(() => monthFormatter.format(currentMonth), [currentMonth]);
  const calendarDays = useMemo(() => buildCalendarGrid(currentMonth), [currentMonth]);

  const previewEnd = rangeStart && !rangeEnd ? hoverDate : rangeEnd;
  const selectedRangeKey =
    rangeStart && rangeEnd ? toRangeKey(rangeStart, rangeEnd) : undefined;

  const focusedDayKey = focusedDate ? toISODateString(focusedDate) : "";

  const rangeStatusLabel = rangeStart
    ? rangeEnd
      ? `${verboseDateFormatter.format(rangeStart)} to ${verboseDateFormatter.format(rangeEnd)}`
      : `Start selected: ${verboseDateFormatter.format(rangeStart)}. Pick an end date.`
    : "Pick a start and end date to attach a range note";
  const selectedDateLabel = focusedDate
    ? `Selected date: ${verboseDateFormatter.format(focusedDate)}`
    : "No date selected yet";

  const shiftMonth = (offset: number): void => {
    setCurrentMonth((previousMonth) => {
      const nextMonth = addMonths(previousMonth, offset);

      setFocusedDate((previousFocusedDate) => {
        if (isSameMonth(previousFocusedDate, nextMonth)) {
          return previousFocusedDate;
        }

        return startOfMonth(nextMonth);
      });

      setHoverDate(null);
      setDayDraft("");
      setRangeDraft("");
      setMonthDraft("");

      return nextMonth;
    });
  };

  const handleDateSelection = (clickedDate: Date): void => {
    setFocusedDate(clickedDate);

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(clickedDate);
      setRangeEnd(null);
      return;
    }

    if (clickedDate.getTime() < rangeStart.getTime()) {
      setRangeStart(clickedDate);
      return;
    }

    setRangeEnd(clickedDate);
  };

  const updateMonthNote = (value: string): void => {
    setMonthDraft(value);
  };

  const updateFocusedDayNote = (value: string): void => {
    setDayDraft(value);
  };

  const updateSelectedRangeNote = (value: string): void => {
    setRangeDraft(value);
  };

  const saveMonthNote = (): void => {
    setMonthNotes((prev) => ({
      ...prev,
      [monthKey]: monthDraft,
    }));
    setMonthDraft("");
    setMonthSaved(true);
    setTimeout(() => setMonthSaved(false), 1500);
  };

  const saveFocusedDayNote = (): void => {
    if (!focusedDayKey) {
      return;
    }

    setDayNotes((prev) => ({
      ...prev,
      [focusedDayKey]: dayDraft,
    }));
    setDayDraft("");
    setDaySaved(true);
    setTimeout(() => setDaySaved(false), 1500);
  };

  const saveSelectedRangeNote = (): void => {
    if (!selectedRangeKey) {
      return;
    }

    setRangeNotes((prev) => ({
      ...prev,
      [selectedRangeKey]: rangeDraft,
    }));
    setRangeDraft("");
    setRangeSaved(true);
    setTimeout(() => setRangeSaved(false), 1500);
  };

  const clearSelection = (): void => {
    setRangeStart(null);
    setRangeEnd(null);
    setHoverDate(null);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
      setSceneFadeKey((prev) => prev + 1);
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const parseSavedNotes = useMemo(() => {
    const notes: Array<{
      type: string;
      label: string;
      content: string;
      date?: string;
    }> = [];

    Object.entries(monthNotes).forEach(([key, content]) => {
      if (content.trim()) {
        notes.push({
          type: "Month",
          label: `${key} memo`,
          content,
          date: key,
        });
      }
    });

    Object.entries(dayNotes).forEach(([key, content]) => {
      if (content.trim()) {
        const date = new Date(key);
        notes.push({
          type: "Day",
          label: verboseDateFormatter.format(date),
          content,
          date: key,
        });
      }
    });

    Object.entries(rangeNotes).forEach(([key, content]) => {
      if (content.trim()) {
        const [startStr, endStr] = key.split("__");
        const startDate = new Date(startStr);
        const endDate = new Date(endStr);
        notes.push({
          type: "Range",
          label: `${verboseDateFormatter.format(startDate)} to ${verboseDateFormatter.format(endDate)}`,
          content,
          date: startStr,
        });
      }
    });

    return notes.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }, [monthNotes, dayNotes, rangeNotes]);

  return (
    <main className="calendar-page">
      <div className="wall-calendar">
        <div className="ring-strip" aria-hidden="true" />

        <section className="hero-panel">
          <Image
            src={HERO_IMAGES[heroIndex]}
            alt="Illustrated mountain landscape"
            fill
            priority
            className="hero-image"
            key={sceneFadeKey}
          />
          <div className="hero-overlay" aria-hidden="true" />
          <div className="hero-content">
            <h1>{monthTitle}</h1>
          </div>
        </section>

        <section className="sheet-panel">
          <div className="sheet-actions">
            <p className="sheet-caption">Wall calendar controls</p>
            <div className="action-buttons">
              <button
                type="button"
                className="ghost-button dark"
                onClick={() => setShowSavedNotes(!showSavedNotes)}
              >
                {showSavedNotes ? "Back to calendar" : "Saved notes"}
              </button>
            </div>
          </div>

          {showSavedNotes ? (
            <div className="saved-notes-view">
              <h2>All Saved Notes</h2>
              {parseSavedNotes.length === 0 ? (
                <p className="empty-saved-notes">No saved notes yet. Create some notes in the calendar to see them here!</p>
              ) : (
                <div className="saved-notes-list">
                  {parseSavedNotes.map((note, index) => (
                    <div key={index} className="saved-note-item">
                      <div className="saved-note-header">
                        <span className="note-type-badge">{note.type}</span>
                        <span className="note-label">{note.label}</span>
                      </div>
                      <p className="note-content">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="sheet-layout">
              <aside className="notes-column">
              <div className="notes-card">
                <div className="notes-card-head">
                  <h2>Month memo</h2>
                  <button type="button" className={`save-button ${monthSaved ? "saved" : ""}`} onClick={saveMonthNote}>
                    {monthSaved ? "✓ Saved" : "Add note"}
                  </button>
                </div>
                <textarea
                  value={monthDraft}
                  onChange={(event) => updateMonthNote(event.target.value)}
                  placeholder="Write your monthly objectives, reminders, or goals..."
                />
              </div>

              <div className="notes-card">
                <div className="notes-card-head">
                  <h2>Day note</h2>
                  <button type="button" className={`save-button ${daySaved ? "saved" : ""}`} onClick={saveFocusedDayNote}>
                    {daySaved ? "✓ Saved" : "Add note"}
                  </button>
                </div>
                <p className="note-meta">
                  {focusedDate
                    ? verboseDateFormatter.format(focusedDate)
                    : "Select a day from the grid"}
                </p>
                <p className="note-meta">
                  Notes are saved by date. You can navigate to previous months and add notes.
                </p>
                <textarea
                  value={dayDraft}
                  onChange={(event) => updateFocusedDayNote(event.target.value)}
                  placeholder="Attach a note to the selected day..."
                  disabled={!focusedDate}
                />
              </div>

              <div className="notes-card">
                <div className="notes-card-head">
                  <h2>Range note</h2>
                  <button type="button" className={`save-button ${rangeSaved ? "saved" : ""}`} onClick={saveSelectedRangeNote}>
                    {rangeSaved ? "✓ Saved" : "Add note"}
                  </button>
                </div>
                <p className="note-meta">{rangeStatusLabel}</p>
                {rangeStart ? (
                  <div className="range-pill-row" aria-live="polite">
                    <span className="range-pill active">{verboseDateFormatter.format(rangeStart)}</span>
                    <span className="range-pill connector">to</span>
                    <span className={`range-pill ${rangeEnd ? "active" : "pending"}`}>
                      {rangeEnd ? verboseDateFormatter.format(rangeEnd) : "Select end date"}
                    </span>
                  </div>
                ) : null}
                <textarea
                  value={rangeDraft}
                  onChange={(event) => updateSelectedRangeNote(event.target.value)}
                  placeholder="Capture tasks related to the selected date range..."
                  disabled={!rangeStart}
                />
              </div>
            </aside>

            <div className="calendar-column">
              <div className="calendar-toolbar">
                <button
                  type="button"
                  className="nav-button"
                  onClick={() => shiftMonth(-1)}
                >
                  Prev
                </button>

                <p className="current-month">{monthTitle}</p>

                <button
                  type="button"
                  className="nav-button"
                  onClick={() => shiftMonth(1)}
                >
                  Next
                </button>
              </div>

              <div className="selection-summary" aria-live="polite">
                <span>{selectedDateLabel}</span>
                <span>
                  {rangeStart
                    ? rangeEnd
                      ? `Range: ${verboseDateFormatter.format(rangeStart)} - ${verboseDateFormatter.format(rangeEnd)}`
                      : `Range start: ${verboseDateFormatter.format(rangeStart)}`
                    : "Range: none"}
                </span>
              </div>

              <div className="weekday-row" role="row">
                {WEEKDAYS.map((weekday) => (
                  <span key={weekday}>{weekday}</span>
                ))}
              </div>

              <div className="grid-wrap" key={monthKey}>
                {calendarDays.map((day) => {
                  const dayISO = toISODateString(day);
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = isSameDay(day, new Date());
                  const start = isSameDay(day, rangeStart);
                  const end = isSameDay(day, rangeEnd);
                  const inRange =
                    rangeStart && previewEnd
                      ? isBetween(day, rangeStart, previewEnd)
                      : false;

                  const classNames = ["day-cell"];
                  if (!isCurrentMonth) classNames.push("muted");
                  if (isToday) classNames.push("today");
                  if (inRange) classNames.push("in-range");
                  if (start) classNames.push("range-start");
                  if (end) classNames.push("range-end");

                  return (
                    <button
                      key={dayISO}
                      type="button"
                      className={classNames.join(" ")}
                      onClick={() => handleDateSelection(day)}
                      onMouseEnter={() => setHoverDate(day)}
                      onMouseLeave={() => setHoverDate(null)}
                    >
                      <span>{dayLabelFormatter.format(day)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="calendar-footer">
                <p>
                  {rangeStart && rangeEnd
                    ? `Selected ${Math.abs((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1} days`
                    : "Click a day to start selecting a range"}
                </p>
                <button type="button" className="clear-link" onClick={clearSelection}>
                  Clear range
                </button>
              </div>
            </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
