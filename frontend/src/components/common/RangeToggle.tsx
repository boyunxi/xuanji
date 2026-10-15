import { ranges } from "../../constants/navigation";
import type { RangeKey } from "../../types";

interface RangeToggleProps {
  value: RangeKey;
  onChange: (range: RangeKey) => void;
}

export function RangeToggle({ value, onChange }: RangeToggleProps) {
  return (
    <div className="range-toggle" aria-label="时间范围">
      {ranges.map((item) => (
        <button
          key={item.id}
          className={value === item.id ? "active" : ""}
          onClick={() => onChange(item.id)}
          aria-pressed={value === item.id}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
