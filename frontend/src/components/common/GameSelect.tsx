import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { games as defaultGames } from "../../constants/navigation";
import { api } from "../../api/client";
import type { Game } from "../../types";

interface GameSelectProps {
  value: Game;
  onChange: (game: Game) => void;
}

export function GameSelect({ value, onChange }: GameSelectProps) {
  const [open, setOpen] = useState(false);
  const [gameList, setGameList] = useState<string[]>(defaultGames);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getGames()
      .then((data) => {
        if (data && data.length > 0) {
          setGameList(data.map((g) => g.name));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <div className="game-select" ref={ref}>
      <button
        className={`game-select-trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="选择游戏"
      >
        <span className="game-select-caption">游戏</span>
        <span>{value}</span>
        <ChevronDown size={15} strokeWidth={1.8} />
      </button>
      {open && (
        <div className="game-menu">
          {gameList.map((item) => (
            <button
              key={item}
              className={value === item ? "chosen" : ""}
              onClick={() => {
                onChange(item as Game);
                setOpen(false);
              }}
            >
              {item}
              {value === item && <Check size={15} strokeWidth={1.9} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
