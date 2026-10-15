import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Sparkles, Tag, X } from "lucide-react";
import type { GameItemOption } from "../../constants/gameItems";

export interface AncientSearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GameItemOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AncientSearchableSelect({
  value,
  onChange,
  options,
  placeholder = "搜索或选择物品，支持自定义输入...",
  required = false,
  disabled = false,
  className = "",
}: AncientSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Extract distinct categories
  const categories = ["全部", ...Array.from(new Set(options.map((opt) => opt.category)))];

  // Filter options based on typed value and selected category
  const filteredOptions = options.filter((item) => {
    const matchesCategory =
      selectedCategory === "全部" || item.category === selectedCategory;
    const query = value.trim().toLowerCase();
    if (!query) return matchesCategory;
    const matchesQuery =
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  // Check if current value exactly matches an item
  const hasExactMatch = options.some(
    (item) => item.name.toLowerCase() === value.trim().toLowerCase()
  );

  // Close when clicking outside
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(filteredOptions.length - 1);
      } else {
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
      }
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && activeIndex < filteredOptions.length) {
        e.preventDefault();
        onChange(filteredOptions[activeIndex].name);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleSelect = (itemName: string) => {
    onChange(itemName);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div
      className={`ancient-search-select ${disabled ? "is-disabled" : ""} ${className}`}
      ref={containerRef}
    >
      <div className={`search-select-input-box ${open ? "is-focused" : ""}`}>
        <input
          ref={inputRef}
          type="text"
          className="search-select-input"
          value={value}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          aria-expanded={open}
          aria-autocomplete="list"
        />

        {value && !disabled && (
          <button
            type="button"
            className="search-select-clear-btn"
            onClick={handleClear}
            title="清空输入"
            aria-label="清空输入"
          >
            <X size={14} />
          </button>
        )}

        <button
          type="button"
          className={`search-select-arrow-btn ${open ? "is-open" : ""}`}
          onClick={() => {
            if (!disabled) {
              setOpen(!open);
              inputRef.current?.focus();
            }
          }}
          title={open ? "收起选择列表" : "展开预设物品库"}
          aria-label="切换物品下拉选择"
        >
          <ChevronDown size={15} />
        </button>
      </div>

      {open && (
        <div className="search-select-menu" role="listbox">
          {/* Category Tabs */}
          <div className="search-select-categories">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`search-select-cat-chip ${selectedCategory === cat ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCategory(cat);
                  inputRef.current?.focus();
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Custom Typed Value Prompt */}
          {value.trim() && !hasExactMatch && (
            <div
              className="search-select-custom-notice"
              onClick={() => handleSelect(value.trim())}
            >
              <div className="custom-notice-icon">
                <Sparkles size={14} />
              </div>
              <div className="custom-notice-text">
                <strong>使用自定义道具名称：</strong>
                <span>「{value.trim()}」</span>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="search-select-options-list" ref={listRef}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item, idx) => {
                const isSelected = item.name === value;
                const isHighlighted = idx === activeIndex;

                return (
                  <div
                    key={item.name}
                    role="option"
                    aria-selected={isSelected}
                    className={`search-select-option-item ${isSelected ? "is-selected" : ""} ${isHighlighted ? "is-highlighted" : ""}`}
                    onClick={() => handleSelect(item.name)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <div className="option-item-main">
                      <div className="option-item-title-row">
                        <strong className="option-item-name">{item.name}</strong>
                        {item.rarity && (
                          <span className={`option-rarity-badge ${item.rarity}`}>
                            {item.rarity}
                          </span>
                        )}
                        <span className="option-category-badge">
                          <Tag size={10} />
                          {item.category}
                        </span>
                      </div>
                      {item.description && (
                        <p className="option-item-desc">{item.description}</p>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={16} className="option-item-check" strokeWidth={2.2} />
                    )}
                  </div>
                );
              })
            ) : (
              <div className="search-select-empty">
                <span>无匹配的预设道具，可直接使用输入的名称「{value}」发放</span>
              </div>
            )}
          </div>

          <div className="search-select-menu-footer">
            <span>共 {filteredOptions.length} 个备选物品 · 支持直接输入自定义名称</span>
          </div>
        </div>
      )}
    </div>
  );
}
