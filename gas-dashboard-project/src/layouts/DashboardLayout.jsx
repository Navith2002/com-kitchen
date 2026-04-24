import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Topbar from '../components/common/Topbar';
import { pageTitles } from '../utils/constants';
import AnalyticsChatbot from '../components/common/AnalyticsChatbot';

export default function DashboardLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <Topbar title={title} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      <AnalyticsChatbot />
    </div>
  );
}
