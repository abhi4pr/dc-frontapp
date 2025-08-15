import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import axios from "axios";
import Breadcrumb from "../../../layouts/AdminLayout/Breadcrumb";
import { API_URL } from "../../../constants";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from query string (preserve original behavior)
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  // Client-side password policy — conservative, can be tuned server-side
  const passwordPolicy = {
    minLength: 8,
    recommendLength: 12,
    requireDigits: true,
    requireSymbols: false,
    requireMixedCase: false,
  };

  const checkPolicy = (pwd = "") => {
    const results = {
      lengthOk: pwd.length >= passwordPolicy.minLength,
      recommended: pwd.length >= passwordPolicy.recommendLength,
      digits: /\d/.test(pwd),
      symbols: /[^A-Za-z0-9]/.test(pwd),
      mixed: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd),
    };
    return results;
  };

  const pwdScore = (pwd = "") => {
    const r = checkPolicy(pwd);
    let s = 0;
    if (r.lengthOk) s++;
    if (r.recommended) s++;
    if (passwordPolicy.requireDigits && r.digits) s++;
    if (passwordPolicy.requireSymbols && r.symbols) s++;
    if (passwordPolicy.requireMixedCase && r.mixed) s++;
    // normalize to 0-100 for meter
    return Math.min(100, Math.round((s / 3) * 100));
  };

  // Keep original handler name and payload shape
  const handleReset = async () => {
    // Minimal client-side guarding to reduce server load and improve UX
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const policy = checkPolicy(newPassword);
    if (!policy.lengthOk) {
      toast.error(
        `Password must be at least ${passwordPolicy.minLength} characters`
      );
      return;
    }
    if (!token) {
      toast.error(
        "Reset token missing. Use the link sent to your email or request a new reset."
      );
      return;
    }

    setLoading(true);
    try {
      // unchanged payload contract
      await axios.post(`${API_URL}/auth/reset_password`, {
        token,
        newPassword,
      });

      toast.success("Password reset successful! Please Re-login.");
      navigate("/auth/login");
    } catch (error) {
      // provide clearer UX for token expiry and other server messages
      const serverMsg = error?.response?.data?.message;
      if (serverMsg) {
        toast.error(serverMsg);
      } else if (
        error?.response?.status === 410 ||
        error?.response?.status === 400
      ) {
        // 410 Gone or bad request often indicates token expiry/invalidity
        toast.error(
          "Reset link expired or invalid. Request a new password reset."
        );
      } else {
        toast.error("Something went wrong");
      }
      console.error("Reset password error:", error);
    } finally {
      setLoading(false);
    }
  };

  const score = pwdScore(newPassword);
  const policy = checkPolicy(newPassword);
  const match =
    newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <>
      <style>{`
        :root{
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

        .meter{
          height:8px; border-radius:8px; background: rgba(255,255,255,.08); overflow:hidden; margin:0 14px;
        }
        .meter > b{
          display:block; height:100%; width:0%; transition: width .22s ease;
          background: linear-gradient(90deg,#ef4444,#f59e0b,#10b981);
        }

        .secure{ display:flex; gap:8px; align-items:center; margin-top:10px; font-size:12px; color:var(--muted) }

        @media (max-width:860px){
          .shell{ grid-template-columns:1fr; padding:18px }
          .hero{ min-height:180px }
        }
      `}</style>

      <div className="wrap">
        <Breadcrumb />
        <main className="center" aria-label="Reset Password">
          <section className="shell" aria-live="polite">
            {/* Left — brand/trust */}
            <aside className="hero" aria-hidden="false">
              <span className="badge">Secure</span>
              <div className="logo" aria-hidden="true">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2C9.8 2 8 3.8 8 6v2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2V6c0-2.2-1.8-4-4-4z"
                    stroke="#3b82f6"
                    strokeWidth="1.4"
                  />
                </svg>
              </div>
              <h2>Homeopathika™</h2>
              <p>Reset your password — Doctor Portal</p>
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
                <span>Encrypted over TLS · Token-based reset</span>
              </div>
            </aside>

            {/* Right — form */}
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!loading) handleReset();
              }}
              aria-label="Reset password form"
            >
              <div className="label">New password</div>
              <div
                className="field"
                aria-invalid={!policy.lengthOk && newPassword !== ""}
              >
                <div className="icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 11h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8z"
                      stroke="#7dd3fc"
                      strokeWidth="1.4"
                    />
                  </svg>
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="Create new password"
                  aria-label="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={
                    showNew ? "Hide new password" : "Show new password"
                  }
                  onClick={() => setShowNew((s) => !s)}
                  style={{
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    padding: "6px 8px",
                    color: "#c7d2fe",
                    fontWeight: 700,
                  }}
                >
                  {showNew ? "Hide" : "Show"}
                </button>
              </div>
              <div
                className={`helper ${!policy.lengthOk && newPassword !== "" ? "error" : ""}`}
              >
                {!policy.lengthOk && newPassword !== ""
                  ? `Minimum ${passwordPolicy.minLength} characters required.`
                  : "Use a strong passphrase. Avoid reusing passwords."}
              </div>

              {/* Strength meter */}
              <div
                className="meter"
                aria-hidden="true"
                title="Password strength"
              >
                <b style={{ width: `${score}%` }} />
              </div>

              <div className="label">Confirm password</div>
              <div
                className="field"
                aria-invalid={confirmPassword !== "" && !match}
              >
                <div className="icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2v6" stroke="#8b5cf6" strokeWidth="1.4" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  aria-label="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={
                    showConfirm
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  onClick={() => setShowConfirm((s) => !s)}
                  style={{
                    background: "transparent",
                    border: 0,
                    cursor: "pointer",
                    padding: "6px 8px",
                    color: "#c7d2fe",
                    fontWeight: 700,
                  }}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
              <div
                className={`helper ${confirmPassword !== "" && !match ? "error" : ""}`}
              >
                {confirmPassword !== "" && !match
                  ? "Passwords do not match."
                  : "Re-enter to confirm."}
              </div>

              {/* If token absent, guide user */}
              {!token && (
                <div className="helper error" role="alert">
                  Reset link token not found. Please request a new reset from
                  the{" "}
                  <Link to="/auth/forget-password" className="link">
                    Forgot Password
                  </Link>{" "}
                  page.
                </div>
              )}

              <button
                type="submit"
                className="btn"
                onClick={(e) => {
                  e.preventDefault();
                  if (!loading) handleReset();
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
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>

              <div style={{ marginTop: 8 }}>
                <Link to="/auth/login" className="link">
                  Back to Sign In
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
                <span>Encrypted over TLS · Token-based reset</span>
              </div>
            </form>
          </section>
        </main>
      </div>
    </>
  );
};

export default ResetPassword;
