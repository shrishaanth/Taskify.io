import { cn } from "../../utils/cn";
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "../../primitives/Breadcrumbs/Breadcrumbs";
import { Tabs } from "../../primitives/Tabs/Tabs";
import styles from "./ProjectHeader.module.css";

export type ProjectTabId = "boards" | "members";

export interface ProjectHeaderProps {
  name: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  activeTab: ProjectTabId;
  onTabChange: (tab: ProjectTabId) => void;
  className?: string;
}

const GridIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const PeopleIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 4.5a2.5 2.5 0 0 1 0 5M11.5 13c0-2 .6-3.2 2.5-3.6" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export function ProjectHeader({
  name,
  description,
  breadcrumbs,
  activeTab,
  onTabChange,
  className,
}: ProjectHeaderProps) {
  return (
    <header className={cn(styles.root, className)}>
      <Breadcrumbs items={breadcrumbs} />
      <h1 className={styles.name}>{name}</h1>
      {description && <p className={styles.description}>{description}</p>}
      <Tabs
        className={styles.tabs}
        aria-label="Project sections"
        activeId={activeTab}
        onChange={(id) => onTabChange(id as ProjectTabId)}
        tabs={[
          { id: "boards", label: "Boards", icon: <GridIcon /> },
          { id: "members", label: "Members", icon: <PeopleIcon /> },
        ]}
      />
    </header>
  );
}
