import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Q4Logo } from "../components/icons";
import { useAuth } from "../context/AuthContext";

const GOOGLE_SVG = (
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export default function SignUpPage() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      // Mark as returning user for future visits
      localStorage.setItem("q4_has_signed_in", "1");
      navigate("/dashboard");
    } catch (err) {
      setError("Sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-inner">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <Q4Logo size={32} />
            <span className="text-2xl font-bold text-white" style={{ letterSpacing: "-0.03em" }}>Q4</span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Create your account and start earning.
          </p>
        </div>

        <div className="auth-card">
          <h1 className="mb-2 text-lg font-semibold text-white">Create Account</h1>
          <p className="mb-6 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Sign up instantly with your Google account — no password needed.
          </p>

          {error && (
            <div className="mb-4 rounded-md px-4 py-3 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 py-3 text-sm font-medium transition"
            style={{
              background: loading ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: loading ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          >
            {loading
              ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
              : GOOGLE_SVG
            }
            {loading ? "Creating account…" : "Sign up with Google"}
          </button>

          <p className="mt-5 text-center text-xs leading-5" style={{ color: "rgba(255,255,255,0.3)" }}>
            By continuing you agree to our{" "}
            <Link to="/" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "underline" }}>Terms of Service</Link>
            {" "}and{" "}
            <Link to="/" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "underline" }}>Privacy Policy</Link>.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            <ShieldCheck size={12} strokeWidth={1.8} />
            Your data is secured and never sold.
          </div>
        </div>

        <p className="mt-5 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          Already have an account?{" "}
          <Link to="/login" className="font-medium" style={{ color: "rgba(255,255,255,0.7)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
          >
            Log In
          </Link>
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
