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
import Loader from "./Loader";
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
} from "react-icons/fi";

/**
 * RemedySuggestion (upgraded)
 * - Single-file modern UI (react-bootstrap + react-icons + inline CSS)
 * - Preserves: component name, handler names (handleSubmit, handleChange), input name 'disease', payload shape.
 * - Adds: gradient header, pill search, mode chips, graceful skeletons, results card with header, illustrated empty state,
 *   quick chips, recent queries, favorites, copy/export actions, subtle micro-interactions and focus styles.
 */

const RemedySuggestion = () => {
  // preserved state names and handlers
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ disease: "" });
  const [errors, setErrors] = useState({});
  const [data, setData] = useState("");

  // UI extras (allowed)
  const [mode, setMode] = useState("text"); // text | image | deep
  const [imageFile, setImageFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [favs, setFavs] = useState([]);
  const [skeleton, setSkeleton] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useContext(UserContext);
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("remedy_history_v2");
      if (raw) setHistory(JSON.parse(raw));
      const favRaw = localStorage.getItem("remedy_favs_v2");
      if (favRaw) setFavs(JSON.parse(favRaw));
    } catch (e) {}
  }, []);

  const persistHistory = (q, resp) => {
    const entry = { q, resp, at: new Date().toISOString() };
    const next = [entry, ...history].slice(0, 12);
    setHistory(next);
    try {
      localStorage.setItem("remedy_history_v2", JSON.stringify(next));
    } catch (e) {}
  };

  const persistFav = (q, resp) => {
    const entry = { q, resp, at: new Date().toISOString() };
    const next = [entry, ...favs].slice(0, 30);
    setFavs(next);
    try {
      localStorage.setItem("remedy_favs_v2", JSON.stringify(next));
    } catch (e) {}
  };

  // preserve handler name
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});

    // basic validation
    if (mode === "text" && (!formData.disease || !formData.disease.trim())) {
      setErrors({ disease: "Please enter a query" });
      return;
    }

    try {
      setLoading(true);
      setSkeleton(true);
      // small delay so skeleton is visible briefly
      await new Promise((r) => setTimeout(r, 300));

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
        // preserve original payload shape exactly
        const payload = { disease: formData.disease };
        const response = await api.post(endpoint, payload);
        setData(response.data.data);
        persistHistory(formData.disease, response.data.data);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "An error occurred.");
      } else {
        toast.error("An error occurred.");
      }
      console.error("RemedySuggestion error:", error);
    } finally {
      setLoading(false);
      setTimeout(() => setSkeleton(false), 350);
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

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(data || "");
      toast.info("Copied result to clipboard");
    } catch (e) {
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

  const emptyStateSVG = () => (
    <svg
      width="220"
      height="140"
      viewBox="0 0 220 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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
    <Row className="justify-content-center" style={{ padding: 18 }}>
      <style>{`
        :root{ --bg: #f7fbfc; --muted:#6b7280; --accent1: #4facfe; --accent2: #00f2fe; --accent-cta: #6d5df6; }
        .remedy-shell{ max-width:1100px; width:100%; }
        .hero { padding:20px; border-radius:14px; background: linear-gradient(180deg, rgba(79,172,254,0.06), rgba(0,242,254,0.03)); box-shadow: 0 12px 36px rgba(12,16,22,0.06); border:1px solid rgba(12,16,22,0.03); }
        .title { font-size:20px; font-weight:700; color:#072635; }
        .subtitle { color:var(--muted); font-size:13px; }
        .query-pill { display:flex; align-items:center; gap:10px; padding:10px 12px; background: #fff; border-radius: 999px; box-shadow: 0 8px 30px rgba(16,24,40,0.04); border:1px solid rgba(12,16,22,0.04); }
        .pill-input { border:none; outline:none; font-size:15px; min-width:260px; }
        .mode-chip { padding:8px 12px; border-radius:999px; cursor:pointer; border:1px solid rgba(12,16,22,0.04); transition: all .18s ease; font-size:13px; background:transparent; }
        .mode-chip.active { background: linear-gradient(90deg, rgba(79,172,254,0.12), rgba(0,242,254,0.06)); box-shadow: inset 0 -2px 8px rgba(10,20,20,0.02); }
        .example-chip { background: linear-gradient(180deg, #fff, #fbfdff); padding:8px 12px; border-radius:999px; border:1px solid rgba(12,16,22,0.04); cursor:pointer; font-size:13px; }
        .results-card { margin-top:14px; background: linear-gradient(180deg,#ffffff,#fbfeff); border-radius:12px; padding:14px; box-shadow: 0 10px 30px rgba(12,16,22,0.04); border:1px solid rgba(12,16,22,0.03); }
        .results-header { display:flex; justify-content:space-between; align-items:center; gap:10px; }
        .results-body { margin-top:12px; min-height:140px; }
        .ref-card { border-radius:10px; padding:10px; display:flex; gap:8px; align-items:center; background:#fff; border:1px solid rgba(12,16,22,0.04); cursor:pointer; transition: transform .12s ease; }
        .ref-card:hover{ transform: translateY(-4px); }
        .action-ghost { background:transparent; border:1px solid rgba(12,16,22,0.06); }
        .small-muted{ color:var(--muted); font-size:13px; }
        .btn-gradient { background: linear-gradient(90deg, var(--accent1), var(--accent2)); border:none; color:white; }
        .btn-gradient:hover { filter:brightness(.96); transform: translateY(-2px); }
        .focus-ring:focus { outline: 3px solid rgba(79,172,254,0.12); outline-offset: 2px; }
      `}</style>

      <div className="remedy-shell">
        <Card className="hero">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="title">Remedy Suggestion</div>
              <div className="subtitle">
                Mini GPT for doctors — quick AI-assisted remedies, references
                and notes.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Badge
                bg="info"
                pill
                style={{ fontSize: 13, padding: "8px 12px" }}
              >
                <FiClock style={{ marginRight: 6 }} /> Hits:{" "}
                {user?.hit_count ?? "—"}
              </Badge>
              <Button variant="outline-secondary" size="sm">
                Help
              </Button>
            </div>
          </div>

          <hr style={{ borderColor: "rgba(12,16,22,0.04)" }} />

          <Form onSubmit={handleSubmit}>
            <Form.Group as={Row} className="align-items-center">
              <Form.Label
                column
                sm={2}
                style={{ textAlign: "right", fontWeight: 600 }}
              >
                disease:
              </Form.Label>
              <Col sm={10}>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    width: "100%",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    className="query-pill"
                    style={{ flex: 1, minWidth: 300 }}
                  >
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <div
                        className={`mode-chip ${mode === "text" ? "active" : ""}`}
                        onClick={() => setMode("text")}
                        title="Text search"
                      >
                        <FiSearch style={{ marginRight: 6 }} /> Text
                      </div>

                      <div
                        className={`mode-chip ${mode === "image" ? "active" : ""}`}
                        onClick={() => setMode("image")}
                        title="Image search"
                      >
                        <FiImage style={{ marginRight: 6 }} /> Image
                      </div>

                      <div
                        className={`mode-chip ${mode === "deep" ? "active" : ""}`}
                        onClick={() => setMode("deep")}
                        title="Deep literature search"
                      >
                        <FiLayers style={{ marginRight: 6 }} /> Deep
                      </div>
                    </div>

                    <input
                      name="disease"
                      value={formData.disease}
                      onChange={handleChange}
                      className="pill-input focus-ring"
                      placeholder={
                        mode === "image"
                          ? "Describe image or attach and press Submit"
                          : "Search remedies, symptoms, medicines — e.g. 'migraine with nausea'"
                      }
                      aria-label="Remedy search input"
                      style={{ marginLeft: 12 }}
                    />

                    <div
                      style={{
                        marginLeft: "auto",
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      {mode === "image" && (
                        <>
                          <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={onFilePick}
                          />
                          <Button
                            variant="light"
                            onClick={() => fileRef.current?.click()}
                            className="focus-ring"
                            title="Upload image"
                          >
                            <FiUpload />
                          </Button>
                          {imageFile ? (
                            <div className="small-muted">{imageFile.name}</div>
                          ) : null}
                        </>
                      )}

                      <Button
                        type="submit"
                        className="btn-gradient focus-ring"
                        disabled={loading || user?.hit_count === 0}
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" />{" "}
                            <span style={{ marginLeft: 8 }}>Searching...</span>
                          </>
                        ) : (
                          <>
                            <FiSearch style={{ marginRight: 8 }} /> Search
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline-secondary"
                        onClick={clearInput}
                        className="focus-ring"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      className="example-chip"
                      onClick={() =>
                        setFormData({ disease: "Migraine with aura" })
                      }
                    >
                      Migraine with aura
                    </div>
                    <div
                      className="example-chip"
                      onClick={() => setFormData({ disease: "Recurrent UTI" })}
                    >
                      Recurrent UTI
                    </div>
                    <div
                      className="example-chip"
                      onClick={() =>
                        setFormData({ disease: "Anxiety + insomnia" })
                      }
                    >
                      Anxiety + insomnia
                    </div>
                    <div
                      className="example-chip"
                      onClick={() =>
                        setFormData({ disease: "Acute bronchitis in elderly" })
                      }
                    >
                      Acute bronchitis
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  {errors.disease && (
                    <div className="text-danger">{errors.disease}</div>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={loading || user?.hit_count === 0}
                  >
                    Submit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => navigate("/app/dashboard")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>

                  {user?.hit_count === 0 && (
                    <div className="text-danger">
                      You have reached your limit please recharge your limit.
                    </div>
                  )}
                </div>
              </Col>
            </Form.Group>
          </Form>

          {/* Main content: results + side panel */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 320px",
              gap: 16,
              marginTop: 18,
            }}
          >
            <div>
              <div className="results-card">
                <div className="results-header">
                  <div>
                    <div style={{ fontWeight: 700 }}>Results</div>
                    <div className="small-muted">
                      AI-suggested remedies, short notes and references.
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <Button variant="light" title="Copy" onClick={copyResult}>
                      <FiCopy />
                    </Button>
                    <Button
                      variant="light"
                      title="Save to favorites"
                      onClick={saveFavorite}
                    >
                      <FiHeart />
                    </Button>
                    <Dropdown>
                      <Dropdown.Toggle variant="light" id="dd-actions" />
                      <Dropdown.Menu>
                        <Dropdown.Item
                          onClick={() =>
                            navigator.clipboard?.writeText(data || "")
                          }
                        >
                          Copy
                        </Dropdown.Item>
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
                  {skeleton ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      <div
                        style={{
                          height: 14,
                          width: "48%",
                          background:
                            "linear-gradient(90deg,#eef2f3,#f8fbfc,#eef2f3)",
                          borderRadius: 8,
                        }}
                      />
                      <div
                        style={{
                          height: 12,
                          width: "90%",
                          background: "#f6fbfc",
                          borderRadius: 8,
                        }}
                      />
                      <div
                        style={{
                          height: 12,
                          width: "82%",
                          background: "#f6fbfc",
                          borderRadius: 8,
                        }}
                      />
                      <div
                        style={{
                          height: 12,
                          width: "70%",
                          background: "#f6fbfc",
                          borderRadius: 8,
                        }}
                      />
                    </div>
                  ) : data ? (
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                      {" "}
                      {data}{" "}
                    </div>
                  ) : (
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      <div>{emptyStateSVG()}</div>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>
                          No results yet
                        </div>
                        <div className="small-muted">
                          Try a short clinical query, or upload an image and
                          press Submit.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <hr style={{ borderColor: "rgba(12,16,22,0.04)" }} />

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div className="small-muted">Recent queries</div>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginLeft: 8,
                    }}
                  >
                    {history.length === 0 ? (
                      <div className="small-muted">No recent queries</div>
                    ) : (
                      history.map((h, i) => (
                        <div
                          key={i}
                          className="example-chip"
                          onClick={() => {
                            setFormData({ disease: h.q });
                            setData(h.resp);
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {h.q}
                          </div>
                          <div className="small-muted" style={{ fontSize: 11 }}>
                            {new Date(h.at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>
                Reference & Actions
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <div className="small-muted">Quick links</div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <div
                      className="ref-card"
                      onClick={() =>
                        window.open("https://pubmed.ncbi.nlm.nih.gov", "_blank")
                      }
                    >
                      <div
                        style={{
                          background: "linear-gradient(90deg,#4facfe,#00f2fe)",
                          borderRadius: 8,
                          width: 36,
                          height: 36,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                        }}
                      >
                        P
                      </div>
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
                    >
                      <div
                        style={{
                          background: "linear-gradient(90deg,#6d5df6,#9b8bff)",
                          borderRadius: 8,
                          width: 36,
                          height: 36,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                        }}
                      >
                        W
                      </div>
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
                    >
                      <div
                        style={{
                          background: "linear-gradient(90deg,#34d399,#86efac)",
                          borderRadius: 8,
                          width: 36,
                          height: 36,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                        }}
                      >
                        N
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>NCBI</div>
                        <div className="small-muted">Datasets & more</div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid rgba(12,16,22,0.04)",
                      paddingTop: 8,
                    }}
                  >
                    <div className="small-muted">Share / Export</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <Button variant="light" onClick={copyResult}>
                        Copy
                      </Button>
                      <Button
                        variant="light"
                        onClick={() => alert("Export as PDF (stub)")}
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="small-muted">Favorites</div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    {favs.length === 0 ? (
                      <div className="small-muted">No favorites yet</div>
                    ) : (
                      favs.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            background: "#fff",
                            padding: 8,
                            borderRadius: 10,
                            border: "1px solid rgba(12,16,22,0.04)",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setFormData({ disease: f.q });
                            setData(f.resp);
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700 }}>
                            {f.q}
                          </div>
                          <div className="small-muted" style={{ fontSize: 12 }}>
                            {new Date(f.at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Row>
  );
};

export default RemedySuggestion;
