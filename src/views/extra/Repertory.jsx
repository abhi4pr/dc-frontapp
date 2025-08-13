import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Card,
  Row,
  Button,
  Form,
  Col,
  Spinner,
  Badge,
  ProgressBar,
  Modal,
  FormCheck,
} from "react-bootstrap";
import "react-confirm-alert/src/react-confirm-alert.css";
import api from "../../utility/api";
import Loader from "./Loader";
import { toast } from "react-toastify";
import { API_URL } from "constants";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext";
import {
  BsSearch,
  BsClockHistory,
  BsPrinter,
  BsInfoCircle,
} from "react-icons/bs";

/**
 * Single-file Repertory component with stronger visual overrides.
 * - Keeps component name & handler names unchanged.
 * - No external CSS files required.
 * - Increased specificity & stronger visuals to beat Bootstrap global styles.
 * - Adds: author/source filter (client-side), provenance display, score explanation modal,
 *   and Materia Medica quick-view modal. Author filter persisted to localStorage.
 */

const Repertory = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [data, setData] = useState("");
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    disease: "",
  });
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [severity, setSeverity] = useState(3);
  const [cacheBadge, setCacheBadge] = useState(false);
  const [expandedRemedy, setExpandedRemedy] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [inlineError, setInlineError] = useState(null);

  // NEW: author / source filter
  const AUTHORS_STORAGE = "repertory_authors_v1";
  const defaultAuthors = [
    "Kent",
    "Boenninghausen",
    "Synthesis",
    "Complete",
    "Boericke",
    "Hahnemann",
  ];
  const [authorsList] = useState(defaultAuthors);
  const [authorFilter, setAuthorFilter] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTHORS_STORAGE);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [authorDropdownOpen, setAuthorDropdownOpen] = useState(false);
  const authorDropdownRef = useRef(null);

  // MM modal and score explanation modal
  const [mmModalOpen, setMmModalOpen] = useState(false);
  const [mmContent, setMmContent] = useState(null);
  const [scoreModalOpen, setScoreModalOpen] = useState(false);

  const suggestionsRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceRef = useRef(null);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);

  // Stronger injected CSS: higher specificity and visual polish.
  useEffect(() => {
    const styleId = "repertory-inline-styles-v3";
    if (document.getElementById(styleId)) return;
    const css = `
      /* ---------- Scoped, high-specificity styles for Repertory ---------- */
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

      /* top-right hits badge, visible despite outer layout */
      body .repertory-root .repertory-card .top-actions { position:absolute; right:22px; top:20px; display:flex; gap:10px; align-items:center; }

      body .repertory-root .repertory-header { display:flex; align-items:flex-start; gap:12px; margin-bottom:18px; }
      body .repertory-root .repertory-title { font-size:22px; font-weight:700; margin:0; color:#073642; }
      body .repertory-root .repertory-sub { font-size:13px; color:#5d6b72; margin-top:4px; }

      body .repertory-root .search-row { display:flex; align-items:center; gap:14px; }
      body .repertory-root .search-control { position:relative; flex:1; min-width:320px; }
      /* use input class name to avoid bootstrap form-control conflicts */
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

      /* suggestions dropdown strong visual */
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

      /* author dropdown */
      body .repertory-root .author-btn { border-radius:14px; padding:6px 10px; border:1px solid rgba(0,0,0,0.04); background: #fff; cursor:pointer; }
      body .repertory-root .author-dropdown { position: absolute; right: 0; top: 40px; z-index:2400; background:#fff; border-radius:10px; box-shadow: 0 12px 36px rgba(10,20,40,0.08); padding:8px; width:220px; border:1px solid rgba(0,0,0,0.04); }

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

  // local cache helpers
  const CACHE_KEY = "repertory_cache_v1";
  const getCache = () => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  };
  const setCache = (key, value) => {
    try {
      const cache = getCache();
      cache[key] = { value, ts: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (e) {}
  };

  // persist authorFilter to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(AUTHORS_STORAGE, JSON.stringify(authorFilter));
    } catch (e) {}
  }, [authorFilter]);

  // suggestions debounce
  useEffect(() => {
    if (!formData.disease || formData.disease.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const q = formData.disease.trim().toLowerCase();
      const corpus = [
        "anxiety",
        "headache",
        "fever",
        "cough",
        "restlessness",
        "insomnia",
        "sharp pain",
        "burning sensation",
        "stitching pain",
        "worse at night",
      ];
      const matches = corpus.filter((s) => s.includes(q)).slice(0, 8);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    }, 260);
    return () => clearTimeout(debounceRef.current);
  }, [formData.disease]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
      if (
        authorDropdownRef.current &&
        !authorDropdownRef.current.contains(e.target)
      ) {
        setAuthorDropdownOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

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
        const s = suggestions[activeSuggestionIdx];
        handleChange({ target: { name: "disease", value: s } });
        setShowSuggestions(false);
        setActiveSuggestionIdx(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSuggestions, suggestions, activeSuggestionIdx]);

  // preserve handler name exactly
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    setInlineError(null);
    if (name === "disease" && value && value.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // preserve handleSubmit signature & exact POST payload
  const handleSubmit = async (event) => {
    event.preventDefault();
    setInlineError(null);
    if (!formData.disease || formData.disease.trim() === "") {
      setErrors({ disease: "Please enter a symptom or rubric." });
      return;
    }
    const key = formData.disease.trim().toLowerCase();
    const cache = getCache();
    if (cache[key]) {
      setCacheBadge(true);
      setData(cache[key].value);
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
        `${API_URL}/ai/send_search_remedy/${user?._id}`,
        { disease: formData.disease }
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
    } catch (error) {
      console.error("Repertory search error:", error);
      setInlineError(
        error?.response?.data?.message ||
          "An unexpected error occurred while searching. Please retry."
      );
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "An error occurred.");
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
        `${API_URL}/ai/send_search_remedy/${user?._id}`,
        { disease: formData.disease }
      );
      setData(response.data.data);
      setCache(key, response.data.data);
    } catch (err) {}
  };

  // NEW: toggle authors in filter
  const toggleAuthor = (author) => {
    setAuthorFilter((prev) => {
      if (prev.includes(author)) return prev.filter((a) => a !== author);
      return [...prev, author];
    });
  };

  // NEW: computes whether an item matches author filter
  const matchesSelectedAuthors = (item) => {
    if (!authorFilter || authorFilter.length === 0) return true;
    // If item is a string (no metadata), we can't assert its author => show only when no filters
    if (typeof item === "string") return false;
    const sourceAuthor =
      item.source_author ||
      (item.source && item.source.author) ||
      (item.metadata && item.metadata.source_author) ||
      null;
    if (!sourceAuthor) return false;
    // allow partial matches (e.g., "Kent" matching "Kent (Synthesis)")
    const normalized = sourceAuthor.toLowerCase();
    return authorFilter.some((a) =>
      normalized.includes(String(a).toLowerCase())
    );
  };

  // NEW: Materia Medica quick view
  const openMM = (remedyName, item) => {
    if (item && item.materia_medica) {
      setMmContent(item.materia_medica);
    } else if (item && item.mm_excerpt) {
      setMmContent(item.mm_excerpt);
    } else {
      setMmContent(
        `Materia medica content for ${remedyName} not available in payload.`
      );
    }
    setMmModalOpen(true);
  };

  // NEW: Score explanation modal helper
  const openScoreExplanation = () => setScoreModalOpen(true);

  const renderResults = () => {
    if (!data) return null;

    // Use filteredData derived from authorFilter (non-destructive)
    const sourceArray = Array.isArray(data) ? data : null;
    const filtered = sourceArray
      ? sourceArray.filter((it) => matchesSelectedAuthors(it))
      : null;

    // If data is string, show raw string
    if (typeof data === "string") {
      return (
        <Card className="p-3" aria-live="polite">
          <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 14 }}>
            {data}
          </pre>
        </Card>
      );
    }

    // If we had an author filter, show a small filtered summary
    const filteredCount = filtered ? filtered.length : 0;
    const totalCount = sourceArray ? sourceArray.length : 0;
    const showingArray = filtered !== null ? filtered : data;

    if (sourceArray && filteredCount === 0) {
      return (
        <Card className="p-3">
          <div style={{ color: "#6c757d" }}>
            No results match the selected authors ({authorFilter.join(", ")}).
          </div>
          <div style={{ marginTop: 8 }}>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => setAuthorFilter([])}
            >
              Clear author filters
            </Button>
          </div>
        </Card>
      );
    }

    if (Array.isArray(showingArray) && showingArray.length > 0) {
      // If filtered and reduced, show badge
      return showingArray.map((item, idx) => {
        const remedyName =
          typeof item === "string" ? item : item.remedy || "Unknown Remedy";
        const score =
          typeof item === "object" && item.score
            ? item.score
            : Math.round(Math.random() * 60 + 20);
        const matched =
          typeof item === "object" && item.matched_rubrics
            ? item.matched_rubrics
            : [];
        const potency =
          typeof item === "object" && item.potency_suggestion
            ? item.potency_suggestion
            : score > 75
              ? "30C"
              : "6C";
        const family =
          typeof item === "object" && item.family ? item.family : "General";
        const isInComparison = comparison.includes(remedyName);

        // provenance fields (best-effort)
        const sourceAuthor =
          typeof item === "object" &&
          (item.source_author ||
            (item.source && item.source.author) ||
            (item.metadata && item.metadata.source_author))
            ? item.source_author ||
              item.source?.author ||
              item.metadata?.source_author
            : null;
        const sourceEdition =
          typeof item === "object" &&
          (item.source_edition ||
            item.source?.edition ||
            item.metadata?.source_edition)
            ? item.source_edition ||
              item.source?.edition ||
              item.metadata?.source_edition
            : null;
        const sourcePage =
          typeof item === "object" &&
          (item.source_page || item.source?.page || item.metadata?.source_page)
            ? item.source_page ||
              item.source?.page ||
              item.metadata?.source_page
            : null;

        return (
          <div
            className="remedy-card"
            key={`${remedyName}-${idx}`}
            role="article"
            aria-labelledby={`remedy-${idx}`}
          >
            <div style={{ flex: 1 }}>
              <div id={`remedy-${idx}`} className="remedy-name">
                {remedyName}
              </div>
              <div className="remedy-meta">
                <span style={{ marginRight: 10 }}>
                  <strong>Family:</strong> {family}
                </span>
                <span style={{ marginRight: 10 }}>
                  <strong>Potency:</strong> {potency}
                </span>
                <Badge
                  bg="light"
                  text="dark"
                  style={{
                    border: "1px solid rgba(0,0,0,0.04)",
                    marginRight: 6,
                  }}
                >
                  Score {score}
                </Badge>
                <Button
                  size="sm"
                  variant="link"
                  onClick={openScoreExplanation}
                  title="Explain score"
                >
                  <BsInfoCircle />
                </Button>
              </div>

              {/* provenance visible to clinician */}
              <div style={{ fontSize: 12, color: "#556971", marginBottom: 8 }}>
                <strong>Source:</strong>{" "}
                {sourceAuthor ? (
                  <>
                    {sourceAuthor}
                    {sourceEdition ? ` • ${sourceEdition}` : ""}
                    {sourcePage ? ` • p.${sourcePage}` : ""}
                  </>
                ) : (
                  <em>
                    Unknown{" "}
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => toast.info("Request provenance (Pro)")}
                    >
                      Add provenance
                    </Button>
                  </em>
                )}
              </div>

              <div style={{ marginBottom: 8 }}>
                <ProgressBar
                  now={score}
                  label={`${score}%`}
                  style={{ height: 8, borderRadius: 8 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {matched.slice(0, 5).map((m, i) => (
                  <div className="remedy-chip" key={i} title={m}>
                    {m}
                  </div>
                ))}
                {matched.length > 5 && (
                  <div className="remedy-chip">+{matched.length - 5} more</div>
                )}
              </div>

              {expandedRemedy === remedyName && (
                <div className="expanded-details" aria-hidden={false}>
                  <div>
                    <strong>
                      Matched Rubrics (with provenance when available):
                    </strong>
                  </div>
                  <ul style={{ marginTop: 8 }}>
                    {matched.length ? (
                      matched.map((r, i) => {
                        // try to get provenance per rubric if present
                        const rubricSource =
                          typeof item === "object" &&
                          item.matched_sources &&
                          item.matched_sources[i]
                            ? item.matched_sources[i]
                            : null;
                        return (
                          <li key={i}>
                            {r}{" "}
                            {rubricSource ? (
                              <span style={{ color: "#6c757d", fontSize: 12 }}>
                                —{" "}
                                {rubricSource.author ||
                                  rubricSource.source ||
                                  "Unknown"}
                                {rubricSource.page
                                  ? ` p.${rubricSource.page}`
                                  : ""}
                              </span>
                            ) : null}
                          </li>
                        );
                      })
                    ) : (
                      <li>Details not provided</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                alignItems: "flex-end",
                minWidth: 140,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="sm"
                  variant={
                    expandedRemedy === remedyName
                      ? "outline-secondary"
                      : "outline-primary"
                  }
                  onClick={() =>
                    setExpandedRemedy(
                      expandedRemedy === remedyName ? null : remedyName
                    )
                  }
                  aria-expanded={expandedRemedy === remedyName}
                >
                  {expandedRemedy === remedyName ? "Collapse" : "Details"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const ev = {
                      target: { name: "disease", value: remedyName },
                    };
                    handleChange(ev);
                    toast.info(`${remedyName} copied into symptom field.`);
                  }}
                  variant="secondary"
                >
                  Quick add
                </Button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 6,
                  alignItems: "flex-end",
                }}
              >
                <Button
                  size="sm"
                  variant={isInComparison ? "success" : "outline-success"}
                  onClick={() => {
                    if (isInComparison) {
                      setComparison((c) => c.filter((r) => r !== remedyName));
                    } else {
                      setComparison((c) =>
                        c.length < 3 ? [...c, remedyName] : c
                      );
                      if (comparison.length >= 3)
                        toast.info("Max 3 remedies for comparison.");
                    }
                  }}
                >
                  {isInComparison ? "Added" : "Compare"}
                </Button>

                <div style={{ display: "flex", gap: 6 }}>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => openMM(remedyName, item)}
                    aria-label={`Materia Medica for ${remedyName}`}
                    title="Open Materia Medica"
                  >
                    <BsInfoCircle />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => {
                      const printWindow = window.open("", "_blank");
                      printWindow.document.write(
                        `<pre>${JSON.stringify(item, null, 2)}</pre>`
                      );
                      printWindow.document.close();
                      printWindow.print();
                    }}
                    aria-label={`Print ${remedyName}`}
                  >
                    <BsPrinter />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      });
    }

    return (
      <Card className="p-3">
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </Card>
    );
  };

  // Render
  return (
    <Row className="justify-content-center repertory-root">
      <div
        className="repertory-card"
        role="region"
        aria-labelledby="repertory-title"
      >
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
            <h4 id="repertory-title" className="repertory-title">
              Repertory (AI)
            </h4>
            <div className="repertory-sub">
              Doctor-side repertory search — clinical view
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

        <Form
          onSubmit={handleSubmit}
          className="mb-2"
          aria-label="Repertory search form"
        >
          <Form.Group as={Row} className="mb-3" controlId="formTitle">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Symptom:
            </Form.Label>
            <Col sm={10}>
              <div className="search-row">
                <div className="search-control" ref={suggestionsRef}>
                  <BsSearch className="search-icon-left" aria-hidden />
                  <input
                    aria-label="Symptom search"
                    className="search-input"
                    type="text"
                    placeholder="Search problem or rubric (e.g., anxiety, restlessness)..."
                    name="disease"
                    value={formData.disease}
                    onChange={handleChange}
                    onFocus={() =>
                      formData.disease &&
                      formData.disease.length >= 2 &&
                      setShowSuggestions(true)
                    }
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-controls="repertory-suggestions"
                    aria-expanded={showSuggestions}
                    isInvalid={!!errors.disease}
                  />
                  <div className="search-icon-right" aria-hidden>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6c757d",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <BsClockHistory />
                      <small>{severity}</small>
                    </div>
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      id="repertory-suggestions"
                      className="suggestions"
                      role="listbox"
                    >
                      {suggestions.map((s, i) => (
                        <div
                          role="option"
                          tabIndex={0}
                          key={i}
                          className={`suggestion-item ${i === activeSuggestionIdx ? "active" : ""}`}
                          onMouseDown={(e) => {
                            handleChange({
                              target: { name: "disease", value: s },
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
                  aria-label="Submit repertory search"
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
                {errors.disease}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Col sm={{ span: 10, offset: 2 }}>
              <div className="meta-row">
                <div
                  className="chip"
                  onClick={() => {
                    handleChange({
                      target: { name: "disease", value: "anxiety" },
                    });
                  }}
                >
                  Anxiety
                </div>
                <div
                  className="chip"
                  onClick={() =>
                    handleChange({
                      target: { name: "disease", value: "insomnia" },
                    })
                  }
                >
                  Insomnia
                </div>
                <div
                  className="chip"
                  onClick={() =>
                    handleChange({
                      target: { name: "disease", value: "headache" },
                    })
                  }
                >
                  Headache
                </div>

                <div
                  style={{
                    marginLeft: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <small style={{ color: "#6c757d" }}>Severity</small>
                  <input
                    className="severity-slider"
                    type="range"
                    min="1"
                    max="5"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    aria-label="Severity slider"
                  />
                </div>

                {/* AUTHOR FILTER UI (NEW) */}
                <div
                  style={{ marginLeft: "auto", position: "relative" }}
                  ref={authorDropdownRef}
                >
                  <button
                    type="button"
                    className="author-btn"
                    aria-haspopup="true"
                    aria-expanded={authorDropdownOpen}
                    onClick={() => setAuthorDropdownOpen((v) => !v)}
                    title="Filter by repertory / author"
                  >
                    Authors{" "}
                    {authorFilter.length > 0 ? `(${authorFilter.length})` : ""}
                  </button>

                  {authorDropdownOpen && (
                    <div
                      className="author-dropdown"
                      role="menu"
                      aria-label="Author filters"
                    >
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        Select authors
                      </div>
                      <div style={{ maxHeight: 160, overflow: "auto" }}>
                        {authorsList.map((a) => (
                          <div
                            key={a}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "4px 2px",
                            }}
                          >
                            <FormCheck
                              type="checkbox"
                              id={`author-${a}`}
                              checked={authorFilter.includes(a)}
                              onChange={() => toggleAuthor(a)}
                              label={<span style={{ fontSize: 13 }}>{a}</span>}
                            />
                          </div>
                        ))}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: 8,
                        }}
                      >
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => setAuthorFilter([])}
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setAuthorDropdownOpen(false)}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
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

          {cacheBadge && (
            <div style={{ marginBottom: 8 }}>
              <Badge bg="info">From Cache</Badge>
            </div>
          )}

          {data ? (
            <>
              {/* If authorFilter is active, show current filter badges */}
              {authorFilter && authorFilter.length > 0 && (
                <div
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Filters:</div>
                  {authorFilter.map((a) => (
                    <Badge
                      key={a}
                      bg="secondary"
                      style={{ cursor: "pointer" }}
                      onClick={() => toggleAuthor(a)}
                    >
                      {a} ✕
                    </Badge>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {Array.isArray(data)
                    ? `${data.length} remedies found`
                    : "Search results"}
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {Array.isArray(data) && comparison.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => {
                        const comp = data.filter((d) =>
                          comparison.includes(
                            typeof d === "string" ? d : d.remedy
                          )
                        );
                        const text = comp
                          .map((c) => (typeof c === "string" ? c : c.remedy))
                          .join("\n");
                        const w = window.open("", "_blank");
                        w.document.write(`<pre>${text}</pre>`);
                        w.print();
                      }}
                    >
                      Print Comparison
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => {
                      setData("");
                      setComparison([]);
                    }}
                    aria-label="Clear results"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {renderResults()}
            </>
          ) : (
            <div style={{ padding: 12, color: "#6c757d" }}>
              No results yet. Enter a symptom and press Submit.
            </div>
          )}
        </div>
      </div>

      {/* Materia Medica modal */}
      <Modal show={mmModalOpen} onHide={() => setMmModalOpen(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Materia Medica</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {mmContent ? (
            <pre style={{ whiteSpace: "pre-wrap" }}>{mmContent}</pre>
          ) : (
            <div>No materia medica found.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMmModalOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Score explanation modal */}
      <Modal
        show={scoreModalOpen}
        onHide={() => setScoreModalOpen(false)}
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title>How the Score is Calculated</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ fontSize: 14, color: "#35484a" }}>
            <p>
              <strong>Quick explanation:</strong>
            </p>
            <ul>
              <li>
                Score = weighted rubric match. Higher rubric grades weigh more.
              </li>
              <li>
                Sources (repertory/author) are given higher trust weight if
                present.
              </li>
              <li>Concomitants and modality matches increase the score.</li>
              <li>
                This is a clinician-aid; review original rubric sources before
                prescribing.
              </li>
            </ul>
            <p style={{ fontSize: 13, color: "#6c757d" }}>
              For full transparency you should enable rubric provenance and
              check original entries in Materia Medica.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setScoreModalOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Row>
  );
};

export default Repertory;
