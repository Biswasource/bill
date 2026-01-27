import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./components/Signup";
import QuotationGeneratorLanding from "./Landing";
import Login from "./components/Login";
import SidebarLayout from "./components/Layout/Layout";
// import { path } from "path";
import ServicesManager from "./components/Layout/ServicesPages";
import ClientsManager from "./components/Layout/ClientPages";
import QuotationPage from "./components/Layout/Quotation";
import SettingsPage from "./components/Layout/SettingPage";
import QuotationsList from "./components/Layout/QuoatationDashboard";
import Dashboard from "./components/Layout/Dashboard";
import UserManagement from "./components/Layout/UserManagement";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QuotationGeneratorLanding />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<SidebarLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="services" element={<ServicesManager />} />
          <Route path="clients" element={<ClientsManager />} />
          <Route path="quotation" element={<QuotationPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="quotations" element={<QuotationsList />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
