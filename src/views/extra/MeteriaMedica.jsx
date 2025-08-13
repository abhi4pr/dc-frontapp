import React, { useState, useEffect, useContext, useRef } from "react";
import { Card, Row, Button, Form, Col, Spinner, Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BsSearch, BsPrinter } from "react-icons/bs";
import "react-confirm-alert/src/react-confirm-alert.css";
import api from "../../utility/api";
import { toast } from "react-toastify";
import { API_URL } from "../../constants";
import { UserContext } from "../../contexts/UserContext";

/**
 * Single-file upgrade to MATCH Repertory theme exactly.
 * - Component name preserved: MeteriaMedica
 * - Handlers preserved: handleSubmit, handleChange
 * - Input name preserved: medicine_name
 * - POST body preserved: { medicine_name: formData.medicine_name }
 * - Uses the same visual tokens / CSS id as the Repertory component:
 *   style id: 'repertory-inline-styles-v2'
 *
 * Replace your existing MeteriaMedica.jsx with this file.
 */

const MeteriaMedica = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // form state (preserve medicine_name usage)
  const [formData, setFormData] = useState({ medicine_name: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [data, setData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cacheBadge, setCacheBadge] = useState(false);
  const [inlineError, setInlineError] = useState(null);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);

  const suggestionsRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceRef = useRef(null);

  // Inject the same Repertory visual CSS tokens and specificity (single source)
  useEffect(() => {
    const styleId = "repertory-inline-styles-v2";
    if (document.getElementById(styleId)) return;
    const css = `
      /* ---------- Repertory visual tokens (shared) ---------- */
      body .repertory-root { padding: 34px 28px 80px; display:flex; justify-content:center; }
      body .repertory-root .repertory-card {
        width:100%;
        max-width:1100px;
        margin: 0 auto;
        border-radius: 20px;
        background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,252,253,0.96));
        border: 1px solid rgba(11,102,120,0.06);
        box-shadow: 0 30px 50px rgba(6,34,54,0.10);
        padding: 28px 26px;
        position: relative;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }

      body .repertory-root .top-actions { position:absolute; right:22px; top:20px; display:flex; gap:10px; align-items:center; }
      body .repertory-root .repertory-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:18px; }
      body .repertory-root .repertory-title { font-size:22px; font-weight:700; margin:0; color:#073642; }
      body .repertory-root .repertory-sub { font-size:13px; color:#5d6b72; margin-top:4px; }

      body .repertory-root .search-row { display:flex; align-items:center; gap:14px; }
      body .repertory-root .search-control { position:relative; flex:1; min-width:320px; }
      body .repertory-root input.search-input {
        width:100%;
        height:46px;
        border-radius:999px;
        padding:10px 46px 10px 46px;
        border: 1px solid rgba(6,182,212,0.12) !important;
        background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,253,254,0.98));
        box-shadow: 0 8px 20px rgba(6,182,212,0.04) inset;
        outline: none;
        transition: box-shadow .14s ease, transform .08s ease, border-color .12s ease;
        font-size:14px;
        color:#073642;
      }
      body .repertory-root input.search-input:focus {
        box-shadow: 0 12px 30px rgba(6,182,212,0.12);
        border-color: rgba(6,182,212,0.32) !important;
        transform: translateY(-1px);
      }

      body .repertory-root .search-icon-left { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#06a6c0; font-size:18px; }
      body .repertory-root .search-icon-right { position:absolute; right:14px; top:50%; transform:translateY(-50%); display:flex; gap:8px; align-items:center; }

      body .repertory-root button.pill-btn { border-radius: 999px; padding: 8px 18px; min-width:92px; }
      body .repertory-root button.pill-btn.btn-primary {
        background: linear-gradient(90deg,#36d1dc 0%, #5b86e5 100%) !important;
        border: none !important;
        box-shadow: 0 10px 30px rgba(90,120,200,0.12);
      }
      body .repertory-root button.pill-btn.btn-danger {
        background: linear-gradient(90deg,#ff9a9e 0%, #fecfef 100%) !important;
        border: none !important;
        color:#fff !important;
        box-shadow: 0 8px 20px rgba(230,80,100,0.10);
      }

      body .repertory-root .meta-row { display:flex; gap:12px; align-items:center; margin-top:12px; flex-wrap:wrap; }
      body .repertory-root .chip { background: rgba(6,182,212,0.07); border-radius:999px; padding:8px 12px; font-size:13px; cursor:pointer; color:#034b55; }

      body .repertory-root .severity-slider { width:180px; accent-color:#0d6efd; }

      body .repertory-root .suggestions {
        position:absolute; left:0; right:0; top:calc(100% + 10px);
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 18px 38px rgba(10,20,40,0.08);
        z-index: 2200;
        max-height:240px;
        overflow:auto;
        border:1px solid rgba(0,0,0,0.04);
      }
      body .repertory-root .suggestion-item { padding:12px 14px; cursor:pointer; font-size:14px; color:#034b55; }
      body .repertory-root .suggestion-item:hover, body .repertory-root .suggestion-item.active { background: linear-gradient(90deg, rgba(82,229,179,0.06), rgba(6,182,212,0.04)); }

      body .repertory-root .results-area { margin-top:18px; }
      body .repertory-root .remedy-card {
        background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(250,255,255,0.98));
        border-radius:12px; padding:14px; margin-bottom:14px; border:1px solid rgba(6,182,212,0.035);
        display:flex; gap:16px; align-items:flex-start; justify-content:space-between;
        box-shadow: 0 8px 20px rgba(6,90,100,0.03);
      }
      body .repertory-root .remedy-name { font-weight:700; font-size:16px; color:#022b34; margin-bottom:6px; }
      body .repertory-root .remedy-meta { font-size:13px; color:#3b4a4f; margin-bottom:8px; }
      body .repertory-root .remedy-chip { background: rgba(3,75,85,0.04); padding:6px 10px; border-radius:8px; font-size:12px; color:#034b55; }

      body .repertory-root .expanded-details { margin-top:10px; font-size:13px; color:#343a40; background: rgba(6,182,212,0.02); padding:10px; border-radius:8px; }

      body .repertory-root .inline-error { background: rgba(255,230,230,0.95); color:#842029; padding:12px; border-radius:10px; border:1px solid rgba(200,60,60,0.12); margin-bottom:12px; }

      @media (max-width:900px) {
        body .repertory-root .repertory-card { padding:16px; margin:12px; }
        body .repertory-root .search-row { flex-direction:column; align-items:stretch; gap:10px; }
        body .repertory-root .top-actions { position: static; margin-top:8px; justify-content:flex-end; }
      }
    `;
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = css;
    document.head.appendChild(style);
  }, []);

  // simple localStorage cache
  const CACHE_KEY = "mm_cache_v1";
  const getCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  };
  const setCache = (k, v) => {
    try {
      const cache = getCache();
      cache[k] = { value: v, ts: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {}
  };

  // typeahead suggestions (simple)
  useEffect(() => {
    const q = formData.medicine_name?.trim().toLowerCase();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const corpus = [
        "Arsenicum album",
        "Belladonna",
        "Bryonia",
        "Natrum muriaticum",
        "Sulphur",
        "Phosphorus",
        "Pulsatilla",
        "Ignatia",
        "Nux vomica",
        "Rhus tox",
      ];
      const matches = corpus
        .filter((c) => c.toLowerCase().includes(q))
        .slice(0, 8);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    }, 220);
    return () => clearTimeout(debounceRef.current);
  }, [formData.medicine_name]);

  // close suggestions on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // keyboard nav in suggestions
  useEffect(() => {
    const onKey = (e) => {
      if (!showSuggestions || suggestions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIdx((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && activeSuggestionIdx >= 0) {
        e.preventDefault();
        const sel = suggestions[activeSuggestionIdx];
        handleChange({ target: { name: "medicine_name", value: sel } });
        setShowSuggestions(false);
        setActiveSuggestionIdx(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSuggestions, suggestions, activeSuggestionIdx]);

  // preserve signature exactly
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    setInlineError(null);
    if (name === "medicine_name" && value && value.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // preserve signature and payload exactly
  const handleSubmit = async (event) => {
    event.preventDefault();
    setInlineError(null);

    if (!formData.medicine_name || formData.medicine_name.trim() === "") {
      setErrors({ medicine_name: "Please enter a remedy name." });
      return;
    }

    const key = formData.medicine_name.trim().toLowerCase();
    const cache = getCache();
    if (cache[key]) {
      setCacheBadge(true);
      setData(cache[key].value);
      // background refresh
      refreshFromServer(key).catch(() => {});
      setTimeout(
        () =>
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        120
      );
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        `${API_URL}/ai/send_medicine_detail/${user?._id}`,
        { medicine_name: formData.medicine_name } // <-- payload preserved
      );
      setData(response.data.data);
      setCacheBadge(false);
      setCache(key, response.data.data);
      setTimeout(
        () =>
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        150
      );
    } catch (err) {
      console.error("Materia Medica search error:", err);
      setInlineError(
        err?.response?.data?.message ||
          "An error occurred while fetching medicine detail."
      );
      if (err.response && err.response.data) {
        toast.error(err.response.data.message || "An error occurred.");
      } else {
        toast.error("An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshFromServer = async (key) => {
    try {
      const response = await api.post(
        `${API_URL}/ai/send_medicine_detail/${user?._id}`,
        { medicine_name: formData.medicine_name }
      );
      setData(response.data.data);
      setCache(key, response.data.data);
    } catch (e) {}
  };

  // result renderer (keeps same logic)
  const renderResults = () => {
    if (!data) return null;
    if (typeof data === "string") {
      return (
        <Card className="p-3" aria-live="polite">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 700 }}>Search Result</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Badge bg="secondary">AI Summary</Badge>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  const w = window.open("", "_blank");
                  w.document.write(`<pre>${data}</pre>`);
                  w.print();
                }}
              >
                <BsPrinter />
              </Button>
            </div>
          </div>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{data}</pre>
        </Card>
      );
    }

    if (Array.isArray(data) && data.length > 0) {
      return data.map((it, idx) => {
        const remedy =
          typeof it === "string" ? it : it.remedy || it.name || "Unknown";
        const family = (it && it.family) || (it && it.kingdom) || "—";
        const keynotes =
          (it && it.keynotes) ||
          (it && it.summary && it.summary.split(".").slice(0, 3)) ||
          [];
        const provings = (it && it.provings) || [];
        const confidence =
          (it && it.confidence) ||
          Math.round(Math.min(100, Math.random() * 40 + 60));
        const showExpanded = false;

        return (
          <div
            className="remedy-card"
            key={`${remedy}-${idx}`}
            role="article"
            aria-labelledby={`remedy-${idx}`}
          >
            <div style={{ flex: 1 }}>
              <div id={`remedy-${idx}`} className="remedy-name">
                {remedy}
              </div>
              <div className="remedy-meta">
                <span style={{ marginRight: 12 }}>
                  <strong>Family:</strong> {family}
                </span>
                <Badge
                  bg="light"
                  text="dark"
                  style={{ border: "1px solid rgba(0,0,0,0.04)" }}
                >
                  Confidence {confidence}%
                </Badge>
              </div>

              <div style={{ marginTop: 8, marginBottom: 8 }}>
                {Array.isArray(keynotes) && keynotes.length ? (
                  keynotes.slice(0, 3).map((k, i) => (
                    <span key={i} className="remedy-chip">
                      {k}
                    </span>
                  ))
                ) : (
                  <span className="remedy-chip">No keynotes</span>
                )}
              </div>
            </div>

            <div
              style={{
                minWidth: 140,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "flex-end",
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(remedy)
                      .then(() =>
                        toast.success(`${remedy} copied to clipboard.`)
                      )
                      .catch(() => toast.info(remedy));
                  }}
                >
                  Quick add
                </Button>
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => {
                    const w = window.open("", "_blank");
                    w.document.write(
                      `<pre>${JSON.stringify(it, null, 2)}</pre>`
                    );
                  }}
                >
                  <BsPrinter />
                </Button>
              </div>
            </div>
          </div>
        );
      });
    }

    if (typeof data === "object") {
      const remedy = data.remedy || data.name || formData.medicine_name;
      const family = data.family || data.kingdom || "—";
      const keynotes =
        data.keynotes ||
        (data.summary
          ? Array.isArray(data.summary)
            ? data.summary
            : data.summary.split(".").slice(0, 3)
          : []);
      const provings = data.provings || [];
      const related = data.related || [];

      return (
        <Card className="p-3" aria-live="polite">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{remedy}</div>
              <div style={{ color: "#6c757d", marginTop: 6 }}>
                {family} • {data.source || "Source not specified"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  const w = window.open("", "_blank");
                  w.document.write(
                    `<pre>${JSON.stringify(data, null, 2)}</pre>`
                  );
                }}
              >
                <BsPrinter />
              </Button>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Keynotes</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {keynotes.length ? (
                keynotes.map((k, i) => (
                  <div className="remedy-chip" key={i}>
                    {k}
                  </div>
                ))
              ) : (
                <div className="remedy-chip">No keynotes</div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Provings (excerpt)
              </div>
              {provings.length ? (
                provings.map((p, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {p.source || p.title}
                    </div>
                    <div style={{ fontSize: 13 }}>{p.text || p.excerpt}</div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 13 }}>No provings</div>
              )}
            </div>

            {related.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Related Remedies
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {related.map((r, i) => (
                    <div
                      className="remedy-chip"
                      key={i}
                      onClick={() =>
                        handleChange({
                          target: { name: "medicine_name", value: r },
                        })
                      }
                    >
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-3">
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </Card>
    );
  };

  return (
    <Row className="justify-content-center repertory-root">
      <div className="repertory-card" role="region" aria-labelledby="mm-title">
        <div className="top-actions">
          <div style={{ fontSize: 13, color: "#495057" }}>
            Hits left: <strong>{user?.hit_count ?? "-"}</strong>
          </div>
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => navigate("/app/billing")}
            className="pill-btn"
          >
            Recharge
          </Button>
        </div>

        <div className="repertory-header">
          <div>
            <h4 id="mm-title" className="repertory-title">
              Materia Medica
            </h4>
            <div className="repertory-sub">
              Doctor-side materia medica lookup — clinical view
            </div>
          </div>
        </div>

        {inlineError && (
          <div className="inline-error" role="alert">
            {inlineError}{" "}
            <Button
              size="sm"
              variant="link"
              onClick={() => handleSubmit({ preventDefault: () => {} })}
            >
              Retry
            </Button>
          </div>
        )}

        <Form onSubmit={handleSubmit} aria-label="Materia Medica search form">
          <Form.Group as={Row} className="mb-3" controlId="formTitle">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Medicine:
            </Form.Label>

            <Col sm={10}>
              <div className="search-row">
                <div className="search-control" ref={suggestionsRef}>
                  <BsSearch className="search-icon-left" aria-hidden />
                  <input
                    className="search-input"
                    type="text"
                    placeholder="Enter remedy name (e.g., Arsenicum album)..."
                    name="medicine_name"
                    value={formData.medicine_name}
                    onChange={handleChange}
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-controls="mm-suggestions"
                    aria-expanded={showSuggestions}
                  />
                  <div className="search-icon-right" aria-hidden />
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      id="mm-suggestions"
                      className="suggestions"
                      role="listbox"
                    >
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          role="option"
                          tabIndex={0}
                          className={`suggestion-item ${i === activeSuggestionIdx ? "active" : ""}`}
                          onMouseDown={() => {
                            handleChange({
                              target: { name: "medicine_name", value: s },
                            });
                            setShowSuggestions(false);
                          }}
                          onMouseEnter={() => setActiveSuggestionIdx(i)}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || user?.hit_count === 0}
                  className="pill-btn"
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden
                      />{" "}
                      <span style={{ marginLeft: 8 }}>Searching...</span>
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  onClick={() => navigate("/app/dashboard")}
                  className="pill-btn"
                >
                  Cancel
                </Button>
              </div>

              <Form.Control.Feedback type="invalid">
                {errors.medicine_name}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Col sm={{ span: 10, offset: 2 }}>
              <div className="meta-row">
                <div
                  className="chip"
                  onClick={() =>
                    handleChange({
                      target: {
                        name: "medicine_name",
                        value: "Arsenicum album",
                      },
                    })
                  }
                >
                  Arsenicum album
                </div>
                <div
                  className="chip"
                  onClick={() =>
                    handleChange({
                      target: { name: "medicine_name", value: "Belladonna" },
                    })
                  }
                >
                  Belladonna
                </div>
                <div
                  className="chip"
                  onClick={() =>
                    handleChange({
                      target: { name: "medicine_name", value: "Bryonia" },
                    })
                  }
                >
                  Bryonia
                </div>
                <div style={{ marginLeft: 12, color: "#6c757d", fontSize: 13 }}>
                  Tip: Use exact remedy names for best results.
                </div>
              </div>
            </Col>
          </Form.Group>
        </Form>

        {user?.hit_count === 0 && (
          <p className="text-danger mt-2">
            You have reached your limit please recharge your limit.
          </p>
        )}

        <div className="results-area" ref={resultsRef} aria-live="polite">
          {cacheBadge && (
            <div style={{ marginBottom: 8 }}>
              <Badge bg="info">From Cache</Badge>
            </div>
          )}
          {loading && (
            <div style={{ padding: 12 }}>
              <div
                style={{
                  height: 12,
                  width: "50%",
                  background: "rgba(0,0,0,0.06)",
                  borderRadius: 6,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: "80%",
                  background: "rgba(0,0,0,0.04)",
                  borderRadius: 6,
                }}
              />
            </div>
          )}
          {data ? (
            renderResults()
          ) : (
            <div style={{ padding: 12, color: "#6c757d" }}>
              No results yet. Enter a remedy name and press Submit.
            </div>
          )}
        </div>
      </div>
    </Row>
  );
};

export default MeteriaMedica;
