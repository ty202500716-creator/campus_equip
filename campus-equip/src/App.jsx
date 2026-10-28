import { Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout.jsx'
import LandingPage from './pages/auth/LandingPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import BorrowerDashboard from './pages/borrower/BorrowerDashboard.jsx'
import EquipmentCatalog from './pages/borrower/EquipmentCatalog.jsx'
import EquipmentDetails from './pages/borrower/EquipmentDetails.jsx'
import MyRequests from './pages/borrower/MyRequests.jsx'
import Notifications from './pages/borrower/Notifications.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import RequestManagement from './pages/admin/RequestManagement.jsx'
import EquipmentManagement from './pages/admin/EquipmentManagement.jsx'
import LoanMonitor from './pages/admin/LoanMonitor.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/borrower" element={<DashboardLayout role="borrower" />}>
        <Route index element={<BorrowerDashboard />} />
        <Route path="catalog" element={<EquipmentCatalog />} />
        <Route path="catalog/:id" element={<EquipmentDetails />} />
        <Route path="requests" element={<MyRequests />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="/admin" element={<DashboardLayout role="admin" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="requests" element={<RequestManagement />} />
        <Route path="equipment" element={<EquipmentManagement />} />
        <Route path="loans" element={<LoanMonitor />} />
      </Route>
    </Routes>
  )
}