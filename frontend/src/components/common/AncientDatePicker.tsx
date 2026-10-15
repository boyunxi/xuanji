import { useRef } from "react";
import { Calendar } from "lucide-react";

export interface AncientDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AncientDatePicker({
  value,
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  className = "",
}: AncientDatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClickWrapper = () => {
    if (disabled || !inputRef.current) return;
    try {
      // Use showPicker() if supported by the browser
      if ("showPicker" in HTMLInputElement.prototype) {
        inputRef.current.showPicker();
      } else {
        inputRef.current.focus();
      }
    } catch {
      inputRef.current.focus();
    }
  };

  return (
    <div
      className={`ancient-date-wrap ${disabled ? "is-disabled" : ""} ${className}`}
      onClick={handleClickWrapper}
    >
      <input
        ref={inputRef}
        type="date"
        className="ancient-date-input"
        value={value}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="ancient-date-icon" aria-hidden="true">
        <Calendar size={15} strokeWidth={1.8} />
      </div>
    </div>
  );
}
