import React, { useEffect } from "react";
import { Container, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../utility/api";
import { API_URL } from "../../constants";

const Welcome = () => {
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await api.get(`${API_URL}/`);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      {/* Background Visuals */}
      <div className="magnetic-field" aria-hidden="true"></div>
      <div className="floating-elements" aria-hidden="true">
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
      </div>

      {/* Header */}
      <header
        role="banner"
        className="bg-dark position-fixed top-0 w-100"
        style={{ zIndex: 100 }}
      >
        <Container className="py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="logo text-primary fw-bold fs-4">Clinical AI</div>
            <div className="d-flex flex-wrap justify-content-center gap-3 mt-2 mt-md-0 text-muted small">
              <span>🏥 Trusted by 500+ Clinics</span>
              <span>🔒 HIPAA Compliant</span>
              <button onClick={() => navigate("/auth/login")}>Login</button>
            </div>
          </div>
        </Container>
      </header>

      <main>
        <section
          className="hero-section d-flex align-items-center text-center"
          style={{ minHeight: "100vh", paddingTop: "120px" }}
        >
          <div className="neural-grid" aria-hidden="true"></div>
          <Container>
            <h1 className="headline mx-auto">
              You didn't study homeopathy to waste time.
            </h1>
            <p className="subheadline mx-auto">
              You studied to master patterns. Heal faster. Think deeper.
            </p>
            <p className="power-text mx-auto">
              Now you have an intelligence that thinks with you.
            </p>
            <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 mt-4">
              <Button href="#pricing" className="cta-primary">
                Start Free Trial - 7 Days
              </Button>
              <Button href="#demo" className="cta-primary cta-secondary">
                Watch Demo
              </Button>
            </div>
          </Container>
        </section>

        <section className="section section-glow" id="proof">
          <Container>
            <h2 className="section-title text-center">
              This is not another tool.
            </h2>
            <p className="section-subtitle text-center">
              It's the clinical mind you always wished you had. It sees your
              patient, asks better questions, and whispers:{" "}
              <span className="text-primary fw-bold">
                "Here's where to look."
              </span>
            </p>
            <div className="proof-section">
              <h3 className="text-primary text-center mb-4 fs-4">
                Live Case Example
              </h3>
              <div className="case-example">
                <div className="case-title">
                  Patient: 34F, Chronic Migraines + Hormonal Issues
                </div>
                <p>
                  <strong>Your Input:</strong> "Severe left-sided headaches,
                  worse during menses, craves chocolate, weeps easily, feels
                  better in open air..."
                </p>
                <p className="mt-3">
                  <strong>AI Analysis (90 seconds):</strong>
                </p>
                <ul className="text-info ps-4">
                  <li>
                    <strong>Sepia 200C</strong> - 94% match (hormonal patterns,
                    left-sided symptoms)
                  </li>
                  <li>
                    <strong>Pulsatilla 30C</strong> - 87% match (emotional
                    profile, open air amelioration)
                  </li>
                  <li>
                    <strong>Lachesis 1M</strong> - 82% match (left-sided
                    pathology, hormonal connection)
                  </li>
                </ul>
                <p>
                  <em>
                    Traditional lookup time: 15-25 minutes. AI analysis: 90
                    seconds.
                  </em>
                </p>
              </div>
            </div>
            <div className="text-center mt-5">
              <p className="fs-5 text-info fst-italic">
                It's not a shortcut. It's a second brain — tuned to healing.
              </p>
            </div>
          </Container>
        </section>

        <section className="section section-dark" id="features">
          <Container>
            <h2 className="section-title text-center">
              Why It Feels Different
            </h2>
            <div className="feature-grid">
              <div className="feature-card">
                <svg
                  className="feature-icon"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="feature-title">90-Second Clarity</h3>
                <p className="feature-text">
                  You open a case. It reads everything. You get your top 3
                  remedies in 90 seconds. You still make the final call — but
                  with 10x more clarity.
                </p>
              </div>
              <div className="feature-card">
                <svg
                  className="feature-icon"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <h3 className="feature-title">No More Page Flipping</h3>
                <p className="feature-text">
                  You don't waste 15 minutes flipping through repertories. The
                  system knows 500+ remedies and their relationships instantly.
                </p>
              </div>
              <div className="feature-card">
                <svg
                  className="feature-icon"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <h3 className="feature-title">Pattern Recognition</h3>
                <p className="feature-text">
                  This isn't clinical software. It's clinical intuition,
                  amplified. It sees patterns at AI speed that took you years to
                  recognize.
                </p>
              </div>
            </div>
          </Container>
        </section>

        <section className="section demo-section" id="demo">
          <Container>
            <h2 className="section-title text-center">See It In Action</h2>
            <p className="section-subtitle text-center">
              Watch how Clinical AI transforms a complex case into clear remedy
              options in under 2 minutes.
            </p>
            <div className="demo-video mx-auto">
              <div className="video-placeholder">
                <div className="text-center">
                  <svg
                    width="80"
                    height="80"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="mb-3"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <p>Click to Watch Demo</p>
                  <p className="fs-6 text-muted mt-2">3 min overview</p>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
};

export default Welcome;
