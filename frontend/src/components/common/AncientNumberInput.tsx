import { Minus, Plus } from "lucide-react";

export interface AncientNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function AncientNumberInput({
  value,
  onChange,
  min = 1,
  max = 999999,
  step = 1,
  disabled = false,
  className = "",
  placeholder,
}: AncientNumberInputProps) {
  const handleDecrement = () => {
    if (disabled || value <= min) return;
    onChange(Math.max(min, value - step));
  };

  const handleIncrement = () => {
    if (disabled || value >= max) return;
    onChange(Math.min(max, value + step));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange(min);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
  };

  return (
    <div className={`ancient-number-wrap ${className}`}>
      <button
        type="button"
        className="ancient-num-btn minus"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="减少"
      >
        <Minus size={13} strokeWidth={2.2} />
      </button>
      <input
        type="number"
        className="ancient-num-input"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        onChange={handleInputChange}
      />
      <button
        type="button"
        className="ancient-num-btn plus"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="增加"
      >
        <Plus size={13} strokeWidth={2.2} />
      </button>
    </div>
  );
}
