import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Q4Logo } from "../components/icons";

/**
 * SignUpPage
 *
 * Auth integration point:
 * Replace handleGoogleSignUp with actual Google OAuth + embedded wallet creation.
 * The flow should be:
 *   1. Google Sign In
 *   2. Account created in Supabase
 *   3. Embedded wallet auto-created on Quai Network
 *   4. Redirect to /dashboard
 */
export default function SignUpPage() {
  const [show, setShow]   = useState(false);
  const [form, setForm]   = useState({ name: "", email: "", password: "" });
  const navigate           = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: replace with real auth + wallet creation
    navigate("/dashboard");
  };

  const handleGoogleSignUp = () => {
    // TODO: trigger Google OAuth flow → embedded wallet → /dashboard
    navigate("/dashboard");
  };

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="auth-bg">
      <div style={{ width: "100%", maxWidth: 420 }}>

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
          <h1 className="mb-5 text-lg font-semibold text-white">Sign Up</h1>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="mb-5 flex w-full items-center justify-center gap-3 py-3 text-sm font-medium transition"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.8)",
              borderRadius: 6,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          >
            {/* Google G */}
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>

          <div className="mb-5 flex items-center gap-3">
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={14} strokeWidth={1.8} className="input-icon" />
                <input type="text" required placeholder="Your name" value={form.name} onChange={update("name")} className="input-field" style={{ paddingLeft: 36 }} />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <Mail size={14} strokeWidth={1.8} className="input-icon" />
                <input type="email" required placeholder="you@example.com" value={form.email} onChange={update("email")} className="input-field" style={{ paddingLeft: 36 }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={14} strokeWidth={1.8} className="input-icon" />
                <input type={show ? "text" : "password"} required placeholder="At least 8 characters" value={form.password} onChange={update("password")} className="input-field" style={{ paddingLeft: 36, paddingRight: 40 }} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 transition" style={{ color: "rgba(255,255,255,0.3)" }} aria-label="Toggle password">
                  {show ? <EyeOff size={14} strokeWidth={1.8} /> : <Eye size={14} strokeWidth={1.8} />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" required className="mt-0.5 shrink-0" style={{ accentColor: "#ffffff" }} />
              <span className="text-xs leading-5" style={{ color: "rgba(255,255,255,0.4)" }}>
                I agree to the{" "}
                <Link to="/" className="underline" style={{ color: "rgba(255,255,255,0.65)" }}>Terms of Service</Link>
                {" "}and{" "}
                <Link to="/" className="underline" style={{ color: "rgba(255,255,255,0.65)" }}>Privacy Policy</Link>.
              </span>
            </label>

            <button type="submit" className="btn-primary mt-1 w-full justify-center">
              Create Account
              <ArrowRight size={14} strokeWidth={2.4} />
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            <ShieldCheck size={12} strokeWidth={1.8} />
            Your data is secured and never sold.
          </div>
        </div>

        <p className="mt-5 text-center text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          Already have an account?{" "}
          <Link to="/login" className="font-medium transition" style={{ color: "rgba(255,255,255,0.7)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#ffffff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
