import React, { useState, useEffect, useRef, useContext } from "react";
import {
  BsSearch,
  BsPrinter,
  BsGear,
  BsLightbulb,
  BsBarChart,
  BsBook,
  BsPerson,
  BsShield,
  BsTree,
  BsGrid3X3,
  BsActivity,
  BsEye,
  BsStarFill,
  BsArrowRight,
  BsQuestionCircle,
  BsCheckCircle,
  BsInfoCircle,
} from "react-icons/bs";
import axios from "axios";
import { UserContext } from "../../contexts/UserContext";
import api from "../../utility/api";

const mockUserContext = {
  user: { _id: "demo_user", hit_count: 150 },
};

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
  "Jan Scholten",
  "Massimo Mangialavori",
  "Louis Klein",
  "Divya Chhabra",
];

const ExpertSystem = () => {
  const { user } = useContext(UserContext);
  // Form state
  const [formData, setFormData] = useState({ dr1: "", dr2: "", symptoms: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [metaInfo, setMetaInfo] = useState(null);

  // Expert system selection
  const [selectedExpertSystem, setSelectedExpertSystem] = useState("kent");
  const [activeTab, setActiveTab] = useState("compare");
  const [showSystemDetails, setShowSystemDetails] = useState(false);

  // Typeahead states
  const [suggestions1, setSuggestions1] = useState([]);
  const [showSuggestions1, setShowSuggestions1] = useState(false);
  const [suggestions2, setSuggestions2] = useState([]);
  const [showSuggestions2, setShowSuggestions2] = useState(false);
  const [activeIdx1, setActiveIdx1] = useState(-1);
  const [activeIdx2, setActiveIdx2] = useState(-1);

  // UI controls
  const [minConfidence, setMinConfidence] = useState(0);
  const [expertPreset, setExpertPreset] = useState("default");
  const [repertoryEdition, setRepertoryEdition] = useState("Kent (default)");

  // Refs
  const dr1InputRef = useRef(null);
  const dr2InputRef = useRef(null);
  const suggestionsRef1 = useRef(null);
  const suggestionsRef2 = useRef(null);
  const resultsRef = useRef(null);
  const debounceRef1 = useRef(null);
  const debounceRef2 = useRef(null);
  const requestAbortRef = useRef(null);
  const mountedRef = useRef(true);

  // Modal states
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explainFor, setExplainFor] = useState(null);

  const symptomsRef = useRef(null);

  const handleChange = (event) => {
    const { name, value, selectionStart, selectionEnd } = event.target;

    // cursor position store करो
    const cursorStart = selectionStart;
    const cursorEnd = selectionEnd;

    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));

    // अगली render cycle में cursor restore करो
    if (name === "symptoms") {
      requestAnimationFrame(() => {
        if (symptomsRef.current) {
          symptomsRef.current.selectionStart = cursorStart;
          symptomsRef.current.selectionEnd = cursorEnd;
          symptomsRef.current.focus();
        }
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (activeTab === "compare" && formData.dr1 === formData.dr2) {
      alert("Doctor 1 and Doctor 2 must be different.");
      return;
    }

    if (
      activeTab === "compare" &&
      (!formData.dr1 || !formData.dr2 || !formData.symptoms)
    ) {
      setErrors({
        dr1: !formData.dr1 ? "Select Doctor 1" : null,
        dr2: !formData.dr2 ? "Select Doctor 2" : null,
        symptoms: !formData.symptoms ? "Enter patient symptoms" : null,
      });
      return;
    }

    if (activeTab === "single" && !formData.symptoms) {
      setErrors({
        symptoms: "Enter patient symptoms",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(`/ai/send_expert/`, {
        dr1: formData.dr1,
        dr2: formData.dr2,
        symptoms: formData.symptoms,
        userId: user?._id,
      });

      setData(response.data);
      setMetaInfo(response.data?.meta || null);

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
      setData({ error: err?.response?.data?.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  // Typeahead logic
  useEffect(() => {
    const q = formData.dr1?.trim().toLowerCase();
    if (!q || q.length < 1) {
      setSuggestions1([]);
      setShowSuggestions1(false);
      setActiveIdx1(-1);
      return;
    }
    if (debounceRef1.current) clearTimeout(debounceRef1.current);
    debounceRef1.current = setTimeout(() => {
      const matches = EXPERTS_CORPUS.filter((e) =>
        e.toLowerCase().includes(q)
      ).slice(0, 8);
      setSuggestions1(matches);
      setShowSuggestions1(matches.length > 0);
      setActiveIdx1(-1);
    }, 150);
    return () => clearTimeout(debounceRef1.current);
  }, [formData.dr1]);

  useEffect(() => {
    const q = formData.dr2?.trim().toLowerCase();
    if (!q || q.length < 1) {
      setSuggestions2([]);
      setShowSuggestions2(false);
      setActiveIdx2(-1);
      return;
    }
    if (debounceRef2.current) clearTimeout(debounceRef2.current);
    debounceRef2.current = setTimeout(() => {
      const matches = EXPERTS_CORPUS.filter((e) =>
        e.toLowerCase().includes(q)
      ).slice(0, 8);
      setSuggestions2(matches);
      setShowSuggestions2(matches.length > 0);
      setActiveIdx2(-1);
    }, 150);
    return () => clearTimeout(debounceRef2.current);
  }, [formData.dr2]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Comparison Analysis
  const ComparisonAnalysis = () => (
    <form onSubmit={handleSubmit}>
      <div className="comparison-section">
        <h5
          style={{ fontWeight: "700", color: "#1e293b", marginBottom: "20px" }}
        >
          Expert Comparison Analysis
        </h5>

        <div className="row mb-4">
          <div className="col-md-5">
            <label
              className="form-label"
              style={{ fontWeight: "600", color: "#374151" }}
            >
              Select First Expert/Doctor
            </label>
            <div
              className="search-control"
              ref={suggestionsRef1}
              style={{ position: "relative" }}
            >
              <select
                ref={dr1InputRef}
                className="form-select"
                name="dr1"
                value={formData.dr1}
                onChange={handleChange}
                style={{
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.1)",
                  padding: "12px 16px",
                  fontSize: "14px",
                }}
              >
                <option value="">-- Select First Expert/Doctor --</option>
                {EXPERTS_CORPUS.map((expert) => (
                  <option key={expert} value={expert}>
                    {expert}
                  </option>
                ))}
              </select>
            </div>
            {errors.dr1 && (
              <div
                style={{ color: "#dc2626", fontSize: "13px", marginTop: "6px" }}
              >
                {errors.dr1}
              </div>
            )}
          </div>

          <div className="col-md-2 d-flex align-items-center justify-content-center">
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "700",
                marginTop: "24px",
              }}
            >
              VS
            </div>
          </div>

          <div className="col-md-5">
            <label
              className="form-label"
              style={{ fontWeight: "600", color: "#374151" }}
            >
              Select Second Expert/Doctor
            </label>
            <div
              className="search-control"
              ref={suggestionsRef2}
              style={{ position: "relative" }}
            >
              <select
                ref={dr2InputRef}
                className="form-select"
                name="dr2"
                value={formData.dr2}
                onChange={handleChange}
                style={{
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.1)",
                  padding: "12px 16px",
                  fontSize: "14px",
                }}
              >
                <option value="">-- Select Second Expert/Doctor --</option>
                {EXPERTS_CORPUS.map((expert) => (
                  <option key={expert} value={expert}>
                    {expert}
                  </option>
                ))}
              </select>
              {errors.dr2 && (
                <div
                  style={{
                    color: "#dc2626",
                    fontSize: "13px",
                    marginTop: "6px",
                  }}
                >
                  {errors.dr2}
                </div>
              )}
            </div>
            {errors.dr2 && (
              <div
                style={{ color: "#dc2626", fontSize: "13px", marginTop: "6px" }}
              >
                {errors.dr2}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label
            className="form-label"
            style={{ fontWeight: "600", color: "#374151" }}
          >
            Patient Symptoms
          </label>
          <textarea
            ref={symptomsRef}
            className="form-control"
            rows={5}
            name="symptoms"
            value={formData.symptoms}
            onChange={handleChange}
            placeholder="Describe the patient's symptoms..."
            style={{
              borderRadius: "12px",
              border: "1px solid rgba(0,0,0,0.1)",
              fontSize: "14px",
              resize: "vertical",
            }}
          />

          {errors.symptoms && (
            <div
              style={{ color: "#dc2626", fontSize: "13px", marginTop: "6px" }}
            >
              {errors.symptoms}
            </div>
          )}
        </div>

        <div className="d-flex justify-content-end">
          <button
            type="submit"
            disabled={loading}
            className="btn"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              border: "none",
              borderRadius: "12px",
              padding: "12px 32px",
              fontWeight: "600",
              fontSize: "14px",
              color: "white",
            }}
          >
            {loading ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                Comparing Experts...
              </>
            ) : (
              <>
                Compare Experts
                <BsArrowRight className="ms-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );

  // Results rendering
  const renderResults = () => {
    if (!data) return null;

    if (data.error) {
      return (
        <div className="alert alert-danger" style={{ borderRadius: "12px" }}>
          <h6>Analysis Error</h6>
          <p className="mb-0">{data.error}</p>
        </div>
      );
    }

    if (data.raw_text) {
      return (
        <div
          className="analysis-result"
          style={{
            background: "linear-gradient(135deg, #ffffff, #f8fafc)",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <h5 style={{ fontWeight: "700", marginBottom: "16px" }}>
            Analysis Result
          </h5>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#374151",
            }}
          >
            {data?.raw_text}
          </pre>
        </div>
      );
    }

    // Render comparison results
    if (data.doctorA && data.doctorB) {
      return (
        <div className="comparison-results" style={{ marginTop: "32px" }}>
          <h4
            style={{
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: "24px",
            }}
          >
            Expert Analysis Comparison
          </h4>

          {/* Intersection/Common Remedies */}
          {data.intersection && data.intersection.length > 0 && (
            <div
              className="intersection-section mb-4"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                borderRadius: "16px",
                padding: "24px",
                color: "white",
              }}
            >
              <div className="d-flex align-items-center mb-3">
                <BsCheckCircle
                  style={{ fontSize: "24px", marginRight: "12px" }}
                />
                <h5 style={{ margin: 0, fontWeight: "700" }}>
                  Consensus Recommendations
                </h5>
              </div>
              {data.intersection.map((remedy, idx) => (
                <div
                  key={idx}
                  className="consensus-remedy"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: "12px",
                    padding: "16px",
                    marginBottom:
                      idx < data.intersection.length - 1 ? "12px" : 0,
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 style={{ margin: 0, fontWeight: "700" }}>
                      {remedy.remedy}
                    </h6>
                    <div className="scores">
                      <span
                        className="badge"
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          marginRight: "8px",
                        }}
                      >
                        Expert 1: {remedy.scoreA}%
                      </span>
                      <span
                        className="badge"
                        style={{ background: "rgba(255,255,255,0.2)" }}
                      >
                        Expert 2: {remedy.scoreB}%
                      </span>
                    </div>
                  </div>
                  {remedy.reasons && remedy.reasons.length > 0 && (
                    <div className="mt-2">
                      <small>Common factors: {remedy.reasons.join(", ")}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Individual Expert Results */}
          <div className="row">
            <div className="col-md-6">
              <div
                className="expert-results"
                style={{
                  background: "linear-gradient(135deg, #ffffff, #f8fafc)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: "16px",
                  padding: "24px",
                  height: "fit-content",
                }}
              >
                <div className="d-flex align-items-center mb-3">
                  <BsPerson
                    style={{
                      fontSize: "20px",
                      marginRight: "8px",
                      color: "#3b82f6",
                    }}
                  />
                  <h6
                    style={{ margin: 0, fontWeight: "700", color: "#1e293b" }}
                  >
                    {data.doctorA.name}
                  </h6>
                </div>

                {data.doctorA.recommendations.map((remedy, idx) => (
                  <div
                    key={idx}
                    className="remedy-card mb-3"
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: "12px",
                      padding: "16px",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6
                        style={{
                          margin: 0,
                          fontWeight: "600",
                          color: "#374151",
                        }}
                      >
                        {remedy.remedy}
                      </h6>
                      <span
                        className="badge"
                        style={{
                          background:
                            remedy.score >= 90
                              ? "#10b981"
                              : remedy.score >= 80
                                ? "#f59e0b"
                                : "#6b7280",
                          color: "white",
                          fontSize: "12px",
                        }}
                      >
                        {remedy.score}%
                      </span>
                    </div>

                    {remedy.keynotes && (
                      <div className="keynotes mb-2">
                        <small style={{ color: "#6b7280", fontWeight: "500" }}>
                          Key symptoms:
                        </small>
                        <div className="mt-1">
                          {remedy.keynotes.map((keynote, keyIdx) => (
                            <span
                              key={keyIdx}
                              className="badge me-1 mb-1"
                              style={{
                                background: "#e5e7eb",
                                color: "#374151",
                                fontSize: "11px",
                              }}
                            >
                              {keynote}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {remedy.matchedRubrics && (
                      <div className="matched-rubrics">
                        <small style={{ color: "#6b7280", fontWeight: "500" }}>
                          Matched rubrics ({remedy.matchedRubrics.length}):
                        </small>
                        <div className="mt-1">
                          {remedy.matchedRubrics
                            .slice(0, 2)
                            .map((rubric, rubricIdx) => (
                              <div
                                key={rubricIdx}
                                style={{ fontSize: "11px", color: "#4b5563" }}
                              >
                                • {rubric.rubric}{" "}
                                <span style={{ color: "#9ca3af" }}>
                                  ({rubric.book})
                                </span>
                              </div>
                            ))}
                          {remedy.matchedRubrics.length > 2 && (
                            <small style={{ color: "#6b7280" }}>
                              +{remedy.matchedRubrics.length - 2} more rubrics
                            </small>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="col-md-6">
              <div
                className="expert-results"
                style={{
                  background: "linear-gradient(135deg, #ffffff, #f8fafc)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: "16px",
                  padding: "24px",
                  height: "fit-content",
                }}
              >
                <div className="d-flex align-items-center mb-3">
                  <BsPerson
                    style={{
                      fontSize: "20px",
                      marginRight: "8px",
                      color: "#8b5cf6",
                    }}
                  />
                  <h6
                    style={{ margin: 0, fontWeight: "700", color: "#1e293b" }}
                  >
                    {data.doctorB.name}
                  </h6>
                </div>

                {data.doctorB.recommendations.map((remedy, idx) => (
                  <div
                    key={idx}
                    className="remedy-card mb-3"
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: "12px",
                      padding: "16px",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6
                        style={{
                          margin: 0,
                          fontWeight: "600",
                          color: "#374151",
                        }}
                      >
                        {remedy.remedy}
                      </h6>
                      <span
                        className="badge"
                        style={{
                          background:
                            remedy.score >= 90
                              ? "#10b981"
                              : remedy.score >= 80
                                ? "#f59e0b"
                                : "#6b7280",
                          color: "white",
                          fontSize: "12px",
                        }}
                      >
                        {remedy.score}%
                      </span>
                    </div>

                    {remedy.keynotes && (
                      <div className="keynotes">
                        <small style={{ color: "#6b7280", fontWeight: "500" }}>
                          Key symptoms:
                        </small>
                        <div className="mt-1">
                          {remedy.keynotes.map((keynote, keyIdx) => (
                            <span
                              key={keyIdx}
                              className="badge me-1 mb-1"
                              style={{
                                background: "#e5e7eb",
                                color: "#374151",
                                fontSize: "11px",
                              }}
                            >
                              {keynote}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Meta Info */}
          {metaInfo && (
            <div
              className="analysis-meta mt-4"
              style={{
                background: "#f8fafc",
                border: "1px solid rgba(0,0,0,0.05)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div className="d-flex align-items-center">
                <BsInfoCircle
                  style={{ color: "#6b7280", marginRight: "8px" }}
                />
                <small style={{ color: "#6b7280" }}>
                  Analysis powered by {metaInfo.model} • Generated on{" "}
                  {new Date(metaInfo.generatedAt).toLocaleString()}
                </small>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="expert-system-container"
      style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}
    >
      {/* Header */}
      <div className="header-section mb-5">
        <h2
          style={{ fontWeight: "800", color: "#1e293b", marginBottom: "8px" }}
        >
          Homeopathic Expert Systems
        </h2>
        <p style={{ color: "#64748b", fontSize: "16px", marginBottom: "0" }}>
          Advanced AI-powered analysis using classical homeopathic methodologies
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation mb-4">
        <div
          className="nav nav-pills"
          style={{
            background: "#f1f5f9",
            borderRadius: "16px",
            padding: "8px",
          }}
        >
          <button
            className={`nav-link ${activeTab === "compare" ? "active" : ""}`}
            onClick={() => setActiveTab("compare")}
            style={{
              background: activeTab === "compare" ? "white" : "transparent",
              border: "none",
              borderRadius: "12px",
              padding: "12px 24px",
              fontWeight: "600",
              color: activeTab === "compare" ? "#1e293b" : "#64748b",
              transition: "all 0.2s",
            }}
          >
            <BsBarChart className="me-2" />
            Expert Comparison
          </button>
        </div>
      </div>

      {/* Expert System Selection (for single analysis) */}
      {activeTab === "single" && (
        <div className="expert-systems-grid mb-5">
          <h4
            style={{
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: "20px",
            }}
          >
            Choose Your Expert System
          </h4>
          <div className="row g-3"></div>
        </div>
      )}

      {/* Analysis Form */}
      <div className="analysis-form-section mb-5">
        {activeTab === "single" ? <></> : <ComparisonAnalysis />}
      </div>

      {/* Results Section */}
      <div ref={resultsRef}>{renderResults()}</div>
    </div>
  );
};

export default ExpertSystem;
