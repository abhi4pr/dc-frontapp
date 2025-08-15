import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import { UserContext } from "../../../contexts/UserContext";
import axios from "axios";
import Breadcrumb from "../../../layouts/AdminLayout/Breadcrumb";
import { API_URL } from "../../../constants";
import { toast } from "react-toastify";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(UserContext); // kept as in original
  const [loading, setLoading] = useState(false);

  // NOTE: handler name unchanged (must remain as per integration requirements)
  const handleForget = async () => {
    // Minimal client-side validation (non-invasive; keeps payload intact)
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/forget_password`, {
        email,
      });
      // Keep the same success toast text as original to avoid breaking expectations
      toast.success(
        "Email Sent, Please check your email for reset your password"
      );
      // Navigation kept identical to original (integration decision)
      navigate("/app/dashboard");
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error("Email not exist in our database");
      } else {
        toast.error("An error occurred while requesting password reset.");
      }
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const emailInvalid = email !== "" && !/\S+@\S+\.\S+/.test(email);

  return (
    <>
      <style>{`
        :root{
          /* Tokens - consistent with Register/Login premium theme */
          --bg-deep:#0b1020;
          --bg-deeper:#0a0f1e;
          --glow-blue: rgba(59,130,246,.24);
          --glow-violet: rgba(139,92,246,.22);
          --glow-pink: rgba(236,72,153,.18);
          --text:#e6f1ff;
          --muted:rgba(230,241,255,.66);
          --danger:#ff6b6b;

          --glass-1: rgba(255,255,255,.10);
          --glass-2: rgba(255,255,255,.16);
          --blur:16px;
          --radius-card:20px;
          --radius-pill:999px;

          --cta-grad: linear-gradient(90deg,#22d3ee 0%, #7c3aed 60%, #ec4899 100%);
          --field-grad: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.08));
          --field-grad-focus: linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,.14));
        }

        *{box-sizing:border-box}
        html,body,#root{height:100%}
        body{
          margin:0;
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color:var(--text);
          background:
            radial-gradient(900px 700px at 10% 10%, var(--glow-blue), transparent 60%),
            radial-gradient(800px 800px at 85% 85%, var(--glow-pink), transparent 60%),
            radial-gradient(700px 700px at 80% 10%, var(--glow-violet), transparent 55%),
            linear-gradient(135deg,var(--bg-deep),var(--bg-deeper));
          -webkit-font-smoothing:antialiased;
        }

        .wrap{ min-height:100vh; display:flex; flex-direction:column; }
        .center{ flex:1; display:flex; align-items:center; justify-content:center; padding:36px 18px; }

        .shell{
          width:920px; max-width:100%;
          display:grid; grid-template-columns: 1.05fr 1fr; gap:22px;
          background: linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,.05));
          border-radius: var(--radius-card);
          border:1px solid var(--glass-2);
          padding:22px;
          backdrop-filter: blur(var(--blur));
          box-shadow: 0 18px 48px rgba(9,14,40,.40);
        }

        .hero{
          border-radius:16px; position:relative; overflow:hidden;
          background: linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.035));
          display:flex; align-items:center; justify-content:center; flex-direction:column; padding:26px;
          min-height: 240px;
        }
        .badge{ position:absolute; top:12px; right:12px; padding:6px 10px; border-radius:999px; background:rgba(255,255,255,.7); color:#071428; font-weight:800; font-size:12px;}
        .logo{ width:84px; height:84px; border-radius:50%; background:linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.74)); display:flex; align-items:center; justify-content:center; box-shadow: 0 12px 28px rgba(10,14,40,.25) }
        .hero h2{ margin:14px 0 6px 0; color:var(--text); font-size:20px }
        .hero p{ margin:0; color:var(--muted); font-size:13px }

        .form{ display:flex; flex-direction:column; gap:12px; }

        .label{ font-size:13px; color:var(--muted); margin-left:8px; }

        .field{
          display:flex; align-items:center; gap:12px;
          padding:12px 14px; border-radius: var(--radius-pill);
          background: var(--field-grad);
          border:1px solid transparent;
          transition: background .16s ease, box-shadow .16s ease, border-color .12s ease;
        }
        .field:focus-within{ background: var(--field-grad-focus); border-color: rgba(255,255,255,.5); box-shadow: 0 8px 26px rgba(10,18,40,.22) }
        .icon{ width:36px; height:36px; border-radius:50%; background:linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.72)); display:flex; align-items:center; justify-content:center; box-shadow: 0 8px 18px rgba(5,15,35,.18); }
        input{ border:0; outline:0; background:transparent; color:var(--text); font-size:15px; width:100% }

        .helper{ font-size:12px; color:var(--muted); margin-left:14px; margin-top:-6px }
        .helper.error{ color: var(--danger) }

        .btn{
          margin-top:8px; padding:12px 16px; border-radius:999px; border:0; cursor:pointer; color:#041021; font-weight:900;
          background: var(--cta-grad); box-shadow: 0 14px 34px rgba(10,18,40,.36); transition: transform .08s ease, filter .12s ease;
        }
        .btn:disabled{ opacity:.76; cursor:not-allowed }
        .link{ color:#7dd3fc; font-weight:700; text-decoration:none }
        .link:hover{ text-decoration:underline }

        .secure{ display:flex; gap:8px; align-items:center; margin-top:10px; font-size:12px; color:var(--muted) }

        @media (max-width:860px){
          .shell{ grid-template-columns:1fr; padding:18px }
          .hero{ min-height:180px }
        }
      `}</style>

      <div className="wrap">
        <Breadcrumb />
        <main className="center" aria-label="Forget Password">
          <section className="shell" aria-live="polite">
            {/* Left — brand/trust block */}
            <aside className="hero" aria-hidden="false">
              <span className="badge">Early Access</span>
              <div className="logo" aria-hidden="true">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M7.5 7.5l1-1h7l1 1h2A2.5 2.5 0 0 1 21 10v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17v-7A2.5 2.5 0 0 1 5.5 7.5h2z"
                    stroke="#3b82f6"
                    strokeWidth="1.4"
                  />
                  <circle
                    cx="12"
                    cy="14"
                    r="3.2"
                    stroke="#8b5cf6"
                    strokeWidth="1.4"
                  />
                </svg>
              </div>
              <h2>Homeopathika™</h2>
              <p>Password recovery — Doctor Portal</p>
              <div className="secure" aria-hidden="true">
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
                <span>Encrypted · PHI-aware</span>
              </div>
            </aside>

            {/* Right — form */}
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) handleForget();
              }}
              aria-label="Forget password form"
            >
              <div className="label">Registered Email</div>

              <div
                className="field"
                data-testid="email-field"
                aria-invalid={emailInvalid}
              >
                <div className="icon" aria-hidden="true">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
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
                  placeholder="Email address"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className={`helper ${emailInvalid ? "error" : ""}`}>
                {emailInvalid
                  ? "Enter a valid email address."
                  : "We'll send a secure password reset link to this email."}
              </div>

              <button
                type="submit"
                className="btn"
                onClick={(e) => {
                  e.preventDefault();
                  if (!loading) handleForget();
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
                    Checking in...
                  </>
                ) : (
                  "Get Password"
                )}
              </button>

              <div style={{ marginTop: 8 }}>
                <Link to="/auth/register" className="link">
                  Register
                </Link>
                <span style={{ margin: "0 8px", color: "var(--muted)" }}>
                  |
                </span>
                <Link to="/auth/login" className="link">
                  Signin
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

export default ForgetPassword;
