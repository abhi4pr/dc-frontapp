// CaseIntakes.jsx — 2025 UI with Slate-Blue palette (WCAG-tuned)
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
  FaPrint,
  FaBars,
} from "react-icons/fa";

/* ===== Sections ===== */
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

/* ===== Initial form (unchanged payload/keys) ===== */
const initialForm = {
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
  suicide: "",
  addiction: [],
  support: "",
  medication: "",
  sensitivities: "",
  todayconcern: "",
  origintrigger: "",
  pattern: "",
  impact: "",
  timeline: [],
  followups: [],
  constitution: "",
  energy: "",
  reactivity: "",
  physique: "",
  miasm: [],
  suppressed_conditions: [],
  acuteOrChronic: "chronic",
  keynotes: "",
  temperament: "",
  familyhistory: "",
  birthHistory: "",
  developmentalHistory: "",
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
  nightmares: "",
  mentalsymtoms: "",
  delusions: [],
  obsession: [],
  emotionaltrauma: "",
  menstrualcycle: "",
  flowduration: "",
  flowtype: "",
  pms: [],
  pathsymptoms: "",
  miasanalysis: "",
  constassess: "",
  therachallenge: "",
  image: null,
  user: "",
};

/* Small desktop nav item */
const NavItem = ({ s, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
      cursor: "pointer",
      padding: "8px 10px",
      borderRadius: 10,
      border: "1px solid var(--border)",
      background: "var(--card)",
    }}
  >
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        background: "var(--primary)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {s.icon}
    </div>
    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>
      {s.label}
    </div>
  </div>
);

