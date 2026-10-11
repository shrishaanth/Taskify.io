import { forwardRef } from "react";
import { Avatar } from "../../primitives/Avatar/Avatar";
import { Select } from "../../primitives/Select/Select";
import { SearchInput } from "../SearchInput/SearchInput";
import {
  NO_FILTERS,
  isFiltering,
  toggle,
  type CardFilters,
  type DueFilter,
} from "../../../lib/cardFilters";
import type { Priority, UserRef } from "../../../types/domain";
import styles from "./BoardFilterBar.module.css";

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const DUE_OPTIONS: { value: DueFilter; label: string }[] = [
  { value: "any", label: "Any due date" },
  { value: "overdue", label: "Overdue" },
  { value: "soon", label: "Due in 2 days" },
  { value: "week", label: "Due this week" },
  { value: "none", label: "No due date" },
];

export interface BoardFilterBarProps {
  filters: CardFilters;
  onChange: (next: CardFilters) => void;
  /** People who can be assigned on this board. */
  members: UserRef[];
  /** Every label in use on the board. */
  labels: string[];
  shownCount: number;
  totalCount: number;
}

/**
 * Narrows the board without leaving it. Each control is a toggle that shows
 * its own state, so the bar itself is the summary of what is filtered.
 */
export const BoardFilterBar = forwardRef<HTMLInputElement, BoardFilterBarProps>(
  function BoardFilterBar(
    { filters, onChange, members, labels, shownCount, totalCount },
    searchRef,
  ) {
    const active = isFiltering(filters);
    const set = (patch: Partial<CardFilters>) => onChange({ ...filters, ...patch });

    return (
      <div className={styles.root} role="group" aria-label="Filter cards">
        <SearchInput
          ref={searchRef}
          className={styles.search}
          value={filters.query}
          placeholder="Search cards"
          aria-label="Search cards"
          onChange={(query) => set({ query })}
        />

        {members.length > 0 && (
          <div className={styles.people} role="group" aria-label="Filter by assignee">
            {members.map((m) => {
              const on = filters.assigneeIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  className={styles.person}
                  aria-pressed={on}
                  aria-label={`Cards assigned to ${m.name}`}
                  title={m.name}
                  onClick={() => set({ assigneeIds: toggle(filters.assigneeIds, m.id) })}
                >
                  <Avatar
                    name={m.name}
                    {...(m.avatarUrl ? { src: m.avatarUrl } : {})}
                    size="sm"
                  />
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.chips} role="group" aria-label="Filter by priority">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              className={styles.chip}
              data-priority={p.value}
              aria-pressed={filters.priorities.includes(p.value)}
              onClick={() => set({ priorities: toggle(filters.priorities, p.value) })}
            >
              <span className={styles.dot} aria-hidden="true" />
              {p.label}
            </button>
          ))}
        </div>

        {labels.length > 0 && (
          <div className={styles.chips} role="group" aria-label="Filter by label">
            {labels.map((label) => (
              <button
                key={label}
                type="button"
                className={styles.chip}
                aria-pressed={filters.labels.includes(label)}
                onClick={() => set({ labels: toggle(filters.labels, label) })}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <span className={styles.due}>
          <Select
            size="sm"
            aria-label="Filter by due date"
            value={filters.due}
            options={DUE_OPTIONS}
            onChange={(e) => set({ due: e.target.value as DueFilter })}
          />
        </span>

        {active && (
          <>
            <span className={styles.count} aria-live="polite">
              {shownCount} of {totalCount} cards
            </span>
            <button
              type="button"
              className={styles.clear}
              onClick={() => onChange(NO_FILTERS)}
            >
              Clear filters
            </button>
          </>
        )}
      </div>
    );
  },
);
