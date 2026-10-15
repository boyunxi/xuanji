import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  note?: string;
}

export interface AncientSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<SelectOption<T> | T>;
  caption?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function AncientSelect<T extends string = string>({
  value,
  onChange,
  options,
  caption,
  placeholder = "请选择",
  disabled = false,
  className = "",
  ariaLabel,
}: AncientSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: SelectOption<T>[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt as T, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((prev) => !prev);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        const idx = normalizedOptions.findIndex((opt) => opt.value === value);
        if (idx < normalizedOptions.length - 1) {
          onChange(normalizedOptions[idx + 1].value);
        }
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        const idx = normalizedOptions.findIndex((opt) => opt.value === value);
        if (idx > 0) {
          onChange(normalizedOptions[idx - 1].value);
        }
      }
    }
  };

  return (
    <div
      className={`ancient-select-container ${disabled ? "is-disabled" : ""} ${className}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className={`ancient-select-trigger ${open ? "is-open" : ""}`}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        aria-expanded={open}
        aria-label={ariaLabel || caption || "下拉选择"}
      >
        {caption && <span className="ancient-select-caption">{caption}</span>}
        <span className="ancient-select-val">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={14} className="ancient-select-chevron" />
      </button>

      {open && (
        <div className="ancient-select-menu" role="listbox">
          {normalizedOptions.map((item) => {
            const isChosen = item.value === value;
            return (
              <button
                type="button"
                role="option"
                aria-selected={isChosen}
                key={item.value}
                className={`ancient-select-option ${isChosen ? "is-chosen" : ""}`}
                onClick={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <span className="option-label">{item.label}</span>
                {item.note && <span className="option-note">{item.note}</span>}
                {isChosen && <Check size={14} className="option-check" strokeWidth={2} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
