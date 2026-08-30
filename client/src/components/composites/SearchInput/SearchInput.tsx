import { forwardRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Input } from "../../primitives/Input/Input";

export interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      defaultValue,
      onChange,
      onSearch,
      placeholder = "Search…",
      className,
      "aria-label": ariaLabel = "Search",
    },
    ref,
  ) {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
      onChange?.(e.target.value);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const field = e.currentTarget.elements.namedItem(
        "q",
      ) as HTMLInputElement | null;
      onSearch?.(field?.value ?? "");
    };

    return (
      <form role="search" className={className} onSubmit={handleSubmit}>
        <Input
          ref={ref}
          name="q"
          type="search"
          leadingIcon={<SearchIcon />}
          placeholder={placeholder}
          aria-label={ariaLabel}
          {...(value !== undefined ? { value } : {})}
          {...(defaultValue !== undefined ? { defaultValue } : {})}
          {...(onChange ? { onChange: handleChange } : {})}
        />
      </form>
    );
  },
);
