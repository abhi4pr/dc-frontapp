// CaseIntakes.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  Card,
  Form,
  Button,
  ProgressBar,
  Col,
  Row,
  InputGroup,
  Modal,
  Offcanvas,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { API_URL } from "../../constants";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utility/api";
import { UserContext } from "../../contexts/UserContext";
import {
  FaUser,
  FaShieldAlt,
  FaHeart,
  FaBrain,
  FaClock,
  FaFileMedical,
  FaChevronRight,
  FaChevronLeft,
  FaPlus,
  FaTrash,
  FaClipboardList,
  FaPrint,
  FaBars,
} from "react-icons/fa";

/*
  FINAL single-file CaseIntakes.jsx
  - Preserves: component name and all handler names and input names from your original contract.
  - Adds: comprehensive homeopathic clinical fields (miasm, constitution, energy, reactivity, physique, vitals, suppressed conditions, acute/chronic axis, birth/development history, sensitivities, keynotes, expanded modalities).
  - Keeps: single-file, inline styles, Offcanvas mobile sidebar behavior (no duplication), responsive single-column mobile layout.
  - Important: I did not remove or rename any existing handler, input name, or logic you required.
*/

const sections = [
  { id: 1, key: "demographics", label: "Demographics", icon: <FaUser /> },
  { id: 2, key: "risk", label: "Risk Assessment", icon: <FaShieldAlt /> },
  { id: 3, key: "chief", label: "Chief Complaint", icon: <FaHeart /> },
  { id: 4, key: "constitutional", label: "Constitutional", icon: <FaBrain /> },
  { id: 5, key: "mentals", label: "Mental State", icon: <FaClock /> },
  { id: 6, key: "modalities", label: "Modalities", icon: <FaClock /> },
  { id: 7, key: "gynaec", label: "Gynaec/Systems", icon: <FaFileMedical /> },
  {
    id: 8,
    key: "records",
    label: "Records & Summary",
    icon: <FaFileMedical />,
  },
];

const initialForm = {
  // --- Demographics & vitals
  patientname: "",
  patientage: "",
  patientgender: "",
  patientemail: "",
  patientphone: "",
  patientaddress: "",
  height_cm: "",
  weight_kg: "",
  bmi: "",
  pulse: "",
  bp_systolic: "",
  bp_diastolic: "",
  temperature: "",
  // --- Risk / background
  suicide: "",
  addiction: [],
  support: "",
  medication: "",
  sensitivities: "", // allergies / drug reactions
  // --- Chief / timeline
  todayconcern: "",
  origintrigger: "",
  pattern: "",
  impact: "",
  timeline: [],
  followups: [],
  // --- Constitutional & homeopathic specifics
  constitution: "", // e.g., lean, muscular, adipose
  energy: "", // high / low / variable
  reactivity: "", // hyper / hypo / normal
  physique: "", // ectomorph/mesomorph/endomorph or free text
  miasm: [], // psora, sycosis, syphilis, tubercular, cancer
  suppressed_conditions: [], // list of suppressed conditions
  acuteOrChronic: "chronic", // 'acute' or 'chronic'
  keynotes: "",
  temperament: "", // sanguine/choleric/... or text
  familyhistory: "",
  birthHistory: "",
  developmentalHistory: "",
  // --- Generals / modalities (expanded)
  thermal: "",
  thirst: "",
  appetiteDetails: "",
  sweatType: "",
  urineDetails: "",
  stoolDetails: "",
  modalities_position: [],
  modalities_motion: [],
  modalities_pressure: [],
  modalities_food: [],
  weather_aggravation: [],
  time_of_day: [],
  desires: [],
  aversions: [],
  // --- Mental / dreams / psychiatric
  nightmares: "",
  mentalsymtoms: "",
  delusions: [],
  obsession: [],
  emotionaltrauma: "",
  // --- Gynae
  menstrualcycle: "",
  flowduration: "",
  flowtype: "",
  pms: [],
  // --- Repertory/summary
  pathsymptoms: "",
  miasanalysis: "",
  constassess: "",
  therachallenge: "",
  image: null,
  user: "",
};

const NavItem = ({ s, onClick }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: "linear-gradient(90deg,#eefafd,#ffffff)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#023047",
          boxShadow: "0 6px 18px rgba(6,182,212,0.03)",
        }}
      >
        {s.icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{s.label}</div>
      </div>
    </div>
  );
};

