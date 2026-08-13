import { Routes, Route } from "react-router-dom";
import Navbar  from "./components/Header";
import Footer  from "./components/Footer";

import HomePage       from "./pages/HomePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import QuestionsPage  from "./pages/QuestionsPage";
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

export default function App() {
  return (
    <Routes>
      <Route path="/"            element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/how-it-works"element={<PublicLayout><HowItWorksPage /></PublicLayout>} />
      <Route path="/questions"   element={<PublicLayout><QuestionsPage /></PublicLayout>} />
      <Route path="/about"       element={<PublicLayout><AboutPage /></PublicLayout>} />
      <Route path="/faq"         element={<PublicLayout><FaqPage /></PublicLayout>} />

      <Route path="/signup"    element={<SignUpPage />} />
      <Route path="/login"     element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}
