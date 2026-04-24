import { Bell, Moon } from 'lucide-react';

export default function Topbar({ title }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">Smart Kitchen Monitoring System</div>
        <div className="topbar-subtitle">{title}</div>
      </div>

      <div className="topbar-right">
        <button className="icon-button" type="button" aria-label="theme toggle">
          <Moon size={18} />
        </button>
        <div className="chip">cafe 99</div>
        <div className="chip">Banana Brothers</div>
        <button className="icon-button notification-dot" type="button" aria-label="alerts">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
