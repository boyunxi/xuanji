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
        <span className="game-select-caption">区服</span>
        <span>{value === "全部游戏" ? "全部区服" : value}</span>
        <ChevronDown size={15} strokeWidth={1.8} />
      </button>
      {open && (
        <div className="game-menu">
          {gameList.map((item) => {
            const displayName = item === "全部游戏" ? "全部区服" : item;
            const isChosen = value === item || (value === "全部区服" && item === "全部游戏");
            return (
              <button
                key={item}
                className={isChosen ? "chosen" : ""}
                onClick={() => {
                  onChange((item === "全部游戏" ? "全部区服" : item) as Game);
                  setOpen(false);
                }}
              >
                {displayName}
                {isChosen && <Check size={15} strokeWidth={1.9} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
