import React, { useEffect, useState } from "react";
import { Container, Button, Row, Col, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../utility/api";
import { API_URL } from "../../constants";

/**
 * Upgraded Welcome component
 * - Preserves fetchData + API_URL call
 * - Single-file styles with pastel gradients and high-contrast text
 * - Improved hierarchy, accessibility, demo modal, trust signals, and live-case UX
 */

const Welcome = () => {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [showDemo, setShowDemo] = useState(false);

  // keep the exact fetchData function name and API call structure
  const fetchData = async () => {
    try {
      const response = await api.get(`${API_URL}/`);
      // surface basic service health for transparency (non-blocking)
      setHealth(response?.data || { status: "ok" });
    } catch (error) {
      console.error("Error fetching data", error);
      setHealth({ status: "unavailable" });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <style>{`
        :root{
          /* Pastel token set inspired by onboarding-card references but with contrast */
          --page-bg: linear-gradient(180deg, #f7fbff 0%, #fff6fb 100%);
          --hero-grad: linear-gradient(135deg, #a6e3ff 8%, #d3b2ff 48%, #ffd6e0 100%);
          --card-glass: rgba(255,255,255,0.75);
          --muted: #6b7280;
          --text-dark: #071433;
          --accent-primary: linear-gradient(90deg,#6b8bff 0%, #9c6bff 60%);
          --accent-secondary: linear-gradient(90deg,#7be2c7, #06b6a4);
          --radius: 18px;
          --shadow-lg: 0 18px 48px rgba(8,16,40,0.08);
        }

        *{box-sizing:border-box}
        body{ margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; -webkit-font-smoothing:antialiased; background:var(--page-bg); color:var(--text-dark); }

        /* header */
        header.hero-header{
          position:fixed; top:0; left:0; right:0; z-index:120;
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(6px);
          border-bottom: 1px solid rgba(10,25,47,0.04);
        }
        .hero-header .inner { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; gap:12px; }
        .brand { font-weight:800; color:var(--text-dark); letter-spacing:0.3px; font-size:18px; }
        .trust-inline { display:flex; gap:12px; align-items:center; font-size:13px; color:var(--muted); }
        .nav-cta { display:flex; gap:8px; align-items:center; }

        .btn-ghost {
          background:transparent; border:0; color:var(--muted); padding:6px 10px; cursor:pointer; font-weight:700;
        }
        .btn-primary {
          background: var(--accent-primary); background-clip: padding-box; color:white; border:0; padding:10px 14px; border-radius:10px; font-weight:800; cursor:pointer;
          box-shadow: 0 10px 30px rgba(99,102,241,0.12);
        }
        .btn-outline {
          background: white; border:1px solid rgba(16,24,40,0.06); padding:8px 12px; border-radius:10px; cursor:pointer;
        }

        /* hero */
        main { padding-top:84px; }
        .hero {
          min-height: 84vh;
          display:flex; align-items:center; justify-content:center;
          position:relative; overflow:hidden;
          padding:48px 16px;
        }
        .hero .neural-grid{ position:absolute; inset:0; opacity:0.14; background-image: radial-gradient(circle at 10% 10%, rgba(97,145,255,0.08) 0 2px, transparent 2px), radial-gradient(circle at 90% 80%, rgba(255,107,168,0.06) 0 2px, transparent 2px); background-size:120px 120px; pointer-events:none; }
        .hero-inner { max-width:1180px; width:100%; display:grid; grid-template-columns: 1fr 480px; gap:28px; align-items:center; }

        .hero-copy {
          background: linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.84));
          padding:28px; border-radius:18px; box-shadow:var(--shadow-lg);
          border:1px solid rgba(10,20,40,0.04);
        }
        .headline { font-size:28px; margin:0 0 8px 0; font-weight:800; color:var(--text-dark); line-height:1.05; }
        .subheadline { margin:0 0 14px 0; color:var(--muted); font-size:15px; }
        .power-text { margin:8px 0 0 0; font-size:16px; font-weight:700; color:#0a2b3b; }

        .cta-row { margin-top:18px; display:flex; gap:12px; flex-wrap:wrap; }
        .cta-secondary { background: transparent; border:1px solid rgba(10,20,40,0.06); color:var(--text-dark); padding:10px 14px; border-radius:10px; font-weight:700; }

        /* right mock / card */
        .hero-card {
          background: var(--hero-grad);
          border-radius:18px; padding:20px; box-shadow: 0 30px 80px rgba(10,20,40,0.08);
          min-height: 320px; display:flex; flex-direction:column; gap:12px; justify-content:center;
          color: #08203a;
        }
        .hero-card h4{ margin:0; font-size:16px; font-weight:800; color:#06223b; }
        .remedy-list { display:flex; gap:10px; flex-direction:column; margin-top:10px; }
        .remedy {
          display:flex; justify-content:space-between; align-items:center; padding:10px; border-radius:12px; background: rgba(255,255,255,0.85); box-shadow:0 8px 20px rgba(7,17,30,0.04);
        }
        .remedy .left { display:flex; gap:8px; align-items:center; }
        .remedy .pill { font-weight:800; padding:6px 10px; border-radius:999px; background:linear-gradient(90deg,#6b8bff,#9d6bff); color:white; font-size:13px }
        .remedy .score { font-weight:700; color:#0d2b3a; }

        /* proof / features */
        .section { padding:48px 0; }
        .section-glow { background: linear-gradient(180deg, rgba(247,250,255,1), rgba(255,247,251,1)); }
        .proof .case-example { max-width:900px; margin: 18px auto 0; background: white; border-radius:14px; padding:18px; box-shadow: 0 20px 50px rgba(8,16,40,0.06); border:1px solid rgba(10,20,40,0.03); }
        .case-title { font-weight:800; margin-bottom:8px; color:var(--text-dark) }
        .remedy-bullets { margin-left:18px; color: #0b3a4a; }
        .stat-em { font-weight:800; color:#0b3a4a }

        .feature-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:18px; margin-top:22px; }
        .feature-card { padding:18px; border-radius:12px; background:linear-gradient(180deg, #fff, #fff); box-shadow: 0 10px 30px rgba(8,16,40,0.04); border:1px solid rgba(10,20,40,0.03); text-align:center }
        .feature-icon { width:48px; height:48px; display:block; margin:0 auto 10px; color:#6b8bff }

        /* demo placeholder */
        .demo-video { max-width:920px; margin:18px auto; display:flex; justify-content:center; align-items:center; }
        .video-placeholder { width:720px; height:380px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#f6f9ff,#fff6fb); border:1px solid rgba(10,20,40,0.03); box-shadow:0 14px 40px rgba(10,20,40,0.06); cursor:pointer; }
        .video-placeholder svg{ color: #3b82f6 }

        /* responsive */
        @media (max-width: 1000px){
          .hero-inner { grid-template-columns: 1fr; }
          .hero-card { order: -1; margin-bottom: 12px; }
          .feature-grid { grid-template-columns: 1fr; }
          .video-placeholder { width:100%; max-width:720px; height:220px; }
        }

        /* subtle floaters */
        .floating-elements { position: absolute; inset: auto 0 0 0; pointer-events:none; z-index:0; }
        .floating-element {
          position:absolute; width:160px; height:160px; border-radius:20px; filter: blur(36px); opacity:0.22; transform: translateZ(0);
        }
        .floating-element:nth-child(1){ right: 8%; bottom: 8%; background: linear-gradient(90deg,#a6e3ff,#d3b2ff); }
        .floating-element:nth-child(2){ left: 6%; bottom: 16%; width:220px; height:120px; background: linear-gradient(90deg,#ffd6e0,#d3b2ff); opacity:0.18; }
        .floating-element:nth-child(3){ left: 30%; top: 6%; width:200px; height:200px; background: linear-gradient(90deg,#d3b2ff,#a6e3ff); opacity:0.08; }

        /* accessibility focus */
        a:focus, button:focus, input:focus { outline:4px solid rgba(99,102,241,0.12); outline-offset:2px; }

      `}</style>

      <header className="hero-header" role="banner" aria-label="Top navigation">
        <Container className="inner">
          <div className="brand">Homeopathika Clinical AI</div>

          <div
            className="nav-cta"
            role="navigation"
            aria-label="Header actions"
          >
            <div className="trust-inline" aria-hidden="true">
              <span>🏥 Trusted by 500+ Clinics</span>
              <span style={{ paddingLeft: 6, paddingRight: 6 }}>•</span>
              <span>🔒 HIPAA Compliant</span>
              <span style={{ paddingLeft: 6, paddingRight: 6 }}>•</span>
              <span style={{ color: "var(--muted)" }}>
                {health?.status
                  ? health.status === "unavailable"
                    ? "Service unavailable"
                    : "Service OK"
                  : "Checking..."}
              </span>
            </div>

            <div style={{ display: "flex", gap: 10, marginLeft: 12 }}>
              <button
                className="btn-ghost"
                onClick={() => navigate("/auth/login")}
                aria-label="Login"
              >
                Login
              </button>
              <button
                className="btn-primary"
                onClick={() => navigate("/auth/register")}
                aria-label="Start free trial"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </Container>
      </header>

      <main>
        <section className="hero" role="region" aria-label="Main hero">
          <div className="neural-grid" aria-hidden="true" />
          <div className="floating-elements" aria-hidden="true">
            <div className="floating-element" />
            <div className="floating-element" />
            <div className="floating-element" />
          </div>

          <Container
            className="hero-inner"
            role="presentation"
            aria-hidden="false"
          >
            {/* left copy */}
            <div
              className="hero-copy"
              role="article"
              aria-labelledby="hero-headline"
            >
              <h1 id="hero-headline" className="headline">
                You didn't study homeopathy to waste time.
              </h1>
              <p className="subheadline">
                You studied to master patterns. Heal faster. Think deeper.
              </p>
              <p className="power-text">
                Now you have an intelligence that thinks with you.
              </p>

              <div className="cta-row" role="group" aria-label="Hero CTAs">
                <button
                  className="btn-primary"
                  onClick={() => navigate("/auth/register")}
                  aria-label="Start free trial - 7 days"
                >
                  Start Free Trial — 7 Days
                </button>
                <button
                  className="cta-secondary"
                  onClick={() => setShowDemo(true)}
                  aria-label="Watch demo"
                >
                  Watch Demo
                </button>
              </div>

              {/* quick proof micro */}
              <div style={{ marginTop: 18 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: "linear-gradient(90deg,#6b8bff,#9d6bff)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 800,
                    }}
                  >
                    AI
                  </div>
                  <div>
                    <div style={{ fontWeight: 800 }}>90s clinical analysis</div>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>
                      Context-aware suggestions, evidence-backed cross-checks.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* right mock / product card */}
            <aside
              className="hero-card"
              role="complementary"
              aria-label="Sample case result"
            >
              <h4>Sample Case Snapshot</h4>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                Patient summary → top remedy candidates
              </div>

              <div
                className="remedy-list"
                role="list"
                aria-label="Recommended remedies"
              >
                <div className="remedy" role="listitem">
                  <div className="left">
                    <div className="pill">Sepia 200C</div>
                    <div style={{ fontSize: 13 }}>
                      Hormonal pattern & left-sided pain
                    </div>
                  </div>
                  <div className="score">94%</div>
                </div>

                <div className="remedy" role="listitem">
                  <div className="left">
                    <div
                      className="pill"
                      style={{
                        background: "linear-gradient(90deg,#34d399,#06b6a4)",
                      }}
                    >
                      Pulsatilla 30C
                    </div>
                    <div style={{ fontSize: 13 }}>
                      Emotional profile, open-air amelioration
                    </div>
                  </div>
                  <div className="score">87%</div>
                </div>

                <div className="remedy" role="listitem">
                  <div className="left">
                    <div
                      className="pill"
                      style={{
                        background: "linear-gradient(90deg,#f59e0b,#f97316)",
                      }}
                    >
                      Lachesis 1M
                    </div>
                    <div style={{ fontSize: 13 }}>
                      Left-sided pathology, hormonal links
                    </div>
                  </div>
                  <div className="score">82%</div>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/app/dashboard")}
                >
                  Try with your case
                </button>
                <button
                  className="btn-outline"
                  onClick={() => setShowDemo(true)}
                >
                  Quick demo
                </button>
              </div>
            </aside>
          </Container>
        </section>

        {/* Proof / live case */}
        <section
          className="section section-glow proof"
          id="proof"
          role="region"
          aria-label="Live case example"
        >
          <Container>
            <h2
              style={{
                textAlign: "center",
                margin: 0,
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              This is not another tool.
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "var(--muted)",
                marginTop: 8,
              }}
            >
              It's the clinical mind you always wished you had. It sees your
              patient, asks better questions, and whispers:{" "}
              <strong style={{ color: "#0f2b4b" }}>
                "Here's where to look."
              </strong>
            </p>

            <div
              className="case-example"
              role="article"
              aria-label="Case example"
            >
              <div className="case-title">
                Patient: 34F — Chronic Migraines + Hormonal Issues
              </div>

              <p style={{ marginTop: 8 }}>
                <strong>Your input:</strong> "Severe left-sided headaches, worse
                during menses, craves chocolate, weeps easily, feels better in
                open air..."
              </p>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>
                  AI Analysis (90 seconds):
                </div>
                <ul className="remedy-bullets">
                  <li>
                    <strong>Sepia 200C</strong> —{" "}
                    <span style={{ color: "#0f3b4b", fontWeight: 700 }}>
                      94%
                    </span>{" "}
                    match — hormonal pattern & left-sided symptoms
                  </li>
                  <li>
                    <strong>Pulsatilla 30C</strong> —{" "}
                    <span style={{ color: "#0f3b4b", fontWeight: 700 }}>
                      87%
                    </span>{" "}
                    match — emotional profile, open-air amelioration
                  </li>
                  <li>
                    <strong>Lachesis 1M</strong> —{" "}
                    <span style={{ color: "#0f3b4b", fontWeight: 700 }}>
                      82%
                    </span>{" "}
                    match — left-sided pathology, hormonal connection
                  </li>
                </ul>

                <p
                  style={{
                    marginTop: 8,
                    fontStyle: "italic",
                    color: "var(--muted)",
                  }}
                >
                  Traditional lookup time: 15–25 minutes. AI analysis: 90
                  seconds.
                </p>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
                It's not a shortcut — it's a second brain tuned to healing.
              </p>
            </div>
          </Container>
        </section>

        {/* feature grid */}
        <section
          className="section section-dark"
          id="features"
          role="region"
          aria-label="Features"
        >
          <Container>
            <h2
              style={{ textAlign: "center", marginBottom: 6, fontWeight: 900 }}
            >
              Why It Feels Different
            </h2>
            <div
              style={{
                color: "var(--muted)",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Clinical-first design, fast reasoning, and auditable
              recommendations.
            </div>

            <div className="feature-grid" role="list">
              <div className="feature-card" role="listitem">
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                    stroke="#6b8bff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 style={{ marginTop: 6 }}>90-Second Clarity</h3>
                <p style={{ color: "var(--muted)" }}>
                  Open a case — get top candidates with supporting reasoning and
                  references in under 2 minutes.
                </p>
              </div>

              <div className="feature-card" role="listitem">
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                    stroke="#6b8bff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 style={{ marginTop: 6 }}>No More Page-Flipping</h3>
                <p style={{ color: "var(--muted)" }}>
                  We model 500+ remedies and their inter-relations so you don’t
                  lose time hunting references.
                </p>
              </div>

              <div className="feature-card" role="listitem">
                <svg className="feature-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    stroke="#6b8bff"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h3 style={{ marginTop: 6 }}>Pattern Recognition</h3>
                <p style={{ color: "var(--muted)" }}>
                  Think like an experienced clinician — aided by AI that
                  surfaces high-probability patterns.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* demo */}
        <section
          className="section demo-section"
          id="demo"
          role="region"
          aria-label="Demo"
        >
          <Container>
            <h2 style={{ textAlign: "center", marginBottom: 8 }}>
              See It In Action
            </h2>
            <p
              style={{
                textAlign: "center",
                color: "var(--muted)",
                marginBottom: 18,
              }}
            >
              Watch a 2-minute walkthrough of clinical reasoning and remedy
              selection.
            </p>

            <div className="demo-video">
              <div
                className="video-placeholder"
                onClick={() => setShowDemo(true)}
                role="button"
                aria-label="Open demo modal"
              >
                <div style={{ textAlign: "center", color: "var(--muted)" }}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5v14l11-7z" fill="#3b82f6" />
                  </svg>
                  <p style={{ marginTop: 6, fontWeight: 700 }}>
                    Click to Watch Demo
                  </p>
                  <p style={{ marginTop: 6, color: "var(--muted)" }}>
                    3 min overview
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      {/* Demo modal (simple embedded placeholder) */}
      <Modal
        size="lg"
        centered
        show={showDemo}
        onHide={() => setShowDemo(false)}
        aria-label="Demo modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Homeopathika — Product Demo (3 min)</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <div
            style={{
              width: "100%",
              height: 0,
              paddingBottom: "56.25%",
              position: "relative",
            }}
          >
            {/* Placeholder iframe — replace with your hosted demo URL */}
            <iframe
              title="product-demo"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ" /* replace with real link */
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: 0,
                borderRadius: 8,
              }}
              allowFullScreen
            />
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Welcome;
