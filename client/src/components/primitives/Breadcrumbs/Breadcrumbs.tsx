import { Fragment } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";
import styles from "./Breadcrumbs.module.css";

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbsProps
  extends Omit<HTMLAttributes<HTMLElement>, "onClick"> {
  items: BreadcrumbItem[];
  separator?: ReactNode;
}

export function Breadcrumbs({
  items,
  separator = "/",
  className,
  ...rest
}: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn(styles.root, className)} {...rest}>
      <ol className={styles.list}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={i}>
              <li className={styles.item}>
                {isLast ? (
                  <span className={styles.current} aria-current="page">
                    {item.label}
                  </span>
                ) : item.href ? (
                  <a className={styles.link} href={item.href} onClick={item.onClick}>
                    {item.label}
                  </a>
                ) : item.onClick ? (
                  <button type="button" className={styles.link} onClick={item.onClick}>
                    {item.label}
                  </button>
                ) : (
                  <span className={styles.link}>{item.label}</span>
                )}
              </li>
              {!isLast && (
                <li className={styles.separator} aria-hidden="true">
                  {separator}
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
