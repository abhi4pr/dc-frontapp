import React, { useState, useEffect, useRef } from "react";
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

// Mock API and context for demo
const mockApi = {
  post: async (url, data) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      data: {
        data: {
          doctorA: {
            name: data.dr1,
            recommendations: [
              {
                remedy: "Arsenicum Album",
                score: 92,
                keynotes: ["Anxiety", "Restlessness", "Burning pains"],
                matchedRubrics: [
                  {
                    rubric: "Mind; Anxiety",
                    weight: 3,
                    book: "Kent's Repertory",
                  },
                  {
                    rubric: "Stomach; Burning",
                    weight: 2,
                    book: "Boericke MM",
                  },
                ],
                sources: [
                  {
                    title: "Kent's Materia Medica",
                    excerpt: "Great restlessness and anxiety...",
                  },
                ],
              },
              {
                remedy: "Nux Vomica",
                score: 87,
                keynotes: [
                  "Irritability",
                  "Digestive issues",
                  "Type A personality",
                ],
                matchedRubrics: [
                  {
                    rubric: "Mind; Irritability",
                    weight: 3,
                    book: "Kent's Repertory",
                  },
                ],
              },
            ],
          },
          doctorB: {
            name: data.dr2,
            recommendations: [
              {
                remedy: "Arsenicum Album",
                score: 89,
                keynotes: [
                  "Fear of death",
                  "Perfectionist",
                  "Restless at night",
                ],
              },
              {
                remedy: "Phosphorus",
                score: 84,
                keynotes: ["Sympathy", "Hemorrhages", "Tall slim build"],
              },
            ],
          },
          intersection: [
            {
              remedy: "Arsenicum Album",
              scoreA: 92,
              scoreB: 89,
              reasons: ["Anxiety", "Restlessness"],
            },
          ],
        },
        meta: {
          model: "GPT-4 Homeopathy",
          algorithmVersion: "v2.1",
          generatedAt: new Date().toISOString(),
        },
      },
    };
  },
};

const mockUserContext = {
  user: { _id: "demo_user", hit_count: 150 },
};

