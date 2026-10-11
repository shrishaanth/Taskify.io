import type { CardSummary, Priority } from "../types/domain";
import { isDueSoon, isOverdue } from "./format";

export type DueFilter = "any" | "overdue" | "soon" | "week" | "none";

export interface CardFilters {
  query: string;
  assigneeIds: string[];
  priorities: Priority[];
  labels: string[];
  due: DueFilter;
}

export const NO_FILTERS: CardFilters = {
  query: "",
  assigneeIds: [],
  priorities: [],
  labels: [],
  due: "any",
};

export function isFiltering(f: CardFilters): boolean {
  return (
    f.query.trim() !== "" ||
    f.assigneeIds.length > 0 ||
    f.priorities.length > 0 ||
    f.labels.length > 0 ||
    f.due !== "any"
  );
}

const localDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

function matchesDue(card: CardSummary, due: DueFilter, now: Date): boolean {
  if (due === "any") return true;
  if (due === "none") return !card.dueDate;
  if (!card.dueDate) return false;
  if (due === "overdue") return isOverdue(card.dueDate, { now });
  if (due === "soon") return isDueSoon(card.dueDate, { now });
  // "week": due from today through the next seven days.
  const day = card.dueDate.slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  return day >= localDay(now) && day <= localDay(end);
}

/**
 * Different kinds of filter narrow each other (AND); several choices within
 * one kind widen it (OR). So "Alice or Bob" and "High or Urgent" together
 * means their high and urgent cards.
 */
export function applyCardFilters(
  cards: CardSummary[],
  filters: CardFilters,
  now: Date = new Date(),
): CardSummary[] {
  if (!isFiltering(filters)) return cards;
  const q = filters.query.trim().toLowerCase();

  return cards.filter((card) => {
    if (q) {
      const haystack = [card.title, ...card.labels].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (
      filters.assigneeIds.length > 0 &&
      !card.assignees.some((a) => filters.assigneeIds.includes(a.id))
    ) {
      return false;
    }
    if (
      filters.priorities.length > 0 &&
      !(card.priority && filters.priorities.includes(card.priority))
    ) {
      return false;
    }
    if (
      filters.labels.length > 0 &&
      !card.labels.some((l) => filters.labels.includes(l))
    ) {
      return false;
    }
    return matchesDue(card, filters.due, now);
  });
}

/** Adds the value if absent, removes it if present. */
export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
