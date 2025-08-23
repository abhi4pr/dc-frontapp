import React, { useState, useContext } from "react";
import { Container, Button, Row, Col, Modal } from "react-bootstrap";
import Loader from "./Loader";
import { FRONT_URL } from "../../constants";
import { UserContext } from "../../contexts/UserContext";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

const Refund = () => {
    const [loading] = useState(false);
    const { user } = useContext(UserContext);

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
        .hero-inner { max-width:1180px; width:100%; grid-template-columns: 1fr 480px; gap:28px; align-items:center; }

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
                            <Link to="/">Home</Link>
                            <span style={{ paddingLeft: 6, paddingRight: 6 }}>•</span>
                            <Link to="/about-us">About us</Link>
                            <span style={{ paddingLeft: 6, paddingRight: 6 }}>•</span>
                            <Link to="/contact-us">Contact us</Link>
                            <span style={{ paddingLeft: 6, paddingRight: 6 }}>•</span>
                            <Link to="/privacy-policy">Privacy Policy</Link>
                            <span style={{ paddingLeft: 6, paddingRight: 6 }}>•</span>
                            <Link to="/refund-policy">Refund Policy</Link>
                        </div>

                        <div style={{ display: "flex", gap: 10, marginLeft: 12 }}>
                            <button
                                className="btn-ghost"
                                onClick={() => navigate("/auth/login")}
                                aria-label="Login"
                            >
                                Login
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
                                Refund us
                            </h1>
                            <p className="subheadline">
                                Refund us content.
                            </p>
                        </div>
                    </Container>
                </section>
            </main>
        </>
    );
};

export default Refund;
