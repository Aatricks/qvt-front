import { Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { EmployeePage } from './pages/EmployeePage';
import { ManagerPage } from './pages/ManagerPage';
import { HRPage } from './pages/HRPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/employee" replace />} />
        <Route path="/employee" element={<EmployeePage />} />
        <Route path="/manager" element={<ManagerPage />} />
        <Route path="/hr" element={<HRPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/employee" replace />} />
      </Routes>
    </Layout>
  );
}
