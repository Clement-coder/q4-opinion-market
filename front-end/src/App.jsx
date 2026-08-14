import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Routes, Route } from "react-router-dom";
import Navbar  from "./components/Header";
import Footer  from "./components/Footer";

import HomePage       from "./pages/HomePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import PollsPage      from "./pages/PollsPage";
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

/** Redirect to /dashboard if already signed in */
function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

/** Redirect to /login if not signed in */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/"             element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/how-it-works" element={<PublicLayout><HowItWorksPage /></PublicLayout>} />
      <Route path="/polls"        element={<PublicLayout><PollsPage /></PublicLayout>} />
      <Route path="/about"        element={<PublicLayout><AboutPage /></PublicLayout>} />
      <Route path="/faq"          element={<PublicLayout><FaqPage /></PublicLayout>} />

      <Route path="/signup"    element={<AuthRoute><SignUpPage /></AuthRoute>} />
      <Route path="/login"     element={<AuthRoute><LoginPage /></AuthRoute>} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    </Routes>
  );
}
