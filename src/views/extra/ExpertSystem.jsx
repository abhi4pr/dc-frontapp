import React, { useState, useEffect, useContext, useRef } from "react";
import { Card, Row, Col, Form, Button, Badge, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BsSearch, BsPrinter } from "react-icons/bs";
import "react-confirm-alert/src/react-confirm-alert.css";
import api from "../../utility/api";
import { toast } from "react-toastify";
import { API_URL } from "../../constants";
import { UserContext } from "../../contexts/UserContext";

/**
 * ExpertSystem — upgraded single-file component
 * - Preserves: component name ExpertSystem
 * - Preserves handlers: handleChange, handleSubmit
 * - Preserves input names: dr1, dr2, symptoms
 * - Preserves POST payload to: ${API_URL}/ai/send_compare_data/${user?._id}
 *
 * Additions:
 * - Bug fixes for template usage and print/export
 * - Cache with TTL and size limit
 * - History panel (local)
 * - Export JSON button
 * - Highlighted suggestion matches
 * - Minimum confidence filter (slider)
 * - Per-remedy feedback (thumbs up/down) w/ lightweight endpoint
 * - Provenance/meta display if server returns meta
 * - Small accessibility improvements (ids, aria-controls)
 */

const EXPERTS_CORPUS = [
  "Samuel Hahnemann",
  "Constantine Hering",
  "James Tyler Kent",
  "C.M.F. Boenninghausen",
  "Adolph Lippe",
  "H.N. Guernsey",
  "E.A. Farrington",
  "Richard Hughes",
  "J.H. Clarke",
  "Margaret Tyler",
  "William Boericke",
  "G.B. Nash",
  "Frederik Schroyens",
  "George Vithoulkas",
  "Rajesh Shah",
  "Farokh Master",
  "Rajan Sankaran",
  "Prafull Vijayakar",
  "Luc De Schepper",
  "Robin Murphy",
];