const CaseIntakes = () => {
  const navigate = useNavigate();
  const { audioId } = useParams();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext || {});
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [newTimeline, setNewTimeline] = useState({
    symptom: "",
    onset: "",
    duration: "",
    pastRx: "",
    effect: "",
  });
  const [newFollowup, setNewFollowup] = useState({
    date: "",
    remedy: "",
    potency: "",
    dose: "",
    response: "",
    notes: "",
  });

  // mobile UI
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (user?.id) setFormData((p) => ({ ...p, user: user.id }));
  }, [user]);

  // --- Handlers (preserved names) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    // auto-calc BMI if height & weight change
    setFormData((p) => {
      const next = { ...p, [name]: value };
      if (name === "height_cm" || name === "weight_kg") {
        const h = Number(name === "height_cm" ? value : p.height_cm);
        const w = Number(name === "weight_kg" ? value : p.weight_kg);
        if (h > 0 && w > 0) {
          const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);
          next.bmi = bmi;
        } else {
          next.bmi = "";
        }
      }
      return next;
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((p) => {
      const arr = p[name] ? [...p[name]] : [];
      if (checked) {
        if (!arr.includes(value)) arr.push(value);
      } else {
        const idx = arr.indexOf(value);
        if (idx > -1) arr.splice(idx, 1);
      }
      return { ...p, [name]: arr };
    });
  };

  const handleArrayToggle = (field, key) => {
    setFormData((p) => {
      const arr = p[field] ? [...p[field]] : [];
      const idx = arr.indexOf(key);
      if (idx > -1) arr.splice(idx, 1);
      else arr.push(key);
      return { ...p, [field]: arr };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFormData((p) => ({ ...p, image: file }));
    if (file.type && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const validateCurrentStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.patientname || !formData.patientname.trim())
        newErrors.patientname = "Name required";
      if (!formData.patientage) newErrors.patientage = "Age required";
      if (!formData.patientgender) newErrors.patientgender = "Gender required";
    }
    if (step === 3) {
      if (!formData.todayconcern || !formData.todayconcern.trim())
        newErrors.todayconcern = "Chief concern is important";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) setStep((s) => Math.min(s + 1, sections.length));
    else {
      const root = document.getElementById("case-card");
      if (root) root.scrollTop = 0;
      toast.warn("Fix required fields in this section.");
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleAddTimeline = () => {
    if (!newTimeline.symptom || !newTimeline.onset) {
      toast.warn("Symptom and onset required.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      timeline: [...prev.timeline, { ...newTimeline }],
    }));
    setNewTimeline({
      symptom: "",
      onset: "",
      duration: "",
      pastRx: "",
      effect: "",
    });
    setShowTimelineModal(false);
  };

  const handleRemoveTimeline = (idx) => {
    setFormData((prev) => ({
      ...prev,
      timeline: prev.timeline.filter((_, i) => i !== idx),
    }));
  };

  const handleAddFollowup = () => {
    if (!newFollowup.date || !newFollowup.remedy) {
      toast.warn("Date and remedy required.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      followups: [...prev.followups, { ...newFollowup }],
    }));
    setNewFollowup({
      date: "",
      remedy: "",
      potency: "",
      dose: "",
      response: "",
      notes: "",
    });
    setShowFollowupModal(false);
  };

  const handleRemoveFollowup = (idx) => {
    setFormData((prev) => ({
      ...prev,
      followups: prev.followups.filter((_, i) => i !== idx),
    }));
  };

  const printSnapshot = () => {
    window.print();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;
    setLoading(true);

    const data = new FormData();

    for (const key in formData) {
      if (key === "image") continue;
      const val = formData[key];
      if (Array.isArray(val)) {
        if (key === "timeline" || key === "followups") {
          data.append(key, JSON.stringify(val));
        } else {
          val.forEach((v) => data.append(key, v));
        }
      } else if (val !== undefined && val !== null && val !== "") {
        data.append(key, val);
      }
    }

    if (formData.image) data.append("image", formData.image);
    if (user?.id) data.append("user", user.id);

    try {
      if (audioId) {
        await api.put(`${API_URL}/cases/${audioId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Case updated");
      } else {
        await api.post(`${API_URL}/cases`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Case saved");
        setFormData(initialForm);
        setImagePreview(null);
        setStep(1);
      }
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  // --- end handlers ---

  return (
    <>
      <style>{`
        .glass-card { border-radius:14px; padding:18px; background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.95)); box-shadow: 0 14px 40px rgba(7,10,20,0.06); border: 1px solid rgba(6,182,212,0.06); }
        .header-compact { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; }
        .brand { display:flex; gap:12px; align-items:center; }
        .brand .logo { width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:700; color:white; background: linear-gradient(90deg,#06b6d4,#7dd3fc); box-shadow: 0 8px 30px rgba(6,182,212,0.08); }
        .matrix-grid { display:flex; flex-wrap:wrap; gap:8px; padding:12px; border-radius:10px; background: linear-gradient(180deg,#f8feff,#ffffff); border:1px solid rgba(6,182,212,0.06); }
        .chip { padding:8px 10px; border-radius:999px; background:#fff; border:1px solid rgba(0,0,0,0.06); cursor:pointer; font-size:13px; user-select:none; }
        .chip.active { background: linear-gradient(90deg,#06b6d4,#7dd3fc); color:white; box-shadow: 0 8px 20px rgba(6,182,212,0.08); }
        .timeline-row, .followup-row { padding:10px; border-bottom:1px dashed rgba(6,182,212,0.06); display:flex; justify-content:space-between; align-items:center; gap:8px; }

        /* responsive adjustments */
        .container-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 18px;
          align-items: start;
        }

        .left-pane {
          position: sticky;
          top: 24px;
          height: calc(100vh - 48px);
          overflow-y: auto;
        }

        .mobile-open-sidebar-btn { display: none; }

        @media (max-width: 980px) {
          .container-grid { grid-template-columns: 1fr; padding:12px; }
          .left-pane { display: none; }
          .mobile-open-sidebar-btn { display: inline-flex; }
          .chip { padding: 12px 14px; min-height: 44px; font-size: 14px; }
          .matrix-grid { overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap; flex-wrap: nowrap; }
          .matrix-grid .chip { display: inline-block; margin-right: 8px; }
        }

        .mobile-action-bar { display: none; }
        @media (max-width: 640px) {
          .mobile-action-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            padding: 10px;
            box-shadow: 0 -6px 20px rgba(0,0,0,0.06);
            gap: 8px;
            justify-content: space-between;
            align-items: center;
            z-index: 1200;
            border-top: 1px solid rgba(0,0,0,0.04);
          }
          html, body { padding-bottom: 72px; }
        }

        .header-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
      `}</style>

      <div className="container-grid">
        {/* LEFT - desktop only */}
        <div className="left-pane glass-card" aria-hidden={false}>
          <div className="header-compact">
            <div className="brand">
              <div className="logo">H</div>
              <div>
                <div
                  style={{ fontSize: 16, color: "#023047", fontWeight: 700 }}
                >
                  HomeoHealing Pro
                </div>
                <div style={{ fontSize: 12, color: "#0b556b" }}>
                  Enhanced Clinical Case Taking
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: "#0b556b", fontWeight: 600 }}>
                Doctor
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {user?.name || "You"}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <ProgressBar now={(step / sections.length) * 100} />
            <div style={{ marginTop: 8, fontSize: 12, color: "#165a72" }}>
              {Math.round((step / sections.length) * 100)}% Complete
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {sections.map((s) => (
              <div
                key={s.id}
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setStep(s.id);
                  const root = document.getElementById("case-card");
                  if (root) root.scrollTop = 0;
                }}
              >
                <NavItem
                  s={s}
                  onClick={() => {
                    setStep(s.id);
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Button
              size="sm"
              style={{
                background: "linear-gradient(90deg,#06b6d4,#7dd3fc)",
                border: "none",
                color: "white",
              }}
              onClick={() => setStep(1)}
            >
              New Case
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => navigate("/patient-cases")}
            >
              All Cases
            </Button>
          </div>

          <div style={{ marginTop: 16, fontSize: 13, color: "#0b556b" }}>
            <div style={{ marginBottom: 8, fontWeight: 700 }}>
              Clinical tips
            </div>
            <ul style={{ paddingLeft: 18 }}>
              <li>Capture precise onset and modalities</li>
              <li>Record trajectory in timeline entries</li>
              <li>
                Document suppressed discharges, prior suppressions, and remedy
                responses
              </li>
            </ul>
          </div>
        </div>

        {/* Offcanvas for mobile - controlled showSidebar */}
        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          placement="start"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    background: "linear-gradient(90deg,#06b6d4,#7dd3fc)",
                  }}
                >
                  H
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>HomeoHealing Pro</div>
                  <div style={{ fontSize: 12, color: "#0b556b" }}>
                    Doctor panel
                  </div>
                </div>
              </div>
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <div style={{ marginBottom: 8 }}>
              <ProgressBar now={(step / sections.length) * 100} />
              <div style={{ marginTop: 8, fontSize: 12, color: "#165a72" }}>
                {Math.round((step / sections.length) * 100)}% Complete
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {sections.map((s) => (
                <div
                  key={s.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setStep(s.id);
                    setShowSidebar(false);
                  }}
                >
                  <NavItem
                    s={s}
                    onClick={() => {
                      setStep(s.id);
                      setShowSidebar(false);
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <Button
                size="sm"
                style={{
                  background: "linear-gradient(90deg,#06b6d4,#7dd3fc)",
                  border: "none",
                  color: "white",
                }}
                onClick={() => {
                  setStep(1);
                  setShowSidebar(false);
                }}
              >
                New Case
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  navigate("/patient-cases");
                  setShowSidebar(false);
                }}
              >
                All Cases
              </Button>
            </div>

            <div style={{ marginTop: 16, fontSize: 13, color: "#0b556b" }}>
              <div style={{ marginBottom: 8, fontWeight: 700 }}>
                Clinical tips
              </div>
              <ul style={{ paddingLeft: 18 }}>
                <li>Capture precise onset and modalities</li>
                <li>Record trajectory in timeline entries</li>
                <li>
                  Document suppressed discharges, prior suppressions, and remedy
                  responses
                </li>
              </ul>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* RIGHT: FORM */}
        <div>
          <Card
            id="case-card"
            className="glass-card"
            style={{ borderRadius: 14 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
                gap: 12,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 12,
                    background: "linear-gradient(90deg,#06b6d4,#7dd3fc)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: 20,
                  }}
                >
                  <FaClipboardList />
                </div>
                <div>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, color: "#023047" }}
                  >
                    {step === 1 && "Patient Demographics & Vitals"}
                    {step === 2 && "Risk, Social & History"}
                    {step === 3 && "Chief Complaint & Timeline"}
                    {step === 4 && "Constitutional & Miasm"}
                    {step === 5 && "Mental State & Dreams"}
                    {step === 6 && "Modalities Matrix & Generals"}
                    {step === 7 && "Systems & Gynaec"}
                    {step === 8 && "Records, Summary & Follow-ups"}
                  </div>
                  <div style={{ fontSize: 13, color: "#0b556b" }}>
                    Doctor-mode — structured case-taking for repertorization
                  </div>
                </div>
              </div>

              <div className="header-actions">
                <Button
                  variant="light"
                  size="sm"
                  className="mobile-open-sidebar-btn"
                  onClick={() => setShowSidebar(true)}
                  title="Open sidebar"
                >
                  <FaBars />
                </Button>

                <Button
                  variant="outline-secondary"
                  onClick={printSnapshot}
                  title="Print Totality Snapshot"
                >
                  <FaPrint /> Snapshot
                </Button>
                <Button
                  style={{
                    background: "linear-gradient(90deg,#06b6d4,#7dd3fc)",
                    border: "none",
                    color: "white",
                  }}
                  onClick={() => window.print()}
                >
                  Print Page
                </Button>
              </div>
            </div>

            <Form onSubmit={handleSubmit}>
              {/* STEP 1 - Demographics & Vitals */}
              {step === 1 && (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 8,
                      color: "#023047",
                    }}
                  >
                    Basic Info & Vitals
                  </div>
                  <Row>
                    <Col xs={12} md={7}>
                      <Form.Group className="mb-3" controlId="patientname">
                        <Form.Label>Full Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="patientname"
                          value={formData.patientname}
                          onChange={handleChange}
                          isInvalid={!!errors.patientname}
                          placeholder="Patient full name"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.patientname}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={5}>
                      <Form.Group className="mb-3" controlId="patientage">
                        <Form.Label>Age *</Form.Label>
                        <Form.Control
                          type="number"
                          name="patientage"
                          value={formData.patientage}
                          onChange={handleChange}
                          isInvalid={!!errors.patientage}
                          placeholder="Age"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.patientage}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3" controlId="patientgender">
                        <Form.Label>Gender *</Form.Label>
                        <Form.Control
                          as="select"
                          name="patientgender"
                          value={formData.patientgender}
                          onChange={handleChange}
                          isInvalid={!!errors.patientgender}
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </Form.Control>
                        <Form.Control.Feedback type="invalid">
                          {errors.patientgender}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3" controlId="patientphone">
                        <Form.Label>Phone</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>+91</InputGroup.Text>
                          <Form.Control
                            type="text"
                            name="patientphone"
                            value={formData.patientphone}
                            onChange={handleChange}
                            placeholder="98765 43210"
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3" controlId="patientemail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="patientemail"
                          value={formData.patientemail}
                          onChange={handleChange}
                          placeholder="patient@email.com"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3" controlId="patientaddress">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="patientaddress"
                          value={formData.patientaddress}
                          onChange={handleChange}
                          rows={2}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <Form.Group className="mb-3">
                      <Form.Label>Height (cm)</Form.Label>
                      <Form.Control
                        type="number"
                        name="height_cm"
                        value={formData.height_cm}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Weight (kg)</Form.Label>
                      <Form.Control
                        type="number"
                        name="weight_kg"
                        value={formData.weight_kg}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>BMI</Form.Label>
                      <Form.Control
                        type="text"
                        name="bmi"
                        value={formData.bmi}
                        readOnly
                      />
                    </Form.Group>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <Form.Group className="mb-3">
                      <Form.Label>Pulse (/min)</Form.Label>
                      <Form.Control
                        type="text"
                        name="pulse"
                        value={formData.pulse}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>BP (Systolic)</Form.Label>
                      <Form.Control
                        type="text"
                        name="bp_systolic"
                        value={formData.bp_systolic}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>BP (Diastolic)</Form.Label>
                      <Form.Control
                        type="text"
                        name="bp_diastolic"
                        value={formData.bp_diastolic}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Temperature (°C)</Form.Label>
                    <Form.Control
                      type="text"
                      name="temperature"
                      value={formData.temperature}
                      onChange={handleChange}
                    />
                    <Form.Text className="text-muted">
                      Capture febrile pattern if relevant (continuous,
                      intermittent, remittent).
                    </Form.Text>
                  </Form.Group>
                </>
              )}

              {/* STEP 2 - Risk & history (expanded) */}
              {step === 2 && (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 8,
                      color: "#023047",
                    }}
                  >
                    Risk, Life History & Current Therapy
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Self-harm ideation</Form.Label>
                    {["Never", "Rarely", "Sometimes", "Often", "Daily"].map(
                      (o, i) => (
                        <Form.Check
                          key={i}
                          inline
                          type="radio"
                          label={o}
                          name="suicide"
                          value={o}
                          checked={formData.suicide === o}
                          onChange={handleChange}
                        />
                      )
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Addictive history</Form.Label>
                    <div style={{ maxHeight: 150, overflowY: "auto" }}>
                      {[
                        "Alcohol",
                        "Tobacco/Smoking",
                        "Cannabis",
                        "Prescription drugs",
                        "Stimulants",
                        "Behavioral addictions",
                        "Gaming",
                        "Gambling",
                      ].map((o, i) => (
                        <Form.Check
                          key={i}
                          type="checkbox"
                          label={o}
                          name="addiction"
                          value={o}
                          checked={formData.addiction?.includes(o)}
                          onChange={handleCheckboxChange}
                        />
                      ))}
                    </div>
                  </Form.Group>

                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Support system</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="support"
                          value={formData.support}
                          onChange={handleChange}
                          rows={2}
                        />
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Current medications / allopathic drugs
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          name="medication"
                          value={formData.medication}
                          onChange={handleChange}
                          rows={2}
                          placeholder="Include recent prescriptions & antibiotics"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      Sensitivities / Allergies / Drug reactions
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      name="sensitivities"
                      value={formData.sensitivities}
                      onChange={handleChange}
                      rows={2}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Family history (major diseases)</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="familyhistory"
                      value={formData.familyhistory}
                      onChange={handleChange}
                      rows={2}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Birth & developmental history</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="birthHistory"
                      value={formData.birthHistory}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Birth trauma, prematurity, developmental milestones"
                    />
                  </Form.Group>
                </>
              )}

              {/* STEP 3 - Chief & Timeline (same but emphasized) */}
              {step === 3 && (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 8,
                      color: "#023047",
                    }}
                  >
                    Chief Complaint & Timeline
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Label>Main concern today</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="todayconcern"
                      value={formData.todayconcern}
                      onChange={handleChange}
                      rows={3}
                      isInvalid={!!errors.todayconcern}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.todayconcern}
                    </Form.Control.Feedback>
                    <div
                      style={{ fontSize: 12, color: "#0b556b", marginTop: 6 }}
                    >
                      Concise statement. Then add timeline entries with onset,
                      modalities and prior remedies.
                    </div>
                  </Form.Group>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Symptom Timeline</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => setShowTimelineModal(true)}
                      >
                        <FaPlus /> Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => printSnapshot()}
                      >
                        <FaPrint /> Snapshot
                      </Button>
                    </div>
                  </div>

                  <div
                    style={{
                      maxHeight: 220,
                      overflowY: "auto",
                      borderRadius: 10,
                      padding: 8,
                      border: "1px solid rgba(6,182,212,0.04)",
                    }}
                  >
                    {formData.timeline.length === 0 && (
                      <div style={{ color: "#0b556b" }}>
                        No timeline entries yet.
                      </div>
                    )}
                    {formData.timeline.map((t, idx) => (
                      <div className="timeline-row" key={idx}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{t.symptom}</div>
                          <div style={{ color: "#0b556b" }}>
                            {t.onset} {t.duration ? ` • ${t.duration}` : ""}{" "}
                            {t.pastRx ? ` • Rx: ${t.pastRx}` : ""}
                          </div>
                          {t.effect && (
                            <div style={{ marginTop: 6 }}>{t.effect}</div>
                          )}
                        </div>
                        <div>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleRemoveTimeline(idx)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* STEP 4 - Constitutional & Miasm (added critical fields) */}
              {step === 4 && (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 8,
                      color: "#023047",
                    }}
                  >
                    Constitutional, Miasm & Energetics
                  </div>

                  <Row>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Constitution (constitutional type)
                        </Form.Label>
                        <Form.Control
                          as="select"
                          name="constitution"
                          value={formData.constitution}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="lean">Lean / Lymphatic</option>
                          <option value="muscular">Muscular / Athletic</option>
                          <option value="adipose">Adipose / Stout</option>
                          <option value="delicate">
                            Delicate / Narrow-framed
                          </option>
                          <option value="mixed">Mixed / Other</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Physique / build</Form.Label>
                        <Form.Control
                          type="text"
                          name="physique"
                          value={formData.physique}
                          onChange={handleChange}
                          placeholder="E.g., ectomorphic, mesomorphic, endomorphic or describer"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Energy level</Form.Label>
                        <Form.Control
                          as="select"
                          name="energy"
                          value={formData.energy}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="high">High</option>
                          <option value="low">Low</option>
                          <option value="variable">Variable</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Reactivity</Form.Label>
                        <Form.Control
                          as="select"
                          name="reactivity"
                          value={formData.reactivity}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="hyper">Hyper-reactive</option>
                          <option value="hypo">Hypo-reactive</option>
                          <option value="normal">Normal</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>

                    <Col xs={12} md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Temperament</Form.Label>
                        <Form.Control
                          type="text"
                          name="temperament"
                          value={formData.temperament}
                          onChange={handleChange}
                          placeholder="Sanguine/Choleric/Phlegmatic/Melancholic or notes"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Miasm (select relevant)</Form.Label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[
                        "psora",
                        "sycosis",
                        "syphilis",
                        "tubercular",
                        "cancer",
                      ].map((m) => (
                        <Form.Check
                          key={m}
                          inline
                          type="checkbox"
                          label={m.charAt(0).toUpperCase() + m.slice(1)}
                          name="miasm"
                          value={m}
                          checked={formData.miasm?.includes(m)}
                          onChange={handleCheckboxChange}
                        />
                      ))}
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      Suppressed conditions (select all that apply)
                    </Form.Label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[
                        "skin_conditions_suppressed",
                        "emotional_mental_suppressed",
                        "vaccination_reactions",
                        "discharge_suppressed",
                        "antibiotic_history",
                      ].map((s) => (
                        <Form.Check
                          key={s}
                          inline
                          type="checkbox"
                          label={s.replace(/_/g, " ")}
                          name="suppressed_conditions"
                          value={s}
                          checked={formData.suppressed_conditions?.includes(s)}
                          onChange={handleCheckboxChange}
                        />
                      ))}
                    </div>
                    <Form.Text className="text-muted">
                      Identify suppressed lesions, eruptions, discharges, or
                      prior suppressive therapies.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Acute vs Chronic</Form.Label>
                    <div>
                      <Form.Check
                        inline
                        type="radio"
                        label="Acute"
                        name="acuteOrChronic"
                        value="acute"
                        checked={formData.acuteOrChronic === "acute"}
                        onChange={handleChange}
                      />
                      <Form.Check
                        inline
                        type="radio"
                        label="Chronic"
                        name="acuteOrChronic"
                        value="chronic"
                        checked={formData.acuteOrChronic === "chronic"}
                        onChange={handleChange}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Keynotes / Remarkable peculiarities</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="keynotes"
                      value={formData.keynotes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Short, high-value peculiar notes for repertory"
                    />
                  </Form.Group>
                </>
              )}

              {/* STEP 5 - Mental state */}
              {step === 5 && (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 8,
                      color: "#023047",
                    }}
                  >
                    Mental State, Dreams & Trauma
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Label>Emotional trauma / life events</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="emotionaltrauma"
                      value={formData.emotionaltrauma}
                      onChange={handleChange}
                      rows={3}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      Mental symptoms (peculiar behaviours)
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      name="mentalsymtoms"
                      value={formData.mentalsymtoms}
                      onChange={handleChange}
                      rows={3}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Nightmares / dreams</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="nightmares"
                      value={formData.nightmares}
                      onChange={handleChange}
                      rows={2}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Delusions / obsession / fears</Form.Label>
                    <div style={{ maxHeight: 140, overflowY: "auto" }}>
                      {[
                        "persecution",
                        "body",
                        "identity",
                        "reality",
                        "guilty",
                        "control",
                        "phobias",
                        "social_anxiety",
                      ].map((o, i) => (
                        <Form.Check
                          key={i}
                          type="checkbox"
                          label={o}
                          name="delusions"
                          value={o}
                          checked={formData.delusions?.includes(o)}
                          onChange={handleCheckboxChange}
                        />
                      ))}
                    </div>
                  </Form.Group>
                </>
              )}

              {/* STEP 6 - Modalities & Generals (expanded) */}
              {step === 6 && (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 8,
                      color: "#023047",
                    }}
                  >
                    Modalities Matrix & Generals
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label>Thermal preference / reaction</Form.Label>
                    <div>
                      {[
                        "hot",
                        "cold",
                        "heat_better",
                        "cold_better",
                        "variable",
                      ].map((o, i) => (
                        <Form.Check
                          key={i}
                          inline
                          type="radio"
                          label={o.replace(/_/g, " ")}
                          name="thermal"
                          value={o}
                          checked={formData.thermal === o}
                          onChange={handleChange}
                        />
                      ))}
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Thirst</Form.Label>
                    <Form.Control
                      as="select"
                      name="thirst"
                      value={formData.thirst}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="increased">Increased</option>
                      <option value="reduced">Reduced</option>
                      <option value="thirstless">Thirstless</option>
                      <option value="variable">Variable</option>
                    </Form.Control>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Appetite / desires / aversions</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="appetiteDetails"
                      value={formData.appetiteDetails}
                      onChange={handleChange}
                      rows={2}
                    />
                  </Form.Group>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 700 }}>
                        Position
                      </div>
                      <div className="matrix-grid">
                        {[
                          {
                            key: "lying_on_right",
                            label: "Lying right better",
                          },
                          { key: "lying_on_left", label: "Lying left better" },
                          { key: "sitting", label: "Sitting better" },
                          { key: "standing", label: "Standing better" },
                          {
                            key: "bending_forward",
                            label: "Bending forward better",
                          },
                          {
                            key: "bending_backward",
                            label: "Bending back better",
                          },
                        ].map((opt) => {
                          const active = formData.modalities_position?.includes(
                            opt.key
                          );
                          return (
                            <div
                              key={opt.key}
                              className={`chip ${active ? "active" : ""}`}
                              onClick={() =>
                                handleArrayToggle(
                                  "modalities_position",
                                  opt.key
                                )
                              }
                            >
                              {opt.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div style={{ marginBottom: 8, fontWeight: 700 }}>
                        Motion / Pressure / Food
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <div style={{ marginBottom: 6, fontWeight: 600 }}>
                          Motion
                        </div>
                        <div className="matrix-grid">
                          {[
                            { key: "motion_worse", label: "Motion worse" },
                            { key: "motion_better", label: "Motion better" },
                            { key: "rest_worse", label: "Rest worse" },
                          ].map((opt) => {
                            const active = formData.modalities_motion?.includes(
                              opt.key
                            );
                            return (
                              <div
                                key={opt.key}
                                className={`chip ${active ? "active" : ""}`}
                                onClick={() =>
                                  handleArrayToggle(
                                    "modalities_motion",
                                    opt.key
                                  )
                                }
                              >
                                {opt.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <div style={{ marginBottom: 6, fontWeight: 600 }}>
                          Pressure
                        </div>
                        <div className="matrix-grid">
                          {[
                            {
                              key: "pressure_better",
                              label: "Pressure better",
                            },
                            { key: "pressure_worse", label: "Pressure worse" },
                          ].map((opt) => {
                            const active =
                              formData.modalities_pressure?.includes(opt.key);
                            return (
                              <div
                                key={opt.key}
                                className={`chip ${active ? "active" : ""}`}
                                onClick={() =>
                                  handleArrayToggle(
                                    "modalities_pressure",
                                    opt.key
                                  )
                                }
                              >
                                {opt.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div style={{ marginBottom: 6, fontWeight: 600 }}>
                          Food
                        </div>
                        <div className="matrix-grid">
                          {[
                            { key: "food_better", label: "Food better" },
                            { key: "food_worse", label: "Food worse" },
                            { key: "food_aversion", label: "Aversion" },
                          ].map((opt) => {
                            const active = formData.modalities_food?.includes(
                              opt.key
                            );
                            return (
                              <div
                                key={opt.key}
                                className={`chip ${active ? "active" : ""}`}
                                onClick={() =>
                                  handleArrayToggle("modalities_food", opt.key)
                                }
                              >
                                {opt.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Form.Group className="mb-3" style={{ marginTop: 12 }}>
                    <Form.Label>Local modalities / pain pattern</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="painpattern"
                      value={formData.painpattern}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </>
              )}

              {/* STEP 7 - Systems & Gynae */}
              {step === 7 && (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 8,
                      color: "#023047",
                    }}
                  >
                    Systems & Gynaec
                  </div>

                  <Row>
                    <Col xs={12} md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cycle length</Form.Label>
                        <Form.Control
                          type="text"
                          name="menstrualcycle"
                          value={formData.menstrualcycle}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Flow duration</Form.Label>
                        <Form.Control
                          type="text"
                          name="flowduration"
                          value={formData.flowduration}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Flow type</Form.Label>
                        <Form.Control
                          as="select"
                          name="flowtype"
                          value={formData.flowtype}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
                          <option value="heavy_clots">Heavy with clots</option>
                          <option value="light_scanty">Light / scanty</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Systems checklist</Form.Label>
                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                      {[
                        "Headaches",
                        "Cough",
                        "Shortness of breath",
                        "Chest pain",
                        "Palpitations",
                        "Nausea",
                        "Diarrhea",
                        "Constipation",
                        "Urinary frequency",
                        "Joint pain",
                        "Rashes",
                        "Fatigue",
                      ].map((o, i) => (
                        <Form.Check
                          key={i}
                          type="checkbox"
                          label={o}
                          name="systemreview"
                          value={o}
                          checked={formData.systemreview?.includes(o)}
                          onChange={handleCheckboxChange}
                        />
                      ))}
                    </div>
                  </Form.Group>
                </>
              )}

              {/* STEP 8 - Records, summary & followups */}
              {step === 8 && (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 8,
                      color: "#023047",
                    }}
                  >
                    Records, Summary & Follow-ups
                  </div>

                  <Form.Group as={Row} className="mb-3" controlId="formImage">
                    <Form.Label column sm={3} style={{ textAlign: "right" }}>
                      Attach Record
                    </Form.Label>
                    <Col sm={9}>
                      <Form.Control
                        type="file"
                        name="image"
                        accept="image/*,application/pdf"
                        onChange={handleImageChange}
                      />
                      <Form.Text className="text-muted">
                        PDF or image. Backend should validate file type/size.
                      </Form.Text>
                      {imagePreview && (
                        <div style={{ marginTop: 8 }}>
                          <img
                            src={imagePreview}
                            alt="preview"
                            style={{
                              width: 120,
                              height: 120,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #eee",
                            }}
                          />
                        </div>
                      )}
                    </Col>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Pathology / Correlation</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="pathsymptoms"
                      value={formData.pathsymptoms}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Miasmatic analysis / Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="miasanalysis"
                      value={formData.miasanalysis}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      Clinical Summary (Totality snapshot)
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="constassess"
                      value={formData.constassess}
                      onChange={handleChange}
                      placeholder="Summary notes..."
                    />
                  </Form.Group>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Follow-ups</div>
                    <Button
                      size="sm"
                      variant="outline-success"
                      onClick={() => setShowFollowupModal(true)}
                    >
                      <FaPlus /> Add follow-up
                    </Button>
                  </div>

                  <div
                    style={{
                      maxHeight: 260,
                      overflowY: "auto",
                      borderRadius: 10,
                      border: "1px solid rgba(6,182,212,0.04)",
                      padding: 6,
                    }}
                  >
                    {formData.followups.length === 0 && (
                      <div style={{ color: "#0b556b" }}>
                        No follow-ups recorded.
                      </div>
                    )}
                    {formData.followups.map((f, idx) => (
                      <div key={idx} className="followup-row">
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            {f.date} — {f.remedy}{" "}
                            {f.potency ? `(${f.potency})` : ""}
                          </div>
                          <div style={{ color: "#0b556b" }}>
                            {f.dose ? `Dose: ${f.dose}` : ""}{" "}
                            {f.response ? ` • Response: ${f.response}` : ""}
                          </div>
                          {f.notes && (
                            <div style={{ marginTop: 6 }}>{f.notes}</div>
                          )}
                        </div>
                        <div>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleRemoveFollowup(idx)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ACTIONS */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  {step > 1 && (
                    <Button variant="outline-secondary" onClick={handleBack}>
                      <FaChevronLeft /> Back
                    </Button>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginLeft: "auto",
                  }}
                >
                  <div style={{ color: "#0b556b", fontSize: 13 }}>
                    Step {step}/{sections.length}
                  </div>
                  {step < sections.length ? (
                    <Button
                      style={{
                        background: "linear-gradient(90deg,#06b6d4,#7dd3fc)",
                        border: "none",
                        color: "white",
                      }}
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      style={{
                        background: "linear-gradient(90deg,#06b6d4,#7dd3fc)",
                        border: "none",
                        color: "white",
                      }}
                      disabled={loading || (user && user.hit_count === 0)}
                    >
                      {loading ? "Saving..." : "Submit Case"}
                    </Button>
                  )}
                </div>
              </div>

              {user?.hit_count === 0 && (
                <div style={{ color: "red", marginTop: 8 }}>
                  You have reached your limit. Recharge to continue.
                </div>
              )}
            </Form>
          </Card>

          <div style={{ marginTop: 12, color: "#0b556b" }}>
            <small>
              Clinical checklist: timeline + modalities + generals + miasm +
              constitution + suppressed history + vitals + follow-ups —
              essential for accurate repertorization.
            </small>
          </div>
        </div>
      </div>

      {/* TIMELINE MODAL */}
      <Modal
        show={showTimelineModal}
        onHide={() => setShowTimelineModal(false)}
        fullscreen="sm-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Timeline Entry</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Symptom *</Form.Label>
              <Form.Control
                type="text"
                value={newTimeline.symptom}
                onChange={(e) =>
                  setNewTimeline((p) => ({ ...p, symptom: e.target.value }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Onset *</Form.Label>
              <Form.Control
                type="text"
                value={newTimeline.onset}
                onChange={(e) =>
                  setNewTimeline((p) => ({ ...p, onset: e.target.value }))
                }
                placeholder="Date or description"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Duration</Form.Label>
              <Form.Control
                type="text"
                value={newTimeline.duration}
                onChange={(e) =>
                  setNewTimeline((p) => ({ ...p, duration: e.target.value }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Past Remedy</Form.Label>
              <Form.Control
                type="text"
                value={newTimeline.pastRx}
                onChange={(e) =>
                  setNewTimeline((p) => ({ ...p, pastRx: e.target.value }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Effect / Response</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={newTimeline.effect}
                onChange={(e) =>
                  setNewTimeline((p) => ({ ...p, effect: e.target.value }))
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowTimelineModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddTimeline}>
            <FaPlus /> Add
          </Button>
        </Modal.Footer>
      </Modal>

      {/* FOLLOWUP MODAL */}
      <Modal
        show={showFollowupModal}
        onHide={() => setShowFollowupModal(false)}
        fullscreen="sm-down"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Follow-up</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Date *</Form.Label>
              <Form.Control
                type="date"
                value={newFollowup.date}
                onChange={(e) =>
                  setNewFollowup((p) => ({ ...p, date: e.target.value }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Remedy *</Form.Label>
              <Form.Control
                type="text"
                value={newFollowup.remedy}
                onChange={(e) =>
                  setNewFollowup((p) => ({ ...p, remedy: e.target.value }))
                }
              />
            </Form.Group>
            <Row>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Potency</Form.Label>
                  <Form.Control
                    type="text"
                    value={newFollowup.potency}
                    onChange={(e) =>
                      setNewFollowup((p) => ({ ...p, potency: e.target.value }))
                    }
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Dose</Form.Label>
                  <Form.Control
                    type="text"
                    value={newFollowup.dose}
                    onChange={(e) =>
                      setNewFollowup((p) => ({ ...p, dose: e.target.value }))
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Response</Form.Label>
              <Form.Control
                type="text"
                value={newFollowup.response}
                onChange={(e) =>
                  setNewFollowup((p) => ({ ...p, response: e.target.value }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newFollowup.notes}
                onChange={(e) =>
                  setNewFollowup((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowFollowupModal(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddFollowup}>
            <FaPlus /> Add
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Mobile action bar */}
      <div
        className="mobile-action-bar"
        role="toolbar"
        aria-label="Mobile actions"
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {step > 1 ? (
            <Button
              variant="outline-secondary"
              onClick={handleBack}
              style={{ minWidth: 88 }}
            >
              <FaChevronLeft /> Back
            </Button>
          ) : (
            <Button
              variant="outline-secondary"
              onClick={() => setShowSidebar(true)}
              style={{ minWidth: 88 }}
            >
              <FaBars /> Menu
            </Button>
          )}
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#0b556b", fontSize: 13 }}>
            Step {step}/{sections.length}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {step < sections.length ? (
            <Button
              style={{
                background: "linear-gradient(90deg,#06b6d4,#7dd3fc)",
                border: "none",
                color: "white",
                minWidth: 120,
              }}
              onClick={handleNext}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={(e) => handleSubmit(e)}
              style={{
                background: "linear-gradient(90deg,#06b6d4,#7dd3fc)",
                border: "none",
                color: "white",
                minWidth: 120,
              }}
              disabled={loading || (user && user.hit_count === 0)}
            >
              {loading ? "Saving..." : "Submit Case"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default CaseIntakes;
