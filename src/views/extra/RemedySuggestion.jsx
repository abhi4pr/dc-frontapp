import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Card,
  Row,
  Button,
  Form,
  Col,
  Badge,
  Spinner,
  Dropdown,
} from "react-bootstrap";
import "react-confirm-alert/src/react-confirm-alert.css";
import api from "../../utility/api";
import { toast } from "react-toastify";
import { API_URL } from "constants";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext";
import {
  FiSearch,
  FiUpload,
  FiCopy,
  FiClock,
  FiHeart,
  FiImage,
  FiLayers,
  FiMoreVertical,
  FiMic,
} from "react-icons/fi";

/**
 * RemedySuggestion – updated with textarea and reorganized button layout
 * Changes:
 *  - Input changed to textarea for better visibility
 *  - Mode buttons (Text, Image, Deep) moved below textarea
 *  - Action buttons (Search, Clear) placed next to mode buttons
 *  - Voice button added alongside action buttons
 *  - Upload button integrated when Image mode is selected
 */

const MIN_TOUCH = 44;
const SKELETON_MIN_MS = 300;
const SKELETON_FADE_MS = 350;
const STORAGE_HISTORY_KEY = "remedy_history_v2";
const STORAGE_FAVS_KEY = "remedy_favs_v2";

const RemedySuggestion = () => {
  // preserved state
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ disease: "" });
  const [errors, setErrors] = useState({});
  const [data, setData] = useState("");

  // UI extras
  const [mode, setMode] = useState("text"); // text | image | deep
  const [imageFile, setImageFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [favs, setFavs] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const fileRef = useRef(null);
  const skeletonTimerRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
      const favRaw = localStorage.getItem(STORAGE_FAVS_KEY);
      if (favRaw) setFavs(JSON.parse(favRaw));
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
    return () => {
      if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current);
    };
  }, []);

  const persistHistory = (q, resp) => {
    const entry = { q, resp, at: new Date().toISOString() };
    const next = [entry, ...history].slice(0, 12);
    setHistory(next);
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to persist history:", e);
    }
  };

  const persistFav = (q, resp) => {
    const entry = { q, resp, at: new Date().toISOString() };
    const next = [entry, ...favs].slice(0, 30);
    setFavs(next);
    try {
      localStorage.setItem(STORAGE_FAVS_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to persist favs:", e);
    }
  };

  // preserve handler name
  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    setErrors({});

    if (mode === "text" && (!formData.disease || !formData.disease.trim())) {
      setErrors({ disease: "Please enter a query" });
      return;
    }

    setLoading(true);
    const started = Date.now();
    try {
      const endpoint = `${API_URL}/ai/send_search_remedy/${user?._id}`;

      if (mode === "image" && imageFile) {
        const fd = new FormData();
        fd.append("disease", formData.disease || "");
        fd.append("image", imageFile);
        const response = await api.post(endpoint, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setData(response.data.data);
        persistHistory(formData.disease || "[image]", response.data.data);
      } else {
        const payload = { disease: formData.disease };
        const response = await api.post(endpoint, payload);
        setData(response.data.data);
        persistHistory(formData.disease, response.data.data);
      }
    } catch (error) {
      console.error("RemedySuggestion error:", error);
      if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("An error occurred while searching.");
      }
    } finally {
      const elapsed = Date.now() - started;
      const remaining = Math.max(0, SKELETON_MIN_MS - elapsed);
      skeletonTimerRef.current = setTimeout(() => {
        setLoading(false);
      }, remaining + SKELETON_FADE_MS);
    }
  };

  // preserve handler name
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const onFilePick = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) setImageFile(f);
  };

  const clearInput = () => {
    setFormData({ disease: "" });
    setImageFile(null);
    setData("");
    setErrors({});
  };

  const handleVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening... Speak now");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData((prev) => ({ ...prev, disease: transcript }));
      toast.success("Voice input captured");
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      toast.error("Voice recognition failed");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(data || "");
      toast.info("Copied result to clipboard");
    } catch (e) {
      console.error("Copy failed:", e);
      toast.error("Copy failed");
    }
  };

  const saveFavorite = async () => {
    if (!data) {
      toast.info("Nothing to save");
      return;
    }
    persistFav(formData.disease || "[image]", data);
    toast.success("Saved to favorites");
  };

  const topExamples = [
    "Migraine with aura",
    "Recurrent UTI",
    "Anxiety + insomnia",
    "Acute bronchitis in elderly",
  ];

  const emptyStateSVG = () => (
    <svg
      width="220"
      height="140"
      viewBox="0 0 220 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Empty state illustration"
    >
      <rect x="0" y="0" width="220" height="140" rx="12" fill="#F8FAFC" />
      <g transform="translate(20,18)">
        <rect x="0" y="40" width="60" height="40" rx="8" fill="#E6FFFB" />
        <rect
          x="70"
          y="10"
          width="120"
          height="80"
          rx="8"
          fill="#FFFFFF"
          stroke="#E6F7F6"
        />
        <circle cx="40" cy="60" r="6" fill="#0F6B66" />
        <rect x="86" y="22" width="80" height="8" rx="4" fill="#E6FFFB" />
        <rect x="86" y="36" width="60" height="8" rx="4" fill="#F1F8F7" />
        <rect x="86" y="50" width="40" height="8" rx="4" fill="#F1F8F7" />
      </g>
    </svg>
  );

  return (
    <Row
      className="justify-content-center"
      style={{ padding: 18, background: "#F9FAFB" }}
    >
      <style>{`
        /* ---- Palette (your exact values) ---- */
        :root {
          --primary: #6A5ACD; /* Primary Accent */
          --primary-hover: #5A4ACF;
          --secondary: #9370DB; /* Medium Purple */
          --secondary-hover: #8260C9;
          --bg-main: #F9FAFB;
          --card-bg: #FFFFFF;
          --border: #E5E7EB;
          --text-primary: #111827;
          --text-secondary: #4B5563;
          --placeholder: #9CA3AF;
          --success: #10B981;
          --error: #EF4444;
          --muted: #6B7280;
          --accent-blue:#4FACFE;
          --accent-cyan:#00F2FE;
          --soft-pink:#FFD7EA;
        }

        /* container */
        .remedy-shell { max-width: min(1400px, calc(100% - 64px)); width:100%; }

        /* hero: subtle soft-pink → violet top gradient (matches supplied soft pink-violet background) */
        .hero {
          padding:18px;
          border-radius:14px;
          background: linear-gradient(180deg, rgba(217,186,255,0.06), rgba(241,231,255,0.03));
          box-shadow: 0 14px 40px rgba(17,24,39,0.04);
          border:1px solid var(--border);
        }

        .header-row { display:flex; justify-content:space-between; align-items:center; gap:12px; }
        .title { font-size:20px; font-weight:700; color:var(--text-primary); }
        .subtitle { color:var(--text-secondary); font-size:13px; margin-top:4px; }

        /* Updated textarea styling */
        .input-textarea {
          width: 100%;
          min-height: 120px;
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: 12px;
          font-size: 15px;
          font-family: inherit;
          color: var(--text-primary);
          background: var(--card-bg);
          resize: vertical;
          box-shadow: 0 4px 12px rgba(17,24,39,0.02);
          transition: all 0.2s ease;
        }
        
        .input-textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(106,90,205,0.08), 0 4px 12px rgba(17,24,39,0.04);
        }
        
        .input-textarea::placeholder {
          color: var(--placeholder);
        }

        /* Controls section below textarea */
        .controls-section {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Mode chips row */
        .mode-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .mode-chip {
          padding: 10px 16px;
          border-radius: 999px;
          cursor: pointer;
          border: 1px solid rgba(17,24,39,0.08);
          transition: all .14s ease;
          font-size: 14px;
          display: flex;
          gap: 8px;
          align-items: center;
          min-height: 44px;
          background: var(--card-bg);
          font-weight: 600;
        }
        
        .mode-chip.active {
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-cyan), var(--primary));
          color: white;
          border-color: rgba(106,90,205,0.14);
          box-shadow: 0 6px 18px rgba(106,90,205,0.12);
        }
        
        .mode-chip:hover:not(.active) {
          border-color: var(--primary);
          background: rgba(106,90,205,0.02);
        }
        
        .mode-chip:focus { 
          outline: none; 
          box-shadow: 0 0 0 3px rgba(106,90,205,0.10); 
        }

        /* Action buttons row */
        .action-row {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        /* primary CTA gradient (blue -> cyan -> violet) - matches your first card style */
        .btn-gradient {
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-cyan), var(--primary));
          border: none;
          color: white;
          min-height: 44px;
          padding: 12px 18px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        
        .btn-gradient:hover { 
          filter: brightness(.96); 
          transform: translateY(-2px); 
          box-shadow: 0 8px 25px rgba(106,90,205,0.15);
        }
        
        .btn-gradient:disabled {
          opacity: 0.6;
          transform: none;
          filter: none;
        }

        /* Voice button with pulsing animation when active */
        .btn-voice {
          background: var(--card-bg);
          border: 1px solid var(--border);
          color: var(--text-primary);
          min-height: 44px;
          padding: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 600;
          border-radius: 10px;
          transition: all 0.2s ease;
        }
        
        .btn-voice:hover {
          border-color: var(--primary);
          background: rgba(106,90,205,0.02);
        }
        
        .btn-voice.listening {
          background: linear-gradient(90deg, #ff6b6b, #ee5a52);
          color: white;
          border-color: transparent;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* File upload info */
        .file-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(106,90,205,0.05);
          border: 1px solid rgba(106,90,205,0.15);
          border-radius: 8px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        /* results + side */
        .layout-grid { display:grid; grid-template-columns: 1fr 340px; gap:18px; margin-top:18px; }

        .results-card {
          background: var(--card-bg);
          border-radius:12px;
          padding:14px;
          border:1px solid var(--border);
          box-shadow: 0 10px 30px rgba(17,24,39,0.03);
        }

        /* small violet header accent to visually match the design */
        .results-card .top-accent { height:6px; border-radius:6px; margin-bottom:10px; background: linear-gradient(90deg, var(--primary), var(--secondary)); }

        .results-header { display:flex; justify-content:space-between; align-items:center; gap:10px; }
        .results-body { margin-top:12px; min-height:120px; color:var(--text-primary); line-height:1.6; }

        .skeleton { display:grid; gap:10px; }
        .skeleton .line { height:12px; border-radius:8px; background: linear-gradient(90deg,#eef2f3,#f8fbfc,#eef2f3); background-size:200% 100%; animation: shimmer 1.4s linear infinite; }
        @keyframes shimmer { 0%{ background-position:200% 0 } 100%{ background-position:-200% 0 } }

        .ref-card {
          background: var(--card-bg);
          border-radius:12px;
          padding:12px;
          display:flex;
          gap:12px;
          align-items:center;
          border:1px solid var(--border);
          cursor:pointer;
          transition: transform .12s ease, box-shadow .12s ease;
          min-height:56px;
        }
        .ref-card:hover { transform:translateY(-4px); box-shadow: 0 10px 30px rgba(17,24,39,0.05); }

        /* Quick link gradient badges (two distinct styles to match your image) */
        .badge-gradient-a {
          width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white;
          background: linear-gradient(180deg, var(--accent-blue), var(--accent-cyan), var(--primary));
          box-shadow: 0 8px 20px rgba(79,122,254,0.08);
        }
        .badge-gradient-b {
          width:48px; height:48px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white;
          background: linear-gradient(180deg, #ff9ecb, #f18ad3, var(--secondary));
          box-shadow: 0 8px 20px rgba(241,138,211,0.06);
        }

        .example-chip { background: linear-gradient(180deg,#fff,#fbfdff); padding:8px 12px; border-radius:999px; border:1px solid var(--border); cursor:pointer; min-height:44px; display:flex; align-items:center; }

        .small-muted { color:var(--text-secondary); font-size:13px; }

        /* responsive */
        @media (max-width: 992px) {
          .layout-grid { grid-template-columns: 1fr; }
          .meta .help-btn { display:none; }
        }
        @media (max-width: 768px) {
          .mode-row, .action-row { 
            justify-content: center; 
          }
          .btn-gradient { 
            flex: 1; 
            justify-content: center; 
            min-width: 120px;
          }
        }
        @media (max-width: 560px) {
          .controls-section {
            gap: 16px;
          }
          .mode-row {
            justify-content: center;
          }
          .action-row {
            flex-direction: column;
            align-items: stretch;
          }
          .btn-gradient, .btn-voice {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div
        className="remedy-shell"
        role="region"
        aria-label="Remedy suggestion panel"
      >
        <Card className="hero" aria-live="polite">
          <div className="header-row" style={{ gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div className="title">AI Suggestion</div>
              <div className="subtitle">
                Mini GPT for doctors – concise remedies & references.
              </div>
            </div>

            <div
              style={{ display: "flex", gap: 10, alignItems: "center" }}
              className="meta"
            >
              <Badge
                bg="light"
                text="dark"
                style={{ fontSize: 13, padding: "8px 12px", borderRadius: 10 }}
              ></Badge>


            </div>
          </div>

          <hr style={{ borderColor: "var(--border)", margin: "12px 0" }} />

          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group as={Row}>
              <Col sm={12}>
                {/* Textarea for input */}
                <textarea
                  name="disease"
                  value={formData.disease}
                  onChange={handleChange}
                  className="input-textarea"
                  placeholder={
                    mode === "image"
                      ? "Describe the image or medical condition you want to analyze. You can also attach an image file below and press Search."
                      : mode === "deep"
                        ? "Enter detailed clinical query for comprehensive literature search - e.g. 'chronic migraine treatment options in elderly patients with comorbidities'"
                        : "Enter symptoms, condition, or clinical query - e.g. 'migraine with nausea and photophobia in 35-year-old female'"
                  }
                  aria-label="Medical query input"
                />

                {/* Error display */}
                {errors.disease && (
                  <div
                    className="text-danger"
                    role="alert"
                    style={{ marginTop: 8 }}
                  >
                    {errors.disease}
                  </div>
                )}

                {/* Controls section */}
                <div className="controls-section">
                  {/* Mode selection row */}
                  <div className="mode-row">
                    <div
                      className={`mode-chip ${mode === "text" ? "active" : ""}`}
                      onClick={() => setMode("text")}
                      role="tab"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setMode("text")}
                      aria-selected={mode === "text"}
                      aria-label="Text search mode"
                    >
                      <FiSearch aria-hidden />
                      <span>Text Search</span>
                    </div>

                    <div
                      className={`mode-chip ${mode === "image" ? "active" : ""}`}
                      onClick={() => setMode("image")}
                      role="tab"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setMode("image")}
                      aria-selected={mode === "image"}
                      aria-label="Image analysis mode"
                    >
                      <FiImage aria-hidden />
                      <span>Image Analysis</span>
                    </div>



                    <button
                      type="submit"
                      className="btn-gradient"
                      disabled={loading || user?.hit_count === 0}
                      aria-label="Search for remedies"
                      style={{ marginLeft: "30%" }}
                    >
                      {loading ? (
                        <span
                          style={{
                            display: "inline-flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <Spinner animation="border" size="sm" aria-hidden />
                          Searching...
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <FiSearch aria-hidden />
                          Search
                        </span>
                      )}
                    </button>

                    <Button
                      variant="outline-secondary"
                      onClick={clearInput}
                      style={{ minHeight: 44 }}
                      aria-label="Clear input"
                    >
                      Clear
                    </Button>

                    <button
                      type="button"
                      className={`btn-voice ${isListening ? "listening" : ""}`}
                      onClick={handleVoiceInput}
                      aria-label={isListening ? "Listening..." : "Voice input"}
                    >
                      <FiMic aria-hidden />
                      {isListening && <span>Listening...</span>}
                    </button>
                  </div>

                  {/* File upload section for image mode */}
                  {mode === "image" && (
                    <div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={onFilePick}
                      />
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <Button
                          variant="outline-secondary"
                          onClick={() => fileRef.current?.click()}
                          aria-label="Upload image file"
                          style={{ minHeight: 44 }}
                        >
                          <FiUpload style={{ marginRight: 8 }} />
                          Choose Image
                        </Button>
                        {imageFile && (
                          <div className="file-info">
                            <FiImage />
                            <span>{imageFile.name}</span>
                            <button
                              type="button"
                              onClick={() => setImageFile(null)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--text-secondary)",
                                cursor: "pointer",
                                padding: "0 4px",
                              }}
                              aria-label="Remove file"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons row */}
                  <div className="action-row"></div>

                  {/* Status messages */}
                  {user?.hit_count === 0 && (
                    <div className="text-danger" role="status">
                      You have reached your limit – please recharge.
                    </div>
                  )}
                </div>
              </Col>
            </Form.Group>
          </Form>

          <div
            className="layout-grid"
            role="region"
            aria-label="Results and reference"
          >
            <div>
              <div className="results-card" aria-live="polite">
                <div className="top-accent" aria-hidden />
                <div className="results-header">
                  <div>
                    <div
                      style={{ fontWeight: 700, color: "var(--text-primary)" }}
                    >
                      Results
                    </div>
                    <div className="small-muted">
                      AI-suggested remedies, short notes and references.
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <Button
                      variant="light"
                      onClick={copyResult}
                      aria-label="Copy result"
                      style={{ minHeight: 36 }}
                    >
                      <FiCopy />
                    </Button>

                    <Dropdown>
                      <Dropdown.Toggle
                        variant="light"
                        id="dd-actions"
                        style={{ minHeight: 36 }}
                      >
                        <FiMoreVertical />
                      </Dropdown.Toggle>
                      <Dropdown.Menu align="end">
                        <Dropdown.Item onClick={copyResult}>Copy</Dropdown.Item>
                        <Dropdown.Item
                          onClick={() => alert("Export PDF (stub)")}
                        >
                          Export
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>

                <div className="results-body">
                  {loading ? (
                    <div className="skeleton">
                      <div className="line" style={{ width: "52%" }} />
                      <div className="line" style={{ width: "88%" }} />
                      <div className="line" style={{ width: "74%" }} />
                      <div className="line" style={{ width: "60%" }} />
                    </div>
                  ) : data ? (
                    <div style={{ whiteSpace: "pre-wrap" }}>{data}</div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>{emptyStateSVG()}</div>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>
                          No results yet
                        </div>
                        <div className="small-muted">
                          Try a short clinical query or upload an image and
                          press Search.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <hr style={{ borderColor: "var(--border)" }} />

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >

                </div>
              </div>
            </div>

            <aside>
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: 10,
                  color: "var(--text-primary)",
                }}
              >
                Reference & Actions
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <div className="small-muted">Quick links</div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      marginTop: 8,
                    }}
                  >
                    <div
                      className="ref-card"
                      onClick={() =>
                        window.open("https://pubmed.ncbi.nlm.nih.gov", "_blank")
                      }
                      role="link"
                      tabIndex={0}
                    >
                      <div className="badge-gradient-a">P</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>PubMed</div>
                        <div className="small-muted">Research articles</div>
                      </div>
                    </div>

                    <div
                      className="ref-card"
                      onClick={() =>
                        window.open("https://www.who.int", "_blank")
                      }
                      role="link"
                      tabIndex={0}
                    >
                      <div className="badge-gradient-b">W</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>WHO</div>
                        <div className="small-muted">Guidelines</div>
                      </div>
                    </div>

                    <div
                      className="ref-card"
                      onClick={() =>
                        window.open("https://www.ncbi.nlm.nih.gov", "_blank")
                      }
                      role="link"
                      tabIndex={0}
                    >
                      <div className="badge-gradient-a">N</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>NCBI</div>
                        <div className="small-muted">Datasets & more</div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      paddingTop: 8,
                      marginTop: 8,
                    }}
                  ></div>
                </div>
              </div>
            </aside>
          </div>
        </Card>
      </div>
    </Row>
  );
};

export default RemedySuggestion;
