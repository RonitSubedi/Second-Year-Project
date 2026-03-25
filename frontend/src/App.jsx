import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage        from "./pages/LandingPage";
import Login              from "./pages/Login";
import Register           from "./pages/Register";
import Home               from "./pages/Home";
import MorningShift       from "./pages/MorningShift";
import DayShift           from "./pages/DayShift";
import StudentDashboard   from "./pages/StudentDashboard";
import Payment            from "./pages/Payment";
import Feedback           from "./pages/Feedback";
import BusTracker         from "./pages/BusTracker";
import DriverPanel        from "./pages/DriverPanel";
import AdminDashboard     from "./pages/AdminDashboard";
import AdminStudents      from "./pages/AdminStudents";
import AdminRegistrations from "./pages/AdminRegistrations";
import AdminPayments      from "./pages/AdminPayments";
import AdminFeedback      from "./pages/AdminFeedback";
import AdminBusTracking   from "./pages/AdminBusTracking";
import NotFound           from "./pages/NotFound";
import LiveNotification   from "./components/LiveNotification";

function ProtectedRoute({ children, adminOnly = false, driverOnly = false }) {
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly  && user.role !== "admin")  return <Navigate to="/home" replace />;
  if (driverOnly && user.role !== "driver" && user.role !== "admin") return <Navigate to="/home" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <LiveNotification />
      <Routes>
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student */}
        <Route path="/home"        element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/morning"     element={<ProtectedRoute><MorningShift /></ProtectedRoute>} />
        <Route path="/day"         element={<ProtectedRoute><DayShift /></ProtectedRoute>} />
        <Route path="/dashboard"   element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
        <Route path="/payment"     element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/feedback"    element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
        <Route path="/bus-tracker" element={<ProtectedRoute><BusTracker /></ProtectedRoute>} />

        {/* Driver */}
        <Route path="/driver"      element={<ProtectedRoute driverOnly><DriverPanel /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin"                element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/students"       element={<ProtectedRoute adminOnly><AdminStudents /></ProtectedRoute>} />
        <Route path="/admin/registrations"  element={<ProtectedRoute adminOnly><AdminRegistrations /></ProtectedRoute>} />
        <Route path="/admin/payments"       element={<ProtectedRoute adminOnly><AdminPayments /></ProtectedRoute>} />
        <Route path="/admin/feedback"       element={<ProtectedRoute adminOnly><AdminFeedback /></ProtectedRoute>} />
        <Route path="/admin/bus-tracking"   element={<ProtectedRoute adminOnly><AdminBusTracking /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