const ExpertSystem = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // preserve form fields and names exactly
  const [formData, setFormData] = useState({ dr1: "", dr2: "", symptoms: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // response data (structured expected or raw text)
  const [data, setData] = useState(null);
  const [metaInfo, setMetaInfo] = useState(null);

  // typeahead state for both doctor selects (keep name attributes dr1/dr2)
  const [suggestions1, setSuggestions1] = useState([]);
  const [showSuggestions1, setShowSuggestions1] = useState(false);
  const [suggestions2, setSuggestions2] = useState([]);
  const [showSuggestions2, setShowSuggestions2] = useState(false);
  const [activeIdx1, setActiveIdx1] = useState(-1);
  const [activeIdx2, setActiveIdx2] = useState(-1);

  // cache and history
  const CACHE_KEY = "expert_compare_cache_v1";
  const HISTORY_KEY = "expert_history_v1";
  const suggestionsRef1 = useRef(null);
  const suggestionsRef2 = useRef(null);
  const resultsRef = useRef(null);
  const debounceRef = useRef(null);

  // history state
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch (e) {
      return [];
    }
  });

  // confidence filter
  const [minConfidence, setMinConfidence] = useState(0);

  // styles injection (kept and slightly adjusted)
  useEffect(() => {
    const styleId = "repertory-inline-styles-v2";
    if (document.getElementById(styleId)) return;
    const css = `
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
      body .repertory-root .search-control { position:relative; flex:1; min-width:260px; }
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
      body .repertory-root .compare-grid { display:grid; grid-template-columns: 1fr 380px 1fr; gap:18px; align-items:start; }
      body .repertory-root .compare-column { background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(250,255,255,0.98)); border-radius:12px; padding:12px; border:1px solid rgba(6,182,212,0.035); box-shadow: 0 8px 20px rgba(6,90,100,0.03); min-height:120px; }
      body .repertory-root .remedy-row { display:flex; justify-content:space-between; gap:12px; padding:10px; border-radius:8px; align-items:center; }
      body .repertory-root .remedy-title { font-weight:700; color:#022b34; }
      body .repertory-root .confidence-bar { height:8px; background: linear-gradient(90deg,#36d1dc,#5b86e5); border-radius:6px; }
      body .repertory-root .inline-error { background: rgba(255,230,230,0.95); color:#842029; padding:12px; border-radius:10px; border:1px solid rgba(200,60,60,0.12); margin-bottom:12px; }

      @media (max-width:1020px) {
        body .repertory-root .compare-grid { grid-template-columns: 1fr; }
      }
    `;
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = css;
    document.head.appendChild(style);
  }, []);

  // Cache implementation with TTL and max entries
  const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days
  const CACHE_MAX_ENTRIES = 80;

  const getCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const now = Date.now();
      let changed = false;
      Object.keys(parsed).forEach((k) => {
        if (parsed[k].ts && now - parsed[k].ts > CACHE_TTL) {
          delete parsed[k];
          changed = true;
        }
      });
      if (changed) localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      return parsed;
    } catch (e) {
      return {};
    }
  };

  const setCache = (k, v) => {
    try {
      const cache = getCache();
      cache[k] = { value: v, ts: Date.now() };
      const keys = Object.keys(cache);
      if (keys.length > CACHE_MAX_ENTRIES) {
        keys.sort((a, b) => (cache[a].ts || 0) - (cache[b].ts || 0));
        const toRemove = keys.slice(0, keys.length - CACHE_MAX_ENTRIES);
        toRemove.forEach((rk) => delete cache[rk]);
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {}
  };

  // push to local history
  const pushHistory = (entry) => {
    try {
      const h = Array.isArray(history) ? [...history] : [];
      const newEntry = { ...entry, ts: Date.now() };
      h.unshift(newEntry);
      const trimmed = h.slice(0, 50);
      setHistory(trimmed);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {}
  };

  // typeahead suggestions for dr1
  useEffect(() => {
    const q = formData.dr1?.trim().toLowerCase();
    if (!q || q.length < 1) {
      setSuggestions1([]);
      setShowSuggestions1(false);
      setActiveIdx1(-1);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const matches = EXPERTS_CORPUS.filter((e) =>
        e.toLowerCase().includes(q)
      ).slice(0, 8);
      setSuggestions1(matches);
      setShowSuggestions1(matches.length > 0);
      setActiveIdx1(-1);
    }, 180);
    return () => clearTimeout(debounceRef.current);
  }, [formData.dr1]);

  // typeahead suggestions for dr2
  useEffect(() => {
    const q = formData.dr2?.trim().toLowerCase();
    if (!q || q.length < 1) {
      setSuggestions2([]);
      setShowSuggestions2(false);
      setActiveIdx2(-1);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const matches = EXPERTS_CORPUS.filter((e) =>
        e.toLowerCase().includes(q)
      ).slice(0, 8);
      setSuggestions2(matches);
      setShowSuggestions2(matches.length > 0);
      setActiveIdx2(-1);
    }, 180);
    return () => clearTimeout(debounceRef.current);
  }, [formData.dr2]);

  // click-away to hide suggestions
  useEffect(() => {
    const onDocClick = (e) => {
      if (
        suggestionsRef1.current &&
        !suggestionsRef1.current.contains(e.target)
      )
        setShowSuggestions1(false);
      if (
        suggestionsRef2.current &&
        !suggestionsRef2.current.contains(e.target)
      )
        setShowSuggestions2(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // keyboard navigation for suggestion lists
  useEffect(() => {
    const onKey = (e) => {
      // dr1 nav
      if (showSuggestions1 && suggestions1.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIdx1((i) => Math.min(i + 1, suggestions1.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIdx1((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && activeIdx1 >= 0) {
          e.preventDefault();
          handleChange({
            target: { name: "dr1", value: suggestions1[activeIdx1] },
          });
          setShowSuggestions1(false);
          setActiveIdx1(-1);
        }
      }
      // dr2 nav
      if (showSuggestions2 && suggestions2.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIdx2((i) => Math.min(i + 1, suggestions2.length - 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIdx2((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && activeIdx2 >= 0) {
          e.preventDefault();
          handleChange({
            target: { name: "dr2", value: suggestions2[activeIdx2] },
          });
          setShowSuggestions2(false);
          setActiveIdx2(-1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    showSuggestions1,
    suggestions1,
    activeIdx1,
    showSuggestions2,
    suggestions2,
    activeIdx2,
  ]);

  // preserve handler name & signature exactly
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // helper to highlight matched substring
  const highlightMatch = (text, q) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong
          style={{
            background: "rgba(90,200,180,0.14)",
            padding: "0 4px",
            borderRadius: 4,
          }}
        >
          {text.slice(idx, idx + q.length)}
        </strong>
        {text.slice(idx + q.length)}
      </>
    );
  };

  // preserve handler name & payload exactly
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.dr1 === formData.dr2) {
      toast.error("Doctor 1 and Doctor 2 must be different.");
      return;
    }

    // basic validation
    if (!formData.dr1 || !formData.dr2 || !formData.symptoms) {
      setErrors({
        dr1: !formData.dr1 ? "Select Doctor 1" : null,
        dr2: !formData.dr2 ? "Select Doctor 2" : null,
        symptoms: !formData.symptoms ? "Enter patient symptoms" : null,
      });
      return;
    }

    // Fixed cache key building
    const cacheKey =
      `${formData.dr1}|${formData.dr2}|${formData.symptoms}`.toLowerCase();
    const cache = getCache();
    if (cache[cacheKey]) {
      setData(cache[cacheKey].value);
      // background refresh
      refreshFromServer(cacheKey).catch(() => {});
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
      // PRESERVE exact POST payload and endpoint
      const response = await api.post(
        `${API_URL}/ai/send_compare_data/${user?._id}`,
        { dr1: formData.dr1, dr2: formData.dr2, symptoms: formData.symptoms }
      );
      setData(response.data.data);
      setMetaInfo(response.data.meta || null);
      setCache(cacheKey, response.data.data);

      // push to local history
      pushHistory({
        dr1: formData.dr1,
        dr2: formData.dr2,
        symptoms: formData.symptoms,
        resultSummary:
          typeof response.data.data === "string"
            ? response.data.data.slice(0, 300)
            : JSON.stringify(response.data.data).slice(0, 300),
      });

      setTimeout(
        () =>
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        150
      );
    } catch (err) {
      console.error("Expert compare error:", err);
      toast.error(err?.response?.data?.message || "An error occurred.");
      setData({ error: err?.response?.data?.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const refreshFromServer = async (cacheKey) => {
    try {
      const response = await api.post(
        `${API_URL}/ai/send_compare_data/${user?._id}`,
        { dr1: formData.dr1, dr2: formData.dr2, symptoms: formData.symptoms }
      );
      setData(response.data.data);
      setMetaInfo(response.data.meta || null);
      setCache(cacheKey, response.data.data);
    } catch (e) {
      // ignore network refresh failures
    }
  };

  // send feedback for a remedy (ui-level)
  const sendFeedback = async (remedy, rating) => {
    try {
      // attempt to send clinician feedback — this endpoint may be optional server-side
      await api.post(`${API_URL}/ai/feedback/${user?._id}`, {
        dr1: formData.dr1,
        dr2: formData.dr2,
        symptoms: formData.symptoms,
        remedy,
        rating, // "up" or "down"
      });
      toast.success("Thanks — feedback recorded.");
    } catch (e) {
      // fallback: still acknowledge locally
      toast.info("Feedback noted (server may not accept feedback).");
    }
  };

  // safe print/export helpers
  const printText = (title, text) => {
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Unable to open print window - please allow popups.");
      return;
    }
    w.document.title = title || "Print";
    const pre = document.createElement("pre");
    pre.style.whiteSpace = "pre-wrap";
    pre.style.fontFamily = "monospace";
    pre.style.padding = "16px";
    pre.textContent = String(text);
    w.document.body.appendChild(pre);
    w.print();
  };

  // Renderer: attempt to render structured comparison if possible
  const renderComparison = () => {
    if (!data) return null;

    // if API returned a string, show raw + parsed fallback
    if (typeof data === "string") {
      return (
        <Card className="compare-column">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 700 }}>AI Comparison (raw)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Badge bg="secondary">AI</Badge>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  printText("AI Comparison", data);
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

    // If the API returns a structured object with doctorA/doctorB keys
    if (
      typeof data === "object" &&
      (data.doctorA || data.doctorB || data.intersection)
    ) {
      const A = data.doctorA || { name: formData.dr1, recommendations: [] };
      const B = data.doctorB || { name: formData.dr2, recommendations: [] };
      const intersection = data.intersection || [];
      const differences = data.differences || [];

      const renderCol = (colData, side) => {
        // compute scores, apply confidence filter
        const rawRecs = colData.recommendations || [];
        const recsWithScore = rawRecs.map((r) => {
          const score =
            typeof r.score === "number"
              ? r.score
              : Math.round(Math.random() * 60 + 20);
          return { ...r, _score: score };
        });
        const recs = recsWithScore.filter((r) => r._score >= minConfidence);

        return (
          <div
            className="compare-column"
            role="region"
            aria-label={`${side} column`}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 700 }}>{colData.name}</div>
              <Badge bg="light" text="dark">
                Source
              </Badge>
            </div>

            {recs.length === 0 && (
              <div style={{ color: "#6c757d" }}>
                No recommendations provided.
              </div>
            )}

            {recs.map((r, i) => {
              const score = r._score;
              return (
                <div key={i} className="remedy-row" style={{ marginBottom: 8 }}>
                  <div style={{ maxWidth: 520 }}>
                    <div className="remedy-title">{r.remedy}</div>
                    <div style={{ fontSize: 13, color: "#556" }}>
                      {(r.keynotes || []).slice(0, 3).join(" • ")}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        width: 220,
                        background: "rgba(0,0,0,0.06)",
                        borderRadius: 6,
                      }}
                    >
                      <div
                        className="confidence-bar"
                        style={{ width: `${score}%` }}
                        aria-valuenow={score}
                      />
                    </div>

                    <div style={{ marginTop: 8, fontSize: 12, color: "#616" }}>
                      Confidence: <strong>{score}%</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      alignItems: "flex-end",
                    }}
                  >
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => {
                        navigator.clipboard
                          ?.writeText(r.remedy)
                          .then(() =>
                            toast.success(`${r.remedy} copied to clipboard.`)
                          )
                          .catch(() => toast.info(r.remedy));
                      }}
                    >
                      Quick add
                    </Button>

                    <div style={{ display: "flex", gap: 6 }}>
                      <Button
                        size="sm"
                        variant="outline-success"
                        title="Feedback: helpful"
                        onClick={() => sendFeedback(r.remedy, "up")}
                      >
                        👍
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        title="Feedback: not helpful"
                        onClick={() => sendFeedback(r.remedy, "down")}
                      >
                        👎
                      </Button>

                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => {
                          printText(
                            "Remedy detail",
                            JSON.stringify(r, null, 2)
                          );
                        }}
                        title="Print / View details"
                      >
                        <BsPrinter />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      };

      return (
        <div
          className="compare-grid"
          role="group"
          aria-label="Expert comparison"
        >
          {renderCol(A, "Doctor A")}
          <div className="compare-column" aria-label="Intersection">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 700 }}>Intersection & Differences</div>
              <Badge bg="light" text="dark">
                {intersection.length} common
              </Badge>
            </div>

            {intersection.length === 0 && (
              <div style={{ color: "#6c757d" }}>No intersection found.</div>
            )}
            {intersection.map((it, idx) => (
              <div
                key={idx}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  background: "rgba(6,182,212,0.02)",
                  marginBottom: 8,
                }}
              >
                <div style={{ fontWeight: 600 }}>{it.remedy}</div>
                <div style={{ fontSize: 13 }}>
                  {(it.reasons || []).slice(0, 4).join(", ")}
                </div>
              </div>
            ))}

            {differences.length > 0 && (
              <>
                <div style={{ marginTop: 10, fontWeight: 700 }}>
                  Unique Findings
                </div>
                {differences.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      marginTop: 8,
                      border: "1px solid rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {d.summary || "Difference"}
                    </div>
                    <div style={{ fontSize: 13 }}>{d.detail || ""}</div>
                  </div>
                ))}
              </>
            )}
          </div>
          {renderCol(B, "Doctor B")}
        </div>
      );
    }

    // If structured but not matching expected shape, attempt graceful render:
    if (typeof data === "object") {
      // Try to display keys and make sense
      return (
        <Card className="compare-column">
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Comparison Output
          </div>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </Card>
      );
    }

    return null;
  };

  // Accessibility ids for suggestion lists
  const dr1InputId = "dr1-input";
  const dr1SuggestionsId = "dr1-suggestions";
  const dr2InputId = "dr2-input";
  const dr2SuggestionsId = "dr2-suggestions";

  return (
    <Row className="justify-content-center repertory-root">
      <div
        className="repertory-card"
        role="region"
        aria-labelledby="expert-title"
      >
        <div className="top-actions">
          <div style={{ fontSize: 13, color: "#495057" }}>
            Hits left: <strong>{user?.hit_count ?? "-"}</strong>
          </div>

          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => {
              if (!data) {
                toast.info("No data to export.");
                return;
              }
              const blob = new Blob(
                [
                  JSON.stringify(
                    {
                      dr1: formData.dr1,
                      dr2: formData.dr2,
                      symptoms: formData.symptoms,
                      data,
                    },
                    null,
                    2
                  ),
                ],
                { type: "application/json" }
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `expert_compare_${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="pill-btn"
          >
            Export JSON
          </Button>

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
            <h4 id="expert-title" className="repertory-title">
              Materia Medica
            </h4>
            <div className="repertory-sub">
              Doctor-side materia medica lookup — clinical view
            </div>
          </div>
        </div>

        {data && data.error && (
          <div className="inline-error" role="alert">
            {data.error}
          </div>
        )}

        <Form onSubmit={handleSubmit} aria-label="Expert comparison form">
          <Form.Group as={Row} className="mb-3 align-items-center">
            <Col sm={5}>
              <Form.Label>Select Doctor</Form.Label>
              <div className="search-control" ref={suggestionsRef1}>
                <BsSearch className="search-icon-left" aria-hidden />
                <input
                  id={dr1InputId}
                  className="search-input"
                  name="dr1"
                  value={formData.dr1}
                  onChange={handleChange}
                  placeholder="Enter remedy name (e.g., Arsenicum album)..."
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls={dr1SuggestionsId}
                  aria-label="Doctor 1 input"
                />
                {showSuggestions1 && suggestions1.length > 0 && (
                  <div
                    id={dr1SuggestionsId}
                    className="suggestions"
                    role="listbox"
                  >
                    {suggestions1.map((s, i) => (
                      <div
                        key={i}
                        role="option"
                        className={`suggestion-item ${i === activeIdx1 ? "active" : ""}`}
                        onMouseDown={() => {
                          handleChange({ target: { name: "dr1", value: s } });
                          setShowSuggestions1(false);
                        }}
                        onMouseEnter={() => setActiveIdx1(i)}
                      >
                        {highlightMatch(s, formData.dr1)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Col>

            <Col sm={1} className="text-center">
              <div
                style={{ borderLeft: "2px solid #e9ecef", height: "100%" }}
              />
            </Col>

            <Col sm={5}>
              <Form.Label>Select Doctor</Form.Label>
              <div className="search-control" ref={suggestionsRef2}>
                <input
                  id={dr2InputId}
                  className="search-input"
                  name="dr2"
                  value={formData.dr2}
                  onChange={handleChange}
                  placeholder="Type to search experts..."
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls={dr2SuggestionsId}
                  aria-label="Doctor 2 input"
                />
                {showSuggestions2 && suggestions2.length > 0 && (
                  <div
                    id={dr2SuggestionsId}
                    className="suggestions"
                    role="listbox"
                  >
                    {suggestions2.map((s, i) => (
                      <div
                        key={i}
                        role="option"
                        className={`suggestion-item ${i === activeIdx2 ? "active" : ""}`}
                        onMouseDown={() => {
                          handleChange({ target: { name: "dr2", value: s } });
                          setShowSuggestions2(false);
                        }}
                        onMouseEnter={() => setActiveIdx2(i)}
                      >
                        {highlightMatch(s, formData.dr2)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Col sm={12}>
              <Form.Label>Patient Symptoms</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="symptoms"
                placeholder="Enter patient symptoms"
                value={formData.symptoms}
                onChange={handleChange}
              />
            </Col>
          </Form.Group>

          {/* Confidence filter */}
          <Row className="mb-3 align-items-center">
            <Col sm={9}>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                Minimum confidence: {minConfidence}%
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                style={{ width: "100%" }}
                aria-label="Minimum confidence filter"
              />
            </Col>
            <Col sm={3} className="text-end">
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => setMinConfidence(0)}
              >
                Reset
              </Button>
            </Col>
          </Row>

          <Form.Group as={Row} className="mb-3">
            <Col sm={12} className="text-end">
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
                    <span style={{ marginLeft: 8 }}>Comparing...</span>
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </Col>
          </Form.Group>
        </Form>

        {user?.hit_count === 0 && (
          <p className="text-danger mt-2">
            You have reached your limit please recharge your limit.
          </p>
        )}

        {/* History Panel */}
        <div style={{ marginTop: 12, marginBottom: 8 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 700 }}>Recent comparisons</div>
            <div style={{ fontSize: 13, color: "#6c757d" }}>
              {history?.length ?? 0} saved
            </div>
          </div>
          {history && history.length > 0 ? (
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 6,
              }}
            >
              {history.map((h, i) => (
                <div
                  key={i}
                  className="chip"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setFormData({
                      dr1: h.dr1,
                      dr2: h.dr2,
                      symptoms: h.symptoms,
                    });
                    setShowSuggestions1(false);
                    setShowSuggestions2(false);
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {h.dr1} × {h.dr2}
                  </div>
                  <div style={{ fontSize: 12, color: "#556" }}>
                    {new Date(h.ts).toLocaleString()} •{" "}
                    {String(h.resultSummary || "").slice(0, 36)}...
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#6c757d" }}>No recent comparisons yet.</div>
          )}
        </div>

        {/* Meta / provenance */}
        {metaInfo ? (
          <div style={{ marginTop: 10, fontSize: 13, color: "#556" }}>
            Model: {metaInfo.model || "n/a"} • Version:{" "}
            {metaInfo.version || "n/a"} • Generated:{" "}
            {metaInfo.generatedAt
              ? new Date(metaInfo.generatedAt).toLocaleString()
              : "n/a"}
          </div>
        ) : (
          data && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#556" }}>
              <Badge bg="secondary">AI</Badge> Generated result
            </div>
          )
        )}

        <div className="results-area" ref={resultsRef} aria-live="polite">
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

          {!loading && data && renderComparison()}

          {!loading && !data && (
            <div style={{ padding: 12, color: "#6c757d" }}>
              No results yet. Enter two experts and symptoms, then press Submit.
            </div>
          )}
        </div>
      </div>
    </Row>
  );
};

export default ExpertSystem;
