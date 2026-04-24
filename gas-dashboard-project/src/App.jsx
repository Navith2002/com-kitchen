import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import OverviewPage from "./pages/Overview/OverviewPage";
import TemperatureHumidityPage from "./pages/TemperatureHumidity/TemperatureHumidityPage";
import GasPage from "./pages/Gas/GasPage";
import FridgePage from "./pages/Fridge/FridgePage";
import FirePage from "./pages/Fire/FirePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/temperature-humidity" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="temperature-humidity" element={<TemperatureHumidityPage />} />
          <Route path="gas" element={<GasPage />} />
          <Route path="fridge" element={<FridgePage />} />
          <Route path="fire" element={<FirePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}