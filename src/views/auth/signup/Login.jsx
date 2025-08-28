import React, { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import { UserContext } from "../../../contexts/UserContext";
import axios from "axios";
import Breadcrumb from "../../../layouts/AdminLayout/Breadcrumb";
import { API_URL } from "../../../constants";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    // Quick client validation (UI only; payload unchanged)
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Enter a valid email.");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      login(response.data.user);
      toast.success("Login Success");
      navigate("/app/dashboard");
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

  // Derived UI flags
  const emailInvalid = email !== "" && !/\S+@\S+\.\S+/.test(email);
  const pwdWeak = password !== "" && password.length < 6;

  return (
    <>
      <style>{`
        :root{
          --bg-deep:#0b1020;
          --bg-deeper:#0a0f1e;
          --glow-blue: rgba(59,130,246,.28);
          --glow-violet: rgba(139,92,246,.26);
          --glow-pink: rgba(236,72,153,.22);
          --text:#e6f1ff;
          --muted:rgba(230,241,255,.68);
          --ink-strong:#dbe9ff;
          --danger:#ff6b6b;

          --glass-1: rgba(255,255,255,.10);
          --glass-2: rgba(255,255,255,.16);
          --glass-3: rgba(255,255,255,.06);
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
          width:980px; max-width:100%;
          display:grid; grid-template-columns: 1.05fr 1fr; gap:28px;
          background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06));
          border:1px solid var(--glass-2);
          border-radius: var(--radius-card);
          backdrop-filter: blur(var(--blur));
          box-shadow: var(--elev-1);
          padding:28px;
        }

        /* left brand panel */
        .hero{
          border-radius:22px; position:relative; overflow:hidden;
          background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.06));
          display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px 18px;
          min-height: 420px;
          box-shadow: var(--elev-2);
        }
        .badge{
          position:absolute; top:16px; right:16px;
          padding:8px 12px; border-radius: var(--radius-pill);
          background: rgba(255,255,255,.65); color:#0b1630; font-weight:800; font-size:12px;
        }
        .logo{
          width:92px;height:92px;border-radius:50%;
          background: var(--icon-grad); display:flex; align-items:center; justify-content:center;
          box-shadow: 0 12px 28px rgba(10,14,40,.25);
        }
        .hero h1{ margin:18px 0 6px 0; font-size:22px; color:var(--ink-strong) }
        .hero p{ margin:0 0 6px 0; font-size:13px; color:var(--muted) }
        .trust{ display:flex; gap:10px; align-items:center; margin-top:10px; font-size:12px; color:var(--muted) }

        /* right form */
        .form{ display:flex; flex-direction:column; gap:16px; padding:4px; }
        .label{ font-size:13px; color:var(--muted); margin-left:12px }

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

        .secure{ display:flex; gap:8px; align-items:center; justify-content:center; margin-top:10px; font-size:12px; color:var(--muted) }

        /* mobile */
        @media (max-width: 860px){
          .shell{ grid-template-columns:1fr; padding:22px }
          .hero{ min-height:240px; }
        }
        @media (prefers-reduced-motion: reduce){
          .btn, .field{ transition:none }
        }
      `}</style>

      <Breadcrumb />
      <div className="center">
        <section className="shell" aria-live="polite">
          {/* LEFT — Brand/Trust */}
          <aside className="hero" aria-label="Homeopathika login information">
            <span className="badge">Early Access</span>
            <div className="logo" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
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
            <p>Secure Doctor Access</p>
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
          </aside>

          {/* RIGHT — Login Form */}
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!loading) handleLogin();
            }}
            aria-label="Doctor Login"
          >
            <div className="label">Email</div>
            <div
              className="field"
              aria-invalid={emailInvalid}
              data-testid="email-field"
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
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className={`helper ${emailInvalid ? "error" : ""}`}>
              {emailInvalid
                ? "Enter a valid email (e.g., name@domain.com)."
                : "Use your registered email."}
            </div>

            <div className="label">Password</div>
            <div
              className="field"
              aria-invalid={pwdWeak}
              data-testid="password-field"
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
            <div className={`helper ${pwdWeak ? "error" : ""}`}>
              {pwdWeak
                ? "Use at least 6 characters."
                : "Do not share your password with anyone."}
            </div>

            <div className="row-inline">
              <span>
                <Link className="link" to="/auth/forget-password">
                  Forgot password?
                </Link>
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
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  LOGGING IN…
                </>
              ) : (
                "LOGIN"
              )}
            </button>

            <div className="row-inline" style={{ marginTop: 10 }}>
              <span>New to Homeopathika?</span>
              <Link className="link" to="/auth/register">
                Register
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
      </div>
    </>
  );
};

export default Login;
