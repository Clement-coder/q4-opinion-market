import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Routes, Route } from "react-router-dom";
import Navbar  from "./components/Header";
import Footer  from "./components/Footer";

import HomePage       from "./pages/HomePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import MarketsPage    from "./pages/MarketsPage";
import AboutPage      from "./pages/AboutPage";
import FaqPage        from "./pages/FaqPage";
import SignUpPage     from "./pages/SignUpPage";
import LoginPage      from "./pages/LoginPage";
import DashboardPage  from "./pages/DashboardPage";

function PublicLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#080808" }}>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

/* Full-screen loading spinner shown while Firebase resolves auth state */
function AuthLoader() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        width: 36, height: 36,
        border: "3px solid rgba(255,255,255,0.08)",
        borderTopColor: "#ffffff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** Redirect to /dashboard if already signed in. Show loader while resolving. */
function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

/** Redirect to /login if not signed in. Show loader while resolving. */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  // While Firebase is resolving, show a full-screen loader instead of
  // a blank page or a premature redirect to /login.
  if (loading) return <AuthLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ── Public pages ── */}
      <Route path="/"             element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/markets"      element={<PublicLayout><MarketsPage /></PublicLayout>} />
      <Route path="/how-it-works" element={<PublicLayout><HowItWorksPage /></PublicLayout>} />
      <Route path="/about"        element={<PublicLayout><AboutPage /></PublicLayout>} />
      <Route path="/faq"          element={<PublicLayout><FaqPage /></PublicLayout>} />

      {/* ── Legacy redirect ── */}
      <Route path="/polls"        element={<Navigate to="/markets" replace />} />

      {/* ── Auth pages ── */}
      <Route path="/signup" element={<AuthRoute><SignUpPage /></AuthRoute>} />
      <Route path="/login"  element={<AuthRoute><LoginPage /></AuthRoute>} />

      {/* ── Dashboard — root redirects to /dashboard/home ── */}
      <Route path="/dashboard" element={<ProtectedRoute><Navigate to="/dashboard/home" replace /></ProtectedRoute>} />

      {/* ── Dashboard sub-pages ── */}
      <Route path="/dashboard/:section"
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

      {/* ── Market detail ── */}
      <Route path="/dashboard/:section/:questionId"
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    </Routes>
  );
}