// Expert Systems Configuration
const EXPERT_SYSTEMS = {
  kent: {
    name: "Kent's Philosophy & Method",
    description: "Hierarchical symptom analysis with mental symptoms priority",
    color: "#4f46e5",
    icon: BsTree,
    principles: [
      "Mental symptoms take precedence",
      "Hierarchical symptom evaluation",
      "Constitutional approach",
      "Totality of symptoms",
    ],
  },
  boericke: {
    name: "Boericke's Clinical Approach",
    description: "Pathological correlations with remedy selection",
    color: "#059669",
    icon: BsActivity,
    principles: [
      "Clinical pathological correlation",
      "Therapeutic indication based",
      "Disease-remedy relationship",
      "Physiological remedy action",
    ],
  },
  boenninghausen: {
    name: "Boenninghausen's Method",
    description: "Characteristic symptoms and totality concepts",
    color: "#dc2626",
    icon: BsGrid3X3,
    principles: [
      "Characteristic symptoms focus",
      "Complete symptom totality",
      "Modalities importance",
      "Concomitant symptoms",
    ],
  },
  hahnemann: {
    name: "Hahnemann's Organon Principles",
    description: "Individualization and similimum selection",
    color: "#7c2d12",
    icon: BsBook,
    principles: [
      "Similia similibus curentur",
      "Individual case taking",
      "Minimum dose principle",
      "Single remedy approach",
    ],
  },
  vijayakar: {
    name: "Dr. Prafull Vijayakar's Method",
    description: "7 levels of suppression and constitutional analysis",
    color: "#be123c",
    icon: BsBarChart,
    principles: [
      "7 levels of suppression",
      "Genetic constitution analysis",
      "Acute prescribing method",
      "Systematic case analysis",
    ],
  },
  sankaran: {
    name: "Sankaran's Systematic Method",
    description: "Kingdom-based classification and vital sensation",
    color: "#9333ea",
    icon: BsEye,
    principles: [
      "Kingdom classification",
      "Vital sensation concept",
      "Other song method",
      "Source-based prescribing",
    ],
  },
  scholten: {
    name: "Scholten's Element Theory",
    description: "Periodic table approach to homeopathic elements",
    color: "#0891b2",
    icon: BsGrid3X3,
    principles: [
      "Periodic table correlation",
      "Element group characteristics",
      "Stage and series analysis",
      "Systematic element study",
    ],
  },
  radar: {
    name: "Radar-Style Analysis",
    description: "Commercial software logic with statistical analysis",
    color: "#ea580c",
    icon: BsShield,
    principles: [
      "Statistical remedy ranking",
      "Weighted symptom analysis",
      "Cross-referenced repertorization",
      "Clinical verification database",
    ],
  },
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
  const { user } = mockUserContext;

  // Form state
  const [formData, setFormData] = useState({ dr1: "", dr2: "", symptoms: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [metaInfo, setMetaInfo] = useState(null);

  // Expert system selection
  const [selectedExpertSystem, setSelectedExpertSystem] = useState("kent");
  const [activeTab, setActiveTab] = useState("single");
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
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

      const response = await mockApi.post(
        `/ai/send_compare_data/${user?._id}`,
        { dr1: formData.dr1, dr2: formData.dr2, symptoms: formData.symptoms }
      );

      if (!mountedRef.current) return;

      setData(response.data.data);
      setMetaInfo(response.data.meta || null);

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

  // Expert System Card Component
  const ExpertSystemCard = ({ systemKey, system, isSelected, onSelect }) => {
    const IconComponent = system.icon;
    return (
      <div
        className={`expert-system-card ${isSelected ? "selected" : ""}`}
        onClick={() => onSelect(systemKey)}
        style={{
          background: isSelected
            ? `linear-gradient(135deg, ${system.color}15, ${system.color}08)`
            : "linear-gradient(135deg, #ffffff, #f8fafc)",
          border: isSelected
            ? `2px solid ${system.color}`
            : "1px solid rgba(0,0,0,0.06)",
          borderRadius: "16px",
          padding: "20px",
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          overflow: "hidden",
          height: "100%",
        }}
      >
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div
            className="expert-icon"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${system.color}, ${system.color}CC)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "20px",
            }}
          >
            <IconComponent />
          </div>
          {isSelected && (
            <BsStarFill style={{ color: system.color, fontSize: "16px" }} />
          )}
        </div>

        <h5
          style={{
            fontWeight: "700",
            fontSize: "16px",
            color: "#1e293b",
            marginBottom: "8px",
            lineHeight: "1.4",
          }}
        >
          {system.name}
        </h5>

        <p
          style={{
            fontSize: "14px",
            color: "#64748b",
            marginBottom: "16px",
            lineHeight: "1.5",
          }}
        >
          {system.description}
        </p>

        <div className="key-principles">
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            Key Principles:
          </div>
          <ul
            style={{
              fontSize: "12px",
              color: "#6b7280",
              paddingLeft: "16px",
              margin: 0,
            }}
          >
            {system.principles.slice(0, 2).map((principle, idx) => (
              <li key={idx} style={{ marginBottom: "4px" }}>
                {principle}
              </li>
            ))}
            <li style={{ color: system.color, fontWeight: "500" }}>
              +{system.principles.length - 2} more principles
            </li>
          </ul>
        </div>

        {isSelected && (
          <div
            className="selected-indicator"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: `linear-gradient(90deg, ${system.color}, ${system.color}66)`,
            }}
          />
        )}
      </div>
    );
  };

  // Single Expert System Analysis
  const SingleExpertAnalysis = () => {
    const selectedSystem = EXPERT_SYSTEMS[selectedExpertSystem];
    return (
      <div className="single-expert-analysis">
        <div
          className="expert-header mb-4"
          style={{
            background: `linear-gradient(135deg, ${selectedSystem.color}15, ${selectedSystem.color}08)`,
            border: `1px solid ${selectedSystem.color}30`,
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: `linear-gradient(135deg, ${selectedSystem.color}, ${selectedSystem.color}CC)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "24px",
                  marginRight: "16px",
                }}
              >
                <selectedSystem.icon />
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: "700", color: "#1e293b" }}>
                  {selectedSystem.name}
                </h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                  {selectedSystem.description}
                </p>
              </div>
            </div>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowSystemDetails(!showSystemDetails)}
            >
              <BsQuestionCircle className="me-2" />
              Details
            </button>
          </div>

          {showSystemDetails && (
            <div
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid rgba(0,0,0,0.1)" }}
            >
              <h6
                style={{
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "12px",
                }}
              >
                Core Principles & Methodology:
              </h6>
              <div className="row">
                {selectedSystem.principles.map((principle, idx) => (
                  <div key={idx} className="col-md-6 mb-2">
                    <div className="d-flex align-items-center">
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: selectedSystem.color,
                          marginRight: "8px",
                        }}
                      />
                      <span style={{ fontSize: "13px", color: "#4b5563" }}>
                        {principle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="case-input-section"
            style={{
              background: "linear-gradient(135deg, #ffffff, #f8fafc)",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h5
              style={{
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "20px",
              }}
            >
              Enter Case Details for Analysis
            </h5>

            <div className="mb-4">
              <label
                className="form-label"
                style={{ fontWeight: "600", color: "#374151" }}
              >
                Patient Symptoms, Modalities & Generals
              </label>
              <textarea
                className="form-control"
                rows={6}
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                placeholder="Describe the patient's symptoms, modalities, and generals for analysis by this expert system..."
                style={{
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: "12px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
              {errors.symptoms && (
                <div
                  style={{
                    color: "#dc2626",
                    fontSize: "13px",
                    marginTop: "6px",
                  }}
                >
                  {errors.symptoms}
                </div>
              )}
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <label
                  className="form-label"
                  style={{ fontWeight: "600", color: "#374151" }}
                >
                  Analysis Depth
                </label>
                <select className="form-select" style={{ borderRadius: "8px" }}>
                  <option>Quick Analysis</option>
                  <option>Detailed Analysis</option>
                  <option>Comprehensive Analysis</option>
                </select>
              </div>
              <div className="col-md-6">
                <label
                  className="form-label"
                  style={{ fontWeight: "600", color: "#374151" }}
                >
                  Case Type
                </label>
                <select className="form-select" style={{ borderRadius: "8px" }}>
                  <option>Acute Case</option>
                  <option>Chronic Case</option>
                  <option>Constitutional</option>
                  <option>Follow-up</option>
                </select>
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <button
                type="submit"
                disabled={loading}
                className="btn"
                style={{
                  background: `linear-gradient(135deg, ${selectedSystem.color}, ${selectedSystem.color}CC)`,
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
                    Analyzing with {selectedSystem.name}...
                  </>
                ) : (
                  <>
                    Analyze with {selectedSystem.name}
                    <BsArrowRight className="ms-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

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
              <input
                ref={dr1InputRef}
                className="form-control"
                name="dr1"
                value={formData.dr1}
                onChange={handleChange}
                placeholder="Enter expert name (e.g., Kent)"
                autoComplete="off"
                style={{
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.1)",
                  padding: "12px 16px",
                  fontSize: "14px",
                }}
              />
              {showSuggestions1 && suggestions1.length > 0 && (
                <div
                  className="suggestions-dropdown"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {suggestions1.map((suggestion, idx) => (
                    <div
                      key={suggestion}
                      className={`suggestion-item ${idx === activeIdx1 ? "active" : ""}`}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        borderBottom:
                          idx < suggestions1.length - 1
                            ? "1px solid rgba(0,0,0,0.05)"
                            : "none",
                      }}
                      onClick={() => {
                        handleChange({
                          target: { name: "dr1", value: suggestion },
                        });
                        setShowSuggestions1(false);
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
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
              <input
                ref={dr2InputRef}
                className="form-control"
                name="dr2"
                value={formData.dr2}
                onChange={handleChange}
                placeholder="Enter expert name (e.g., Hahnemann)"
                autoComplete="off"
                style={{
                  borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.1)",
                  padding: "12px 16px",
                  fontSize: "14px",
                }}
              />
              {showSuggestions2 && suggestions2.length > 0 && (
                <div
                  className="suggestions-dropdown"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {suggestions2.map((suggestion, idx) => (
                    <div
                      key={suggestion}
                      className={`suggestion-item ${idx === activeIdx2 ? "active" : ""}`}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        borderBottom:
                          idx < suggestions2.length - 1
                            ? "1px solid rgba(0,0,0,0.05)"
                            : "none",
                      }}
                      onClick={() => {
                        handleChange({
                          target: { name: "dr2", value: suggestion },
                        });
                        setShowSuggestions2(false);
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
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
            className="form-control"
            rows={5}
            name="symptoms"
            value={formData.symptoms}
            onChange={handleChange}
            placeholder="Describe the patient's symptoms, modalities, and generals for comparison..."
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

    if (typeof data === "string") {
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
            {data}
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
            className={`nav-link ${activeTab === "single" ? "active" : ""}`}
            onClick={() => setActiveTab("single")}
            style={{
              background: activeTab === "single" ? "white" : "transparent",
              border: "none",
              borderRadius: "12px",
              padding: "12px 24px",
              fontWeight: "600",
              color: activeTab === "single" ? "#1e293b" : "#64748b",
              transition: "all 0.2s",
            }}
          >
            <BsLightbulb className="me-2" />
            Single Expert Analysis
          </button>
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
          <div className="row g-3">
            {Object.entries(EXPERT_SYSTEMS).map(([key, system]) => (
              <div key={key} className="col-md-6 col-lg-4">
                <ExpertSystemCard
                  systemKey={key}
                  system={system}
                  isSelected={selectedExpertSystem === key}
                  onSelect={setSelectedExpertSystem}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Form */}
      <div className="analysis-form-section mb-5">
        {activeTab === "single" ? (
          <SingleExpertAnalysis />
        ) : (
          <ComparisonAnalysis />
        )}
      </div>

      {/* Results Section */}
      <div ref={resultsRef}>{renderResults()}</div>
    </div>
  );
};

export default ExpertSystem;
