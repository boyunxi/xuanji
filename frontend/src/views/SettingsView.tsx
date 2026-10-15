import { Check } from "lucide-react";
import type { Settings } from "../types";

interface SettingsViewProps {
  settings: Settings;
  onSettingChange: (key: keyof Settings, val: boolean) => void;
  onSave: () => void;
}

export function SettingsView({
  settings,
  onSettingChange,
  onSave,
}: SettingsViewProps) {
  const options = [
    {
      id: "daily" as const,
      title: "每日数据简报",
      description: "每天早上汇总前一日关键运营数据。",
    },
    {
      id: "orders" as const,
      title: "异常订单提醒",
      description: "有待核对的充值订单时发送提醒。",
    },
    {
      id: "events" as const,
      title: "活动上线提醒",
      description: "活动开始前提醒检查配置。",
    },
  ];

  return (
    <div className="settings-panel content-enter">
      <div className="settings-section-head">
        <div className="section-title-line">
          <span className="title-rule" />
          <h2>消息提醒</h2>
        </div>
        <p>选择需要接收的工作台提醒，保存后持久化至 Go 后端。</p>
      </div>
      {options.map((item) => (
        <div className="setting-row" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </div>
          <button
            role="switch"
            aria-checked={settings[item.id]}
            aria-label={item.title}
            className={`switch ${settings[item.id] ? "on" : ""}`}
            onClick={() => onSettingChange(item.id, !settings[item.id])}
          >
            <span />
          </button>
        </div>
      ))}
      <div className="settings-bottom">
        <span>配置修改后点击保存立即生效。</span>
        <button className="primary-button" onClick={onSave}>
          <Check size={16} />
          保存设置
        </button>
      </div>
    </div>
  );
}
