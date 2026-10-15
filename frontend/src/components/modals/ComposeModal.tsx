import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, X } from "lucide-react";
import { games } from "../../constants/navigation";
import type { SpecificGame } from "../../types";
import { dateFromNow } from "../../utils/format";
import { useBodyScrollLock } from "../../utils/useBodyScrollLock";
import { AncientSelect } from "../common/AncientSelect";
import { AncientDatePicker } from "../common/AncientDatePicker";

interface ComposeModalProps {
  mode: "event" | "announcement" | null;
  onClose: () => void;
  defaultGame: string;
  onSubmit: (data: {
    title: string;
    game: SpecificGame;
    start?: string;
    content?: string;
  }) => void;
}

export function ComposeModal({
  mode,
  onClose,
  defaultGame,
  onSubmit,
}: ComposeModalProps) {
  useBodyScrollLock(Boolean(mode));

  if (!mode) return null;

  const [formTitle, setFormTitle] = useState("");
  const [formGame, setFormGame] = useState<SpecificGame>(
    defaultGame === "全部游戏" ? "山海长歌" : (defaultGame as SpecificGame)
  );
  const [formDate, setFormDate] = useState(dateFromNow(2));
  const [formContent, setFormContent] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    onSubmit({
      title: formTitle.trim(),
      game: formGame,
      start: mode === "event" ? formDate : undefined,
      content: mode === "announcement" ? formContent.trim() : undefined,
    });
  };

  return createPortal(
    <div className="modal-overlay" onMouseDown={onClose} style={{ zIndex: 10000 }}>
      <div
        className="compose-modal"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "event" ? "新建活动" : "新建公告"}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="compose-head">
          <div>
            <span>运营管理</span>
            <h2>{mode === "event" ? "新建活动" : "新建公告"}</h2>
          </div>
          <button className="icon-button" aria-label="关闭" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <span>{mode === "event" ? "活动名称" : "公告标题"}</span>
            <input
              required
              maxLength={40}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={mode === "event" ? "输入活动名称" : "输入公告标题"}
            />
          </div>
          <div className="form-field">
            <span>所属游戏</span>
            <AncientSelect
              value={formGame}
              onChange={(val) => setFormGame(val as SpecificGame)}
              options={games.slice(1)}
              ariaLabel="所属游戏"
            />
          </div>
          {mode === "event" ? (
            <div className="form-field">
              <span>开始日期</span>
              <AncientDatePicker
                min={dateFromNow(0)}
                required
                value={formDate}
                onChange={setFormDate}
              />
            </div>
          ) : (
            <div className="form-field">
              <span>公告内容</span>
              <textarea
                rows={4}
                maxLength={500}
                required
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="简要说明公告内容"
              />
            </div>
          )}
          <div className="compose-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="primary-button">
              {mode === "event" ? "创建活动" : "保存草稿"}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