/* ===== Component ===== */
const CaseIntakes = () => {
  const navigate = useNavigate();
  const { audioId } = useParams();
  const { user } = useContext(UserContext || {});
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

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

  /* ===== Load user id to payload ===== */
  useEffect(() => {
    if (user?._id) setFormData((p) => ({ ...p, user: user._id }));
  }, [user]);

  /* ===== Autosave & restore (no payload changes) ===== */
  useEffect(() => {
    const key = "caseIntakesDraft";
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setFormData((p) => ({ ...p, ...JSON.parse(saved) }));
      } catch {
        /* ignore */
      }
    }
    const beforeUnload = (e) => {
      if (JSON.stringify(formData) !== JSON.stringify(initialForm)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
    // eslint-disable-next-line
  }, []);
  useEffect(() => {
    const key = "caseIntakesDraft";
    localStorage.setItem(key, JSON.stringify(formData));
  }, [formData]);

  /* ===== Handlers (names preserved) ===== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => {
      const next = { ...p, [name]: value };
      if (name === "height_cm" || name === "weight_kg") {
        const h = Number(name === "height_cm" ? value : p.height_cm);
        const w = Number(name === "weight_kg" ? value : p.weight_kg);
        next.bmi = h > 0 && w > 0 ? (w / (h / 100) ** 2).toFixed(1) : "";
      }
      return next;
    });
  };
  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((p) => {
      const arr = Array.isArray(p[name]) ? [...p[name]] : [];
      if (checked && !arr.includes(value)) arr.push(value);
      if (!checked) arr.splice(arr.indexOf(value), 1);
      return { ...p, [name]: arr };
    });
  };
  const handleArrayToggle = (field, key) => {
    setFormData((p) => {
      const arr = Array.isArray(p[field]) ? [...p[field]] : [];
      const i = arr.indexOf(key);
      if (i > -1) arr.splice(i, 1);
      else arr.push(key);
      return { ...p, [field]: arr };
    });
  };
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((p) => ({ ...p, image: file }));
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else setImagePreview(null);
  };

  const validateCurrentStep = () => {
    const ne = {};
    if (step === 1) {
      if (!formData.patientname?.trim()) ne.patientname = "Name required";
      if (!formData.patientage) ne.patientage = "Age required";
      if (!formData.patientgender) ne.patientgender = "Gender required";
    }
    if (step === 3) {
      if (!formData.todayconcern?.trim())
        ne.todayconcern = "Chief concern is important";
    }
    setErrors(ne);
    return Object.keys(ne).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast.warn("Fix required fields.");
      return;
    }
    setStep((s) => Math.min(s + 1, sections.length));
  };
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleAddTimeline = () => {
    if (!newTimeline.symptom || !newTimeline.onset) {
      toast.warn("Symptom & onset required");
      return;
    }
    setFormData((p) => ({ ...p, timeline: [...p.timeline, newTimeline] }));
    setNewTimeline({
      symptom: "",
      onset: "",
      duration: "",
      pastRx: "",
      effect: "",
    });
    setShowTimelineModal(false);
  };
  const handleRemoveTimeline = (idx) =>
    setFormData((p) => ({
      ...p,
      timeline: p.timeline.filter((_, i) => i !== idx),
    }));
  const handleAddFollowup = () => {
    if (!newFollowup.date || !newFollowup.remedy) {
      toast.warn("Date & remedy required");
      return;
    }
    setFormData((p) => ({ ...p, followups: [...p.followups, newFollowup] }));
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
  const handleRemoveFollowup = (idx) =>
    setFormData((p) => ({
      ...p,
      followups: p.followups.filter((_, i) => i !== idx),
    }));
  const printSnapshot = () => window.print();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;
    setLoading(true);
    const data = new FormData();
    for (const k in formData) {
      const v = formData[k];
      if (k === "image") continue;
      if (Array.isArray(v)) {
        if (k === "timeline" || k === "followups")
          data.append(k, JSON.stringify(v));
        else v.forEach((x) => data.append(k, x));
      } else if (v !== "" && v !== null && v !== undefined) data.append(k, v);
    }
    if (formData.image) data.append("image", formData.image);
    if (user?._id) data.append("user", user._id);
    try {
      const postRes = await api.post(`${API_URL}/cases/add_post`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const postId = postRes.data.post._id;
      const aiRes = await api.post(`${API_URL}/ai/send_patient_data`, {
        ...formData,
        userId: user._id,
      });
      const rawText = aiRes.data.raw_text;
      await api.put(`${API_URL}/cases/${postId}`, { airesult: rawText });
      toast.success("Case saved");
      localStorage.removeItem("caseIntakesDraft");
      setFormData(initialForm);
      setImagePreview(null);
      setStep(1);

    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    } finally {
      setLoading(false);
    }
  };

  /* ===== Styles (single-file, palette tokens) ===== */
  const S = (
    <style>{`
      :root{
        --primary:#6A5ACD; --primary-hover:#5A4ACF;
        --secondary:#9370DB; --secondary-hover:#8260C9;
        --bg:#F9FAFB; --card:#FFFFFF; --rowhover:#F3F4F6; --border:#E5E7EB;
        --text:#111827; --text2:#4B5563; --placeholder:#9CA3AF; --link:#6A5ACD;
        --success:#10B981; --error:#EF4444; --warning:#F59E0B; --info:#3B82F6;
      }
      body{background:var(--bg);}
      .glass-card{
        border-radius:18px; padding:24px; background:rgba(255,255,255,0.9);
        backdrop-filter:blur(8px); box-shadow:0 14px 40px rgba(0,0,0,0.04);
        border:1px solid var(--border);
      }
      .container-grid{display:grid;grid-template-columns:320px 1fr;gap:18px;align-items:start;max-width:1200px;margin:0 auto;padding:24px;}
      .left-pane{position:sticky;top:24px;height:calc(100vh - 48px);overflow-y:auto;}
      .brand-chip{width:50px;height:50px;border-radius:16px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;}
      .btn-primary-accent{background:var(--primary);border:none;color:#fff;}
      .btn-primary-accent:hover{background:var(--primary-hover);}
      .btn-secondary-accent{background:var(--secondary);border:none;color:var(--text);}
      .btn-secondary-accent:hover{background:var(--secondary-hover);color:var(--text);}
      .header-compact{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;}
      .progress{background:#E9EAF2;border-radius:10px;height:10px;}
      .progress-bar{background-color:var(--primary) !important;}
      .matrix-grid{display:flex;flex-wrap:wrap;gap:8px;padding:10px;border-radius:12px;background:var(--card);border:1px solid var(--border);}
      .chip{padding:10px 14px;border-radius:999px;background:#fff;border:1px solid var(--border);
            cursor:pointer;font-size:14px;line-height:1.1;color:var(--text);
            box-shadow:0 1px 2px rgba(0,0,0,0.04);}
      .chip:focus{outline:3px solid rgba(106,90,205,0.35);}
      .chip.active{background:var(--primary);border-color:var(--primary);color:#fff;box-shadow:0 6px 16px rgba(106,90,205,0.22);}
      .timeline-row,.followup-row{padding:12px;border-bottom:1px solid var(--border);
        display:flex;justify-content:space-between;align-items:center;gap:8px;}
      .timeline-row:hover,.followup-row:hover{background:var(--rowhover);}
      .mobile-open-sidebar-btn{display:none;}
      .form-label{color:var(--text2);font-weight:600;}
      .form-control, .form-select{border-radius:8px;border-color:var(--border);}
      .form-control::placeholder{color:var(--placeholder);}
      a, .link{color:var(--link);}
      .status-banner{padding:10px 12px;border-radius:12px;border:1px solid var(--border);background:#fff;}
      .status-success{border-left:4px solid var(--success); color:var(--text);}
      .status-error{border-left:4px solid var(--error); color:var(--text);}
      .status-info{border-left:4px solid var(--info); color:var(--text);}
      @media(max-width:980px){
        .container-grid{grid-template-columns:1fr;padding:12px;}
        .left-pane{display:none;}
        .mobile-open-sidebar-btn{display:inline-flex;}
        .matrix-grid{overflow-x:auto;white-space:nowrap;flex-wrap:nowrap;}
      }
      .mobile-action-bar{display:none;}
      @media(max-width:640px){
        .mobile-action-bar{display:flex;position:fixed;bottom:0;left:0;right:0;background:#fff;padding:10px;
          box-shadow:0 -6px 20px rgba(0,0,0,0.06);gap:8px;justify-content:space-between;align-items:center;z-index:1200;border-top:1px solid var(--border);}
        html,body{padding-bottom:72px;}
      }
    `}</style>
  );

  return (
    <>
      {S}
      <div className="container-grid" style={{ background: "var(--bg)" }}>
        {/* LEFT (desktop) */}
        <div className="left-pane glass-card">
          <div className="header-compact">
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div className="brand-chip">H</div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    color: "var(--text)",
                    fontWeight: 800,
                  }}
                >
                  HomeoHealing Pro
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>
                  Doctor Case-Taking
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}
              >
                Doctor
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {user?.name || "You"}
              </div>
            </div>
          </div>

          <ProgressBar now={(step / sections.length) * 100} className="mb-1" />
          <div
            style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}
          >
            {Math.round((step / sections.length) * 100)}% Complete
          </div>

          {sections.map((s) => (
            <NavItem key={s.id} s={s} onClick={() => setStep(s.id)} />
          ))}

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <Button
              size="sm"
              className="btn-primary-accent"
              onClick={() => setStep(1)}
            >
              New Case
            </Button>
            <Button
              size="sm"
              className="btn-secondary-accent"
              onClick={() => navigate("/patient-cases")}
            >
              All Cases
            </Button>
          </div>

          <div style={{ marginTop: 16, fontSize: 13, color: "var(--text2)" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              Clinical tips
            </div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              <li>Pin onset + modalities precisely</li>
              <li>Track suppressions & remedy responses</li>
              <li>Summarize totality before repertorization</li>
            </ul>
          </div>
        </div>

        {/* Mobile Offcanvas */}
        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          placement="start"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Case Navigation</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <ProgressBar
              now={(step / sections.length) * 100}
              className="mb-1"
            />
            <div
              style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12 }}
            >
              {Math.round((step / sections.length) * 100)}% Complete
            </div>
            {sections.map((s) => (
              <NavItem
                key={s.id}
                s={s}
                onClick={() => {
                  setStep(s.id);
                  setShowSidebar(false);
                }}
              />
            ))}
          </Offcanvas.Body>
        </Offcanvas>

        {/* RIGHT: form */}
        <Card
          id="case-card"
          className="glass-card"
          style={{ overflow: "hidden" }}
        >
          <div className="header-compact">
            <div>
              <div
                style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}
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
              <div style={{ fontSize: 13, color: "var(--text2)" }}>
                Doctor-mode structured intake
              </div>
            </div>
            <div>
              <Button
                variant="light"
                size="sm"
                className="mobile-open-sidebar-btn"
                onClick={() => setShowSidebar(true)}
                title="Menu"
              >
                <FaBars />
              </Button>
              <Button
                variant="outline-secondary"
                className="ms-2"
                onClick={printSnapshot}
              >
                <FaPrint /> Snapshot
              </Button>
            </div>
          </div>

          <Form onSubmit={handleSubmit}>
            {/* STEP 1 */}
            {step === 1 && (
              <>
                <Row>
                  <Col md={7}>
                    <Form.Group className="mb-3">
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
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>Age *</Form.Label>
                      <Form.Control
                        type="number"
                        name="patientage"
                        value={formData.patientage}
                        onChange={handleChange}
                        isInvalid={!!errors.patientage}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.patientage}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Gender *</Form.Label>
                      <Form.Select
                        name="patientgender"
                        value={formData.patientgender}
                        onChange={handleChange}
                        isInvalid={!!errors.patientgender}
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.patientgender}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
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
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="patientemail"
                        value={formData.patientemail}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="patientaddress"
                        value={formData.patientaddress}
                        onChange={handleChange}
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
                </Form.Group>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Self-harm ideation</Form.Label>
                  {["Never", "Rarely", "Sometimes", "Often", "Daily"].map(
                    (o) => (
                      <Form.Check
                        key={o}
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
                    ].map((o) => (
                      <Form.Check
                        key={o}
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
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Support system</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="support"
                        value={formData.support}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Current medications</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="medication"
                        value={formData.medication}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Sensitivities / Allergies</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="sensitivities"
                    value={formData.sensitivities}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Family history</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="familyhistory"
                    value={formData.familyhistory}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Birth & developmental history</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="birthHistory"
                    value={formData.birthHistory}
                    onChange={handleChange}
                    placeholder="Birth trauma, prematurity, milestones"
                  />
                </Form.Group>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Main concern today *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="todayconcern"
                    value={formData.todayconcern}
                    onChange={handleChange}
                    isInvalid={!!errors.todayconcern}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.todayconcern}
                  </Form.Control.Feedback>
                </Form.Group>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 800, color: "var(--text)" }}>
                    Symptom Timeline
                  </div>

                </div>
                <div
                  style={{
                    maxHeight: 220,
                    overflowY: "auto",
                    borderRadius: 10,
                    padding: 8,
                    border: "1px solid var(--border)",
                    background: "#fff",
                  }}
                >
                  {formData.timeline.length === 0 && (
                    <div style={{ color: "var(--text2)" }}>
                      No timeline entries yet.
                    </div>
                  )}
                  {formData.timeline.map((t, idx) => (
                    <div key={idx} className="timeline-row">
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text)" }}>
                          {t.symptom}
                        </div>
                        <div style={{ color: "var(--text2)" }}>
                          {t.onset}
                          {t.duration ? ` • ${t.duration}` : ""}
                          {t.pastRx ? ` • Rx: ${t.pastRx}` : ""}
                        </div>
                        {t.effect && (
                          <div style={{ marginTop: 6 }}>{t.effect}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleRemoveTimeline(idx)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Constitution</Form.Label>
                      <Form.Select
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
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Physique / build</Form.Label>
                      <Form.Control
                        type="text"
                        name="physique"
                        value={formData.physique}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Energy level</Form.Label>
                      <Form.Select
                        name="energy"
                        value={formData.energy}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="high">High</option>
                        <option value="low">Low</option>
                        <option value="variable">Variable</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Reactivity</Form.Label>
                      <Form.Select
                        name="reactivity"
                        value={formData.reactivity}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="hyper">Hyper-reactive</option>
                        <option value="hypo">Hypo-reactive</option>
                        <option value="normal">Normal</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Temperament</Form.Label>
                      <Form.Control
                        type="text"
                        name="temperament"
                        value={formData.temperament}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Miasm</Form.Label>
                  {["psora", "sycosis", "syphilis", "tubercular", "cancer"].map(
                    (m) => (
                      <Form.Check
                        key={m}
                        inline
                        type="checkbox"
                        label={m}
                        name="miasm"
                        value={m}
                        checked={formData.miasm?.includes(m)}
                        onChange={handleCheckboxChange}
                      />
                    )
                  )}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Suppressed conditions</Form.Label>
                  <br />
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
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Acute vs Chronic</Form.Label>
                  <br />
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
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Keynotes / Peculiarities</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="keynotes"
                    value={formData.keynotes}
                    onChange={handleChange}
                  />
                </Form.Group>
              </>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Emotional trauma / life events</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="emotionaltrauma"
                    value={formData.emotionaltrauma}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Mental symptoms</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="mentalsymtoms"
                    value={formData.mentalsymtoms}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Nightmares / dreams</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="nightmares"
                    value={formData.nightmares}
                    onChange={handleChange}
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
                    ].map((o) => (
                      <Form.Check
                        key={o}
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

            {/* STEP 6 */}
            {step === 6 && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Thermal preference</Form.Label>
                  <br />
                  {[
                    "hot",
                    "cold",
                    "heat_better",
                    "cold_better",
                    "variable",
                  ].map((o) => (
                    <Form.Check
                      key={o}
                      inline
                      type="radio"
                      label={o.replace(/_/g, " ")}
                      name="thermal"
                      value={o}
                      checked={formData.thermal === o}
                      onChange={handleChange}
                    />
                  ))}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Thirst</Form.Label>
                  <Form.Select
                    name="thirst"
                    value={formData.thirst}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="increased">Increased</option>
                    <option value="reduced">Reduced</option>
                    <option value="thirstless">Thirstless</option>
                    <option value="variable">Variable</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Appetite / desires / aversions</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="appetiteDetails"
                    value={formData.appetiteDetails}
                    onChange={handleChange}
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
                    <div
                      style={{
                        marginBottom: 8,
                        fontWeight: 800,
                        color: "var(--text)",
                      }}
                    >
                      Position
                    </div>
                    <div className="matrix-grid">
                      {[
                        { key: "lying_on_right", label: "Lying right better" },
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
                          <button
                            type="button"
                            key={opt.key}
                            className={`chip ${active ? "active" : ""}`}
                            onClick={() =>
                              handleArrayToggle("modalities_position", opt.key)
                            }
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        marginBottom: 8,
                        fontWeight: 800,
                        color: "var(--text)",
                      }}
                    >
                      Motion / Pressure / Food
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          marginBottom: 6,
                          fontWeight: 600,
                          color: "var(--text2)",
                        }}
                      >
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
                            <button
                              type="button"
                              key={opt.key}
                              className={`chip ${active ? "active" : ""}`}
                              onClick={() =>
                                handleArrayToggle("modalities_motion", opt.key)
                              }
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          marginBottom: 6,
                          fontWeight: 600,
                          color: "var(--text2)",
                        }}
                      >
                        Pressure
                      </div>
                      <div className="matrix-grid">
                        {[
                          { key: "pressure_better", label: "Pressure better" },
                          { key: "pressure_worse", label: "Pressure worse" },
                        ].map((opt) => {
                          const active = formData.modalities_pressure?.includes(
                            opt.key
                          );
                          return (
                            <button
                              type="button"
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
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          marginBottom: 6,
                          fontWeight: 600,
                          color: "var(--text2)",
                        }}
                      >
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
                            <button
                              type="button"
                              key={opt.key}
                              className={`chip ${active ? "active" : ""}`}
                              onClick={() =>
                                handleArrayToggle("modalities_food", opt.key)
                              }
                            >
                              {opt.label}
                            </button>
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
                    value={formData.painpattern || ""}
                    onChange={handleChange}
                  />
                </Form.Group>
              </>
            )}

            {/* STEP 7 */}
            {step === 7 && (
              <>
                <Row>
                  <Col md={4}>
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
                  <Col md={4}>
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
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Flow type</Form.Label>
                      <Form.Select
                        name="flowtype"
                        value={formData.flowtype}
                        onChange={handleChange}
                      >
                        <option value="">Select</option>
                        <option value="heavy_clots">Heavy with clots</option>
                        <option value="light_scanty">Light / scanty</option>
                      </Form.Select>
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
                    ].map((o) => (
                      <Form.Check
                        key={o}
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

            {/* STEP 8 */}
            {step === 8 && (
              <>
                <div
                  className="status-banner status-info"
                  style={{ marginBottom: 10 }}
                >
                  Tip: Attach labs or imaging and summarise the “totality” for
                  quick repertorization.
                </div>

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
                  <Form.Label>Miasmatic analysis</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="miasanalysis"
                    value={formData.miasanalysis}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Clinical Summary (Totality snapshot)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="constassess"
                    value={formData.constassess}
                    onChange={handleChange}
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
                  <div style={{ fontWeight: 800, color: "var(--text)" }}>
                    Follow-ups
                  </div>
                  <Button
                    size="sm"
                    className="btn-primary-accent"
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
                    border: "1px solid var(--border)",
                    padding: 6,
                    background: "#fff",
                  }}
                >
                  {formData.followups.length === 0 && (
                    <div style={{ color: "var(--text2)" }}>
                      No follow-ups recorded.
                    </div>
                  )}
                  {formData.followups.map((f, idx) => (
                    <div key={idx} className="followup-row">
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text)" }}>
                          {f.date} — {f.remedy}{" "}
                          {f.potency ? `(${f.potency})` : ""}
                        </div>
                        <div style={{ color: "var(--text2)" }}>
                          {f.dose ? `Dose: ${f.dose}` : ""}{" "}
                          {f.response ? ` • Response: ${f.response}` : ""}
                        </div>
                        {f.notes && (
                          <div style={{ marginTop: 6 }}>{f.notes}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleRemoveFollowup(idx)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Actions */}
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
                <div style={{ color: "var(--text2)", fontSize: 13 }}>
                  Step {step}/{sections.length}
                </div>
                {step < sections.length ? (
                  <Button className="btn-primary-accent" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="btn-primary-accent"
                    disabled={loading || (user && user.hit_count === 0)}
                  >
                    {loading ? "Saving..." : "Submit Case"}
                  </Button>
                )}
              </div>
            </div>
            {user?.hit_count === 0 && (
              <div
                className="status-banner status-error"
                style={{ marginTop: 8 }}
              >
                You have reached your limit. Recharge to continue.
              </div>
            )}
          </Form>
        </Card>
      </div>

      {/* Follow-up Modal */}
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
              <Col md={6}>
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
              <Col md={6}>
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
            variant="outline-secondary"
            onClick={() => setShowFollowupModal(false)}
          >
            Cancel
          </Button>
          <Button className="btn-primary-accent" onClick={handleAddFollowup}>
            <FaPlus /> Add
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Mobile bottom bar */}
      <div className="mobile-action-bar" role="toolbar">
        {step > 1 ? (
          <Button
            variant="outline-secondary"
            onClick={handleBack}
            style={{ minWidth: 96 }}
          >
            <FaChevronLeft /> Back
          </Button>
        ) : (
          <Button
            variant="outline-secondary"
            onClick={() => setShowSidebar(true)}
            style={{ minWidth: 96 }}
          >
            <FaBars /> Menu
          </Button>
        )}
        <div style={{ fontSize: 13, color: "var(--text2)" }}>
          Step {step}/{sections.length}
        </div>
        {step < sections.length ? (
          <Button className="btn-primary-accent" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button
            type="submit"
            className="btn-primary-accent"
            // onClick={handleSubmit}
            disabled={loading || (user && user.hit_count === 0)}
          >
            {loading ? "Saving..." : "Submit Case"}
          </Button>
        )}
      </div>
    </>
  );
};

export default CaseIntakes;
