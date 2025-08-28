import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import Breadcrumb from "../../../layouts/AdminLayout/Breadcrumb";
import { API_URL } from "../../../constants";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!name || name.trim().length === 0) {
      toast.error("Name is required.");
      return;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/auth/signup`, {
        email,
        password,
        name,
        phone,
        address,
      });
      toast.success("Successfully Register");
      navigate("/auth/login");
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(
          error.response.data.message || "Invalid email or password."
        );
      } else {
        toast.error("An error occurred during login.");
      }
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Derived UI states (no payload changes)
  const emailInvalid = email !== "" && !/\S+@\S+\.\S+/.test(email);
  const phoneInvalid = phone !== "" && !/^\d{10}$/.test(phone);
  const pwdWeak = password !== "" && password.length < 6;

  // Password strength (UI only; does not block submit)
  const pwdScore = (() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(s, 4);
  })();

  return (
    <>
      <style>{`
        :root{
          /* Premium palette (from your refs): deep navy bg + blue/violet/pink accents */
          --bg-deep:#0b1020;
          --bg-deeper:#0a0f1e;
          --glow-blue: rgba(59,130,246,.28);   /* blue */
          --glow-violet: rgba(139,92,246,.26); /* violet */
          --glow-pink: rgba(236,72,153,.22);   /* pink */
          --text:#e6f1ff;
          --muted:rgba(230,241,255,.68);
          --ink-strong:#dbe9ff;
          --danger:#ff6b6b;

          --glass-1: rgba(255,255,255,.10);
          --glass-2: rgba(255,255,255,.16);
          --glass-3: rgba(255,255,255,.06);
          --glass-4: rgba(255,255,255,.22);
          --blur:18px;

          --radius-card:28px;
          --radius-elm:18px;
          --radius-pill:999px;

          --elev-1: 0 18px 48px rgba(9,14,40,.45);
          --elev-2: 0 8px 24px rgba(9,14,40,.30);

          --cta-grad: linear-gradient(90deg,#22d3ee 0%, #7c3aed 60%, #ec4899 100%);
          --cta-grad-hover: linear-gradient(90deg,#38e0f8 0%, #8b5cf6 55%, #f472b6 100%);
          --field-grad: linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.12));
          --field-grad-focus: linear-gradient(180deg, rgba(255,255,255,.30), rgba(255,255,255,.16));
          --icon-grad: linear-gradient(180deg, rgba(255,255,255,.95), rgba(255,255,255,.75));
        }
        *{box-sizing:border-box}
        html,body,#root{height:100%}
        body{
          margin:0;
          font-family: ui-sans-serif, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: var(--text);
          background:
            radial-gradient(900px 700px at 10% 10%, var(--glow-blue), transparent 60%),
            radial-gradient(800px 800px at 85% 85%, var(--glow-pink), transparent 60%),
            radial-gradient(700px 700px at 80% 10%, var(--glow-violet), transparent 55%),
            linear-gradient(135deg,var(--bg-deep),var(--bg-deeper));
          -webkit-font-smoothing: antialiased;
        }

        .wrap{ min-height:100vh; display:flex; flex-direction:column; }
        .center{ flex:1; display:flex; align-items:center; justify-content:center; padding:40px 16px; }

        .shell{
          width:1080px; max-width:100%;
          display:grid; grid-template-columns: 1.05fr 1fr; gap:28px;
          background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06));
          border:1px solid var(--glass-2);
          border-radius: var(--radius-card);
          backdrop-filter: blur(var(--blur));
          box-shadow: var(--elev-1);
          padding:28px;
        }

        /* Left / brand panel */
        .hero{
          border-radius:22px; position:relative; overflow:hidden;
          background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.06));
          display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px 18px;
          min-height: 460px;
          box-shadow: var(--elev-2);
        }
        .badge{
          position:absolute; top:16px; right:16px;
          padding:8px 12px; border-radius: var(--radius-pill);
          background: rgba(255,255,255,.65); color:#0b1630; font-weight:800; font-size:12px;
        }
        .logo{
          width:96px;height:96px;border-radius:50%;
          background: var(--icon-grad); display:flex; align-items:center; justify-content:center;
          box-shadow: 0 12px 28px rgba(10,14,40,.25);
        }
        .hero h1{ margin:18px 0 6px 0; font-size:22px; color:var(--ink-strong) }
        .hero p{ margin:0 0 6px 0; font-size:13px; color:var(--muted) }
        .trust{ display:flex; gap:10px; align-items:center; margin-top:10px; font-size:12px; color:var(--muted) }

        /* Step indicator */
        .steps{ position:absolute; bottom:16px; left:16px; right:16px; }
        .bar{ height:8px; background:rgba(255,255,255,.18); border-radius:10px; overflow:hidden; }
        .fill{ height:100%; width:100%; background: var(--cta-grad); border-radius:10px; box-shadow: 0 0 18px rgba(124,58,237,.45) inset; }

        /* Right / form column */
        .form{ display:flex; flex-direction:column; gap:16px; padding:4px; }
        .section-title{ font-size:13px; color:var(--muted); margin-left:12px }

        .field{
          display:flex; align-items:center; gap:12px;
          padding:14px 16px;
          border-radius: var(--radius-pill);
          background: var(--field-grad);
          border:1px solid transparent;
          transition: box-shadow .2s ease, border-color .2s ease, transform .06s ease, background .2s ease;
        }
        .field:focus-within{
          border-color: rgba(255,255,255,.5);
          background: var(--field-grad-focus);
          box-shadow: 0 10px 28px rgba(16,30,60,.30);
        }
        .icon{
          width:38px;height:38px;border-radius:50%;
          background: var(--icon-grad);
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 8px 18px rgba(5,15,35,.25);
          flex:0 0 auto;
        }
        input{
          width:100%;
          outline:0; border:0; background:transparent;
          color: var(--text); font-size:15px;
        }
        .helper{ font-size:12px; color:var(--muted); margin-left:14px; margin-top:-6px }
        .helper.error{ color: var(--danger) }

        .row-inline{ display:flex; align-items:center; justify-content:space-between; margin-top:6px; font-size:13px; color:var(--muted) }
        .link{ color:#7dd3fc; text-decoration:none; font-weight:700 }
        .link:hover{ text-decoration:underline }

        /* CTA */
        .btn{
          margin-top:8px;
          padding:14px 18px; border-radius: var(--radius-pill);
          border:0; cursor:pointer; color:white; letter-spacing:1.2px; font-weight:900;
          background: var(--cta-grad);
          box-shadow: 0 16px 36px rgba(16,30,60,.45), 0 0 0 1px rgba(255,255,255,.12) inset;
          transition: transform .08s ease, box-shadow .16s ease, filter .12s ease, background .2s ease;
        }
        .btn:hover{ background: var(--cta-grad-hover) }
        .btn:disabled{ opacity:.72; cursor:not-allowed; filter:grayscale(.15) }
        .btn:active{ transform: translateY(1px) }

        /* Password strength meter */
        .meter{
          height:6px; border-radius:8px; overflow:hidden; background: rgba(255,255,255,.14);
          margin: -2px 14px 0 14px;
        }
        .meter > span{
          display:block; height:100%;
          background: linear-gradient(90deg,#ef4444,#f59e0b,#22c55e);
          width:0%;
          transition: width .25s ease;
        }

        .secure{ display:flex; gap:8px; align-items:center; justify-content:center; margin-top:10px; font-size:12px; color:var(--muted) }

        /* Mobile */
        @media (max-width: 860px){
          .shell{ grid-template-columns:1fr; padding:22px }
          .hero{ min-height:260px; }
          .steps{ position:static; margin-top:14px }
        }

        /* Reduce motion */
        @media (prefers-reduced-motion: reduce){
          .btn, .field, .meter > span{ transition:none }
        }
      `}</style>

      <div className="wrap">
        <Breadcrumb />
        <main className="center" role="main" aria-label="Register as a Doctor">
          <section className="shell" aria-live="polite">
            {/* LEFT — Brand/Trust */}
            <aside className="hero">
              <span className="badge">Early Access</span>
              <div className="logo" aria-hidden="true">
                {/* camera/brand placeholder */}
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M7.5 7.5l1-1h7l1 1h2A2.5 2.5 0 0 1 21 10v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17v-7A2.5 2.5 0 0 1 5.5 7.5h2z"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="12"
                    cy="14"
                    r="3.2"
                    stroke="#8b5cf6"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <h1>Homeopathika™</h1>
              <p>Doctor Onboarding · Encrypted</p>
              <div className="trust">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 11l4 4 8-8"
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Clinically curated · PHI-safe</span>
              </div>

              {/* Step indicator (single step now, extensible later) */}
              <div className="steps" aria-label="Onboarding progress">
                <div className="bar">
                  <div className="fill" style={{ width: "100%" }} />
                </div>
              </div>
            </aside>

            {/* RIGHT — Form */}
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) handleLogin();
              }}
            >
              <div className="section-title">Full Name</div>
              <div className="field" data-testid="name-field">
                <div className="icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="8"
                      r="4"
                      stroke="#7dd3fc"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M4 20c1.8-3.6 6.2-3.6 8-3.6S18.2 16.4 20 20"
                      stroke="#7c3aed"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  aria-label="Name"
                  placeholder="Dr. Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="helper">
                {name.trim() === ""
                  ? "Enter your legal name as it appears on your license."
                  : "Looks good."}
              </div>

              <div className="section-title">Email</div>
              <div
                className="field"
                data-testid="email-field"
                aria-invalid={emailInvalid}
              >
                <div className="icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 7.5l9 6 9-6"
                      stroke="#7dd3fc"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <rect
                      x="3"
                      y="6"
                      width="18"
                      height="12"
                      rx="3"
                      stroke="#8b5cf6"
                      strokeWidth="1.6"
                    />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  aria-label="Email address"
                  placeholder="you@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className={`helper ${emailInvalid ? "error" : ""}`}>
                {emailInvalid
                  ? "Enter a valid email (e.g., name@domain.com)."
                  : "We'll send verification here."}
              </div>

              <div className="section-title">Password</div>
              <div
                className="field"
                data-testid="password-field"
                aria-invalid={pwdWeak}
              >
                <div className="icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="5"
                      y="11"
                      width="14"
                      height="9"
                      rx="2"
                      stroke="#7c3aed"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M8 11V8a4 4 0 118 0v3"
                      stroke="#22d3ee"
                      strokeWidth="1.6"
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  aria-label="Password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    padding: "6px 8px",
                    color: "#c7d2fe",
                    fontWeight: 700,
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="meter" aria-hidden="true">
                <span style={{ width: `${(pwdScore / 4) * 100}%` }} />
              </div>
              <div className={`helper ${pwdWeak ? "error" : ""}`}>
                {pwdWeak
                  ? "Minimum 6 characters."
                  : "Tip: use a long passphrase with numbers & symbols."}
              </div>

              <div className="section-title">Phone (10 digits)</div>
              <div
                className="field"
                data-testid="phone-field"
                aria-invalid={phoneInvalid}
              >
                <div className="icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6.5 3.5l2.5 2.5-1.8 1.8a14 14 0 006.0 6l1.8-1.8 2.5 2.5c.5.5.5 1.3-.1 1.8-1.3 1-2.9 1.7-4.6 1.7C8.6 18 6 15.4 4.0 12.2 2.9 10.4 2.2 8.7 2.1 7.4c-.1-.6.3-1.2.8-1.5l1.6-1.2z"
                      stroke="#7dd3fc"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  aria-label="Phone number"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="numeric"
                  pattern="\\d{10}"
                  autoComplete="tel"
                  required
                />
              </div>
              <div className={`helper ${phoneInvalid ? "error" : ""}`}>
                {phoneInvalid
                  ? "Phone must be exactly 10 digits."
                  : "Used for OTP verification and support."}
              </div>

              <div className="section-title">Clinic Address</div>
              <div className="field" data-testid="address-field">
                <div className="icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 21s7-5.6 7-11.1A7 7 0 105 9.9C5 15.4 12 21 12 21z"
                      stroke="#8b5cf6"
                      strokeWidth="1.6"
                    />
                    <circle
                      cx="12"
                      cy="9.5"
                      r="2.2"
                      stroke="#22d3ee"
                      strokeWidth="1.6"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="address"
                  name="address"
                  aria-label="Clinic address"
                  placeholder="Clinic / Practice address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoComplete="street-address"
                />
              </div>

              <div className="row-inline">
                <span>
                  By continuing you agree to our{" "}
                  <Link className="link" to="/legal/terms">
                    Terms
                  </Link>
                  .
                </span>
              </div>

              <button
                type="submit"
                className="btn"
                onClick={(e) => {
                  e.preventDefault();
                  if (!loading) handleLogin();
                }}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? "SECURING…" : "REGISTER"}
              </button>

              <div className="row-inline" style={{ marginTop: 10 }}>
                <span>Already have an account?</span>
                <Link className="link" to="/auth/login">
                  Login
                </Link>
              </div>

              <div className="secure" aria-live="polite">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 11h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8zM8 11V8a4 4 0 118 0v3"
                    stroke="#7dd3fc"
                    strokeWidth="1.6"
                  />
                </svg>
                <span>Encrypted over TLS · PHI-aware session</span>
              </div>
            </form>
          </section>
        </main>
      </div>
    </>
  );
};

export default Register;
