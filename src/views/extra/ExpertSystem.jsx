import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Button,
  Badge,
  Spinner,
  Modal,
  Nav,
  Tab,
  Accordion,
  ProgressBar,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { user } = mockUserContext;

  // Preserve original form fields and names exactly
  const [formData, setFormData] = useState({ dr1: "", dr2: "", symptoms: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [metaInfo, setMetaInfo] = useState(null);

  // New state for expert system selection
  const [selectedExpertSystem, setSelectedExpertSystem] = useState("kent");
  const [activeTab, setActiveTab] = useState("single");
  const [showSystemDetails, setShowSystemDetails] = useState(false);

  // Typeahead states (preserved)
  const [suggestions1, setSuggestions1] = useState([]);
  const [showSuggestions1, setShowSuggestions1] = useState(false);
  const [suggestions2, setSuggestions2] = useState([]);
  const [showSuggestions2, setShowSuggestions2] = useState(false);
  const [activeIdx1, setActiveIdx1] = useState(-1);
  const [activeIdx2, setActiveIdx2] = useState(-1);

  // UI controls (preserved)
  const [minConfidence, setMinConfidence] = useState(0);
  const [expertPreset, setExpertPreset] = useState("default");
  const [repertoryEdition, setRepertoryEdition] = useState("Kent (default)");

  // Refs (preserved)
  const dr1InputRef = useRef(null);
  const dr2InputRef = useRef(null);
  const suggestionsRef1 = useRef(null);
  const suggestionsRef2 = useRef(null);
  const resultsRef = useRef(null);
  const debounceRef1 = useRef(null);
  const debounceRef2 = useRef(null);
  const requestAbortRef = useRef(null);
  const mountedRef = useRef(true);

  // Modal states (preserved)
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [explainFor, setExplainFor] = useState(null);

  // Preserve original handleChange exactly
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // Preserve original handleSubmit exactly
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (activeTab === "comparison" && formData.dr1 === formData.dr2) {
      alert("Doctor 1 and Doctor 2 must be different.");
      return;
    }

    if (activeTab === "comparison") {
      if (!formData.dr1 || !formData.dr2 || !formData.symptoms) {
        setErrors({
          dr1: !formData.dr1 ? "Select Doctor 1" : null,
          dr2: !formData.dr2 ? "Select Doctor 2" : null,
          symptoms: !formData.symptoms ? "Enter patient symptoms" : null,
        });
        return;
      }
    } else {
      if (!formData.symptoms) {
        setErrors({
          symptoms: "Enter patient symptoms",
        });
        return;
      }
    }

    try {
      setLoading(true);

      // Preserve exact POST payload and endpoint structure
      const response = await mockApi.post(
        `/ai/send_compare_data/${user?._id}`,
        {
          dr1:
            activeTab === "single"
              ? EXPERT_SYSTEMS[selectedExpertSystem].name
              : formData.dr1,
          dr2: activeTab === "single" ? "System Analysis" : formData.dr2,
          symptoms: formData.symptoms,
          expertSystem: activeTab === "single" ? selectedExpertSystem : null,
          analysisType: activeTab,
        }
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

  // Typeahead logic (preserved)
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

  // Cleanup
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
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowSystemDetails(!showSystemDetails)}
            >
              <BsQuestionCircle className="me-2" />
              Details
            </Button>
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

        <Form onSubmit={handleSubmit}>
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

            <Form.Group className="mb-4">
              <Form.Label style={{ fontWeight: "600", color: "#374151" }}>
                Patient Symptoms, Modalities & Generals
              </Form.Label>
              <Form.Control
                as="textarea"
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
            </Form.Group>

            <div className="row mb-4">
              <div className="col-md-6">
                <Form.Label style={{ fontWeight: "600", color: "#374151" }}>
                  Analysis Depth
                </Form.Label>
                <Form.Select style={{ borderRadius: "8px" }}>
                  <option>Quick Analysis</option>
                  <option>Detailed Analysis</option>
                  <option>Comprehensive Analysis</option>
                </Form.Select>
              </div>
              <div className="col-md-6">
                <Form.Label style={{ fontWeight: "600", color: "#374151" }}>
                  Case Type
                </Form.Label>
                <Form.Select style={{ borderRadius: "8px" }}>
                  <option>Acute Case</option>
                  <option>Chronic Case</option>
                  <option>Constitutional</option>
                  <option>Follow-up</option>
                </Form.Select>
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <Button
                type="submit"
                disabled={loading}
                style={{
                  background: `linear-gradient(135deg, ${selectedSystem.color}, ${selectedSystem.color}CC)`,
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 32px",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Analyzing with {selectedSystem.name}...
                  </>
                ) : (
                  <>
                    Analyze with {selectedSystem.name}
                    <BsArrowRight className="ms-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Form>
      </div>
    );
  };

  // Comparison Analysis (preserved structure)
  const ComparisonAnalysis = () => (
    <Form onSubmit={handleSubmit}>
      <div className="comparison-section">
        <h5
          style={{ fontWeight: "700", color: "#1e293b", marginBottom: "20px" }}
        >
          Expert Comparison Analysis
        </h5>

        <Row className="mb-4">
          <Col md={5}>
            <Form.Label style={{ fontWeight: "600", color: "#374151" }}>
              Select First Expert/Doctor
            </Form.Label>
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
          </Col>

          <Col
            md={2}
            className="d-flex align-items-center justify-content-center"
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(181deg, rgb(10, 87, 87), rgb(0, 168, 165))",
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
          </Col>

          <Col md={5}>
            <Form.Label style={{ fontWeight: "600", color: "#374151" }}>
              Select Second Expert/Doctor
            </Form.Label>
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
          </Col>
        </Row>

        <Form.Group className="mb-4">
          <Form.Label style={{ fontWeight: "600", color: "#374151" }}>
            Patient Symptoms
          </Form.Label>
          <Form.Control
            as="textarea"
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
        </Form.Group>

        <div className="d-flex justify-content-end">
          <Button
            type="submit"
            disabled={loading}
            style={{
              background: "linear-gradient(181deg, rgb(10, 87, 87), rgb(0, 168, 165))",
              border: "none",
              borderRadius: "12px",
              padding: "12px 32px",
              fontWeight: "600",
              fontSize: "14px",
            }}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Comparing Experts...
              </>
            ) : (
              <>
                Compare Experts
                <BsArrowRight className="ms-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Form>
  );

  // Results rendering (enhanced)
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

    // Enhanced results display for comparison mode
    if (data.doctorA && data.doctorB) {
      return (
        <div className="comparison-results">
          <div
            className="results-header mb-4"
            style={{
              background: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: "16px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <h4
              style={{
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "8px",
              }}
            >
              Expert Comparison Analysis Complete
            </h4>
            <p style={{ color: "#64748b", marginBottom: 0 }}>
              Comparing methodologies of {data.doctorA.name} vs{" "}
              {data.doctorB.name}
            </p>
          </div>

          {/* Intersection Results */}
          {data.intersection && data.intersection.length > 0 && (
            <div className="intersection-section mb-4">
              <div
                className="intersection-header"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <h5 style={{ color: "white", margin: 0, fontWeight: "700" }}>
                  🎯 Common Recommendations
                </h5>
                <p
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: "14px",
                    margin: 0,
                  }}
                >
                  Remedies both experts agree on
                </p>
              </div>

              {data.intersection.map((item, idx) => (
                <div
                  key={idx}
                  className="intersection-remedy mb-3"
                  style={{
                    background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h6
                      style={{ fontWeight: "700", color: "#065f46", margin: 0 }}
                    >
                      {item.remedy}
                    </h6>
                    <div className="scores d-flex gap-2">
                      <Badge style={{ background: "#059669" }}>
                        {data.doctorA.name}: {item.scoreA}%
                      </Badge>
                      <Badge style={{ background: "#0891b2" }}>
                        {data.doctorB.name}: {item.scoreB}%
                      </Badge>
                    </div>
                  </div>
                  <div className="common-reasons">
                    <small style={{ color: "#047857", fontWeight: "600" }}>
                      Common factors:
                    </small>
                    <span style={{ color: "#065f46", marginLeft: "8px" }}>
                      {item.reasons.join(", ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Individual Expert Results */}
          <Row>
            <Col md={6}>
              <div
                className="expert-results"
                style={{
                  background: "linear-gradient(135deg, #ffffff, #f8fafc)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: "16px",
                  padding: "20px",
                }}
              >
                <div
                  className="expert-header mb-3"
                  style={{
                    borderBottom: "2px solid #3b82f6",
                    paddingBottom: "12px",
                  }}
                >
                  <h5
                    style={{ fontWeight: "700", color: "#1e40af", margin: 0 }}
                  >
                    {data.doctorA.name}'s Analysis
                  </h5>
                </div>

                {data.doctorA.recommendations.map((remedy, idx) => (
                  <div
                    key={idx}
                    className="remedy-card mb-3"
                    style={{
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                      borderRadius: "8px",
                      padding: "16px",
                      background: "rgba(59, 130, 246, 0.02)",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6
                        style={{
                          fontWeight: "600",
                          color: "#1e293b",
                          margin: 0,
                        }}
                      >
                        {remedy.remedy}
                      </h6>
                      <Badge bg="primary">{remedy.score}%</Badge>
                    </div>
                    <div className="keynotes mb-2">
                      <small style={{ color: "#6b7280", fontWeight: "600" }}>
                        Key symptoms:{" "}
                      </small>
                      <span style={{ fontSize: "13px", color: "#4b5563" }}>
                        {remedy.keynotes.join(", ")}
                      </span>
                    </div>
                    {remedy.matchedRubrics && (
                      <div className="rubrics">
                        <small style={{ color: "#6b7280", fontWeight: "600" }}>
                          Rubrics:{" "}
                        </small>
                        {remedy.matchedRubrics.map((rubric, ridx) => (
                          <Badge
                            key={ridx}
                            variant="outline-secondary"
                            className="me-1"
                            style={{ fontSize: "11px" }}
                          >
                            {rubric.rubric} ({rubric.weight})
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Col>

            <Col md={6}>
              <div
                className="expert-results"
                style={{
                  background: "linear-gradient(135deg, #ffffff, #f8fafc)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderRadius: "16px",
                  padding: "20px",
                }}
              >
                <div
                  className="expert-header mb-3"
                  style={{
                    borderBottom: "2px solid #0891b2",
                    paddingBottom: "12px",
                  }}
                >
                  <h5
                    style={{ fontWeight: "700", color: "#0e7490", margin: 0 }}
                  >
                    {data.doctorB.name}'s Analysis
                  </h5>
                </div>

                {data.doctorB.recommendations.map((remedy, idx) => (
                  <div
                    key={idx}
                    className="remedy-card mb-3"
                    style={{
                      border: "1px solid rgba(8, 145, 178, 0.2)",
                      borderRadius: "8px",
                      padding: "16px",
                      background: "rgba(8, 145, 178, 0.02)",
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6
                        style={{
                          fontWeight: "600",
                          color: "#1e293b",
                          margin: 0,
                        }}
                      >
                        {remedy.remedy}
                      </h6>
                      <Badge style={{ background: "#0891b2" }}>
                        {remedy.score}%
                      </Badge>
                    </div>
                    <div className="keynotes">
                      <small style={{ color: "#6b7280", fontWeight: "600" }}>
                        Key symptoms:{" "}
                      </small>
                      <span style={{ fontSize: "13px", color: "#4b5563" }}>
                        {remedy.keynotes.join(", ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>

          {/* Meta Information */}
          {metaInfo && (
            <div
              className="meta-info mt-4"
              style={{
                background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <small style={{ color: "#92400e", fontWeight: "600" }}>
                    Analysis powered by {metaInfo.model} • Version{" "}
                    {metaInfo.algorithmVersion}
                  </small>
                </div>
                <small style={{ color: "#a16207" }}>
                  Generated: {new Date(metaInfo.generatedAt).toLocaleString()}
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
      className="expert-system-page"
      style={{ minHeight: "100vh", background: "#f8fafc" }}
    >
      <div className="container py-4">
        {/* Header */}
        <div
          className="page-header header-test mb-5"
          style={{
//             background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: "20px",
            padding: "40px",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "200px",
              height: "200px",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "50%",
              transform: "translate(50%, -50%)",
            }}
          />
          <h1
            style={{
              fontWeight: "800",
              fontSize: "2.5rem",
              marginBottom: "16px",
            color: "white",
            }}
          >
            Homeopathic Expert Systems
          </h1>
          <p style={{ fontSize: "1.1rem", opacity: 0.9, marginBottom: 0 }}>
            Advanced AI-powered analysis using classical homeopathic
            methodologies
          </p>
        </div>

        {/* Mode Selection Tabs */}
        <div className="mode-selection mb-5">
          <Nav
            variant="pills"
            className="justify-content-center"
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "8px",
            }}
          >
            <Nav.Item>
              <Nav.Link
                active={activeTab === "single"}
                onClick={() => setActiveTab("single")}
                style={{
                  borderRadius: "12px",
                  fontWeight: "600",
                  padding: "12px 24px",
                  margin: "0 4px",
// color: "white",
                }}
              >
                <BsLightbulb className="me-2" />
                Single Expert Analysis
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeTab === "comparison"}
                onClick={() => setActiveTab("comparison")}
                style={{
                  borderRadius: "12px",
                  fontWeight: "600",
                  padding: "12px 24px",
                  margin: "0 4px",
                // color: "white",
                }}
              >
                <BsBarChart className="me-2" />
                Expert Comparison
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </div>

        {/* Expert System Selection (for single mode) */}
        {activeTab === "single" && (
          <div className="expert-system-selection mb-5">
            <h4
              style={{
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              Choose Your Expert System
            </h4>
            <div className="row">
              {Object.entries(EXPERT_SYSTEMS).map(([key, system]) => (
                <div key={key} className="col-lg-3 col-md-4 col-sm-6 mb-4">
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
        <div className="analysis-form mb-5">
          {activeTab === "single" ? (
            <SingleExpertAnalysis />
          ) : (
            <ComparisonAnalysis />
          )}
        </div>

        {/* Results Section */}
        {(data || loading) && (
          <div ref={resultsRef} className="results-section">
            <div
              className="results-container"
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "32px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              }}
            >
              {loading ? (
                <div className="loading-state text-center py-5">
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      margin: "0 auto 24px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Spinner
                      style={{ width: "32px", height: "32px", color: "white" }}
                    />
                  </div>
                  <h5
                    style={{
                      fontWeight: "700",
                      color: "#1e293b",
                      marginBottom: "8px",
                    }}
                  >
                    Analyzing Case...
                  </h5>
                  <p style={{ color: "#64748b", marginBottom: 0 }}>
                    {activeTab === "single"
                      ? `Applying ${EXPERT_SYSTEMS[selectedExpertSystem].name} methodology`
                      : "Comparing expert approaches"}
                  </p>
                  <ProgressBar
                    animated
                    now={100}
                    style={{
                      height: "6px",
                      marginTop: "20px",
                      background: "rgba(0,0,0,0.1)",
                      borderRadius: "3px",
                    }}
                  />
                </div>
              ) : (
                renderResults()
              )}
            </div>
          </div>
        )}
      </div>

      {/* Explanation Modal */}
      <Modal
        show={explainModalOpen}
        onHide={() => setExplainModalOpen(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Remedy Explanation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {explainFor && (
            <div>
              <h5>{explainFor.remedy}</h5>
              <p>
                <strong>Match Score:</strong> {explainFor.score}%
              </p>
              <p>
                <strong>Key Symptoms:</strong> {explainFor.keynotes.join(", ")}
              </p>
              {explainFor.matchedRubrics && (
                <div>
                  <h6>Matched Repertory Rubrics:</h6>
                  <ul>
                    {explainFor.matchedRubrics.map((rubric, idx) => (
                      <li key={idx}>
                        <strong>{rubric.rubric}</strong> (Weight:{" "}
                        {rubric.weight}, Source: {rubric.book})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {explainFor.sources && (
                <div>
                  <h6>Reference Sources:</h6>
                  {explainFor.sources.map((source, idx) => (
                    <div key={idx} className="mb-2">
                      <strong>{source.title}:</strong>
                      <p style={{ fontSize: "14px", fontStyle: "italic" }}>
                        "{source.excerpt}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setExplainModalOpen(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ExpertSystem;