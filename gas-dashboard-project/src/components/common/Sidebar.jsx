import { NavLink } from 'react-router-dom';
import { Flame, Home, Snowflake, Thermometer, Waves, ShieldAlert } from 'lucide-react';
import { navItems } from '../../utils/constants';

const icons = {
  Home,
  Thermometer,
  ShieldAlert,
  Snowflake,
  Flame,
};

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">SK</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = icons[item.icon] || Waves;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
