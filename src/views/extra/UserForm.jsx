// UserForm.jsx
import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  ProgressBar,
  Col,
  Row,
  InputGroup,
  Modal,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { API_URL } from "../../constants";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utility/api";
import {
  FaUser,
  FaHeartbeat,
  FaFileMedical,
  FaInfoCircle,
} from "react-icons/fa";

/*
  Upgraded patient-facing UserForm.jsx
  - Modern glassmorphism + soothing palette + large touch targets
  - Plain, ultra-simple language for each question; helper hints + "skip if unsure"
  - Keeps component and handler names unchanged:
    component: UserForm
    handlers: handleChange, handleCheckboxChange, handleImageChange, validateCurrentStep, handleNext, handleBack, handleSubmit
  - Keeps input `name` fields unchanged so backend receives same payload
  - Specialist option VALUES are preserved to remain compatible with doctor-side (see comments)
*/

const UserForm = () => {
  const navigate = useNavigate();
  const { id, audioId } = useParams();
  const [step, setStep] = useState(1);
  const [doctorData, setDoctorData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainText, setExplainText] = useState("");

  // formData: keep same field names as original (compatibility)
  const [formData, setFormData] = useState({
    patientname: "",
    patientage: "",
    patientgender: "",
    patientemail: "",
    patientphone: "",
    patientaddress: "",
    suicide: "",
    addiction: [],
    skincondition: "",
    mentalcondition: "",
    discharge: "",
    vaccine: "",
    spiritual: "",
    support: "",
    medication: "",
    todayconcern: "",
    origintrigger: "",
    pattern: "",
    impact: "",
    thermal: "",
    energy: "", // VALUES preserved: 'high'|'low'|'variable' for backend
    reactivity: "", // VALUES preserved: 'hyper'|'hypo'|'normal'
    physique: "",
    metabolic: "",
    miasmatic: [], // VALUES preserved: 'psora','sycosis','syphilis','tubercular','cancer'
    familyhistory: "",
    nightmares: "",
    sleep: "",
    wakeup: "",
    fear: [],
    delusions: [],
    obsession: [],
    emotionaltrauma: "",
    mentalsymtoms: "",
    morning: "",
    forenoon: "",
    noon: "",
    afternoon: "",
    evening: "",
    night: "",
    beforeMidnight: "",
    afterMidnight: "",
    hotWeather: "",
    coldWeather: "",
    dampWeather: "",
    dryWeather: "",
    windyWeather: "",
    thunderstorms: "",
    menstrualcycle: "",
    flowduration: "",
    flowtype: "",
    pms: [],
    painpattern: "",
    systemreview: [],
    bodytemp: "",
    thirst: "",
    sleeppattern: "",
    sleepenv: [],
    image: null,
    pathsymptoms: "",
    miasanalysis: "",
    constassess: "",
    therachallenge: "",
    user: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (id) {
        const res = await api.get(`${API_URL}/users/${id}`);
        setDoctorData(res.data?.user || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // --- handlers (names preserved) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => {
      const arr = Array.isArray(prev[name]) ? [...prev[name]] : [];
      if (checked) {
        if (!arr.includes(value)) arr.push(value);
      } else {
        const idx = arr.indexOf(value);
        if (idx > -1) arr.splice(idx, 1);
      }
      return { ...prev, [name]: arr };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFormData((p) => ({ ...p, image: file }));
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const validateCurrentStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.patientname || !formData.patientname.trim())
        newErrors.patientname = "Please enter your name";
      if (!formData.patientage) newErrors.patientage = "Please enter your age";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) setStep((s) => Math.min(s + 1, 8));
    else toast.warn("Please fill required fields.");
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;
    setLoading(true);

    const data = new FormData();
    for (const key in formData) {
      if (Array.isArray(formData[key]) && key !== "image") {
        formData[key].forEach((v) => data.append(key, v));
      } else if (
        key !== "image" &&
        formData[key] !== undefined &&
        formData[key] !== null
      ) {
        data.append(key, formData[key]);
      }
    }
    if (formData.image) data.append("image", formData.image);
    if (id) data.append("user", id);

    try {
      await api.post(`${API_URL}/cases/add_post/`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Case submitted");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Submit failed");
    } finally {
      setLoading(false);
    }
  };

  // helper to show simple explanation modal (plain language)
  const openExplain = (title) => {
    const texts = {
      miasm:
        "Long-term patterns: if you had lifelong skin problems, warts, or very deep/recurrent infections, tick the matching box. If unsure — skip.",
      reactivity:
        "How quickly your body reacts to medicines, fever, or small things: 'Strong reactions' means you get big effects from small triggers. If unsure — pick 'Not sure' or skip.",
      energy:
        "How energetic you feel most days: Active / Low energy / Varies. Pick the best one.",
    };
    setExplainText(texts[title] || "More info");
    setShowExplainModal(true);
  };

  // design + simple language helpers below
  return (
    <>
      <style>{`
        html, body { background: radial-gradient(circle at 10% 10%, #f0fbf5 0%, #f7fbff 40%, #ffffff 100%); min-height:100vh; }
        .wrap { display:flex; justify-content:center; padding:28px 12px 120px; }
        .card-shell {
          width:100%; max-width:980px; border-radius:16px; padding:22px; 
          background: linear-gradient(180deg, rgba(255,255,255,0.82), rgba(250,255,255,0.6));
          box-shadow: 0 16px 40px rgba(6,90,80,0.06);
          border: 1px solid rgba(200,245,240,0.6);
          backdrop-filter: blur(6px) saturate(120%);
        }
        .hero { display:flex; gap:14px; align-items:center; margin-bottom:12px; }
        .logo { width:68px; height:68px; border-radius:14px; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; background:linear-gradient(135deg,#2bbf9a,#5cc4e6); box-shadow: 0 10px 30px rgba(43,191,154,0.12); }
        .title { font-size:20px; font-weight:800; color:#03363a; margin:0; }
        .subtitle { color:#0b556b; margin:0; font-size:13px; opacity:0.92; }
        .steps { display:flex; gap:8px; margin:12px 0 18px; align-items:center; flex-wrap:wrap; }
        .pill { padding:8px 12px; border-radius:999px; background:rgba(255,255,255,0.6); color:#04464b; font-weight:700; border:1px solid rgba(4,70,75,0.04); }
        .pill.active { background:linear-gradient(90deg,#2bbf9a,#5cc4e6); color:white; box-shadow:0 10px 28px rgba(43,191,154,0.12); }
        .section { background: rgba(255,255,255,0.88); padding:14px; border-radius:12px; border:1px solid rgba(6,182,212,0.04); margin-bottom:12px; box-shadow:0 8px 20px rgba(7,10,20,0.03); }
        .lbl { display:block; font-weight:700; color:#03363a; margin-bottom:6px; font-size:14px; }
        .hint { font-size:13px; color:#0b556b; opacity:0.85; margin-top:6px; }
        .soft { border-radius:10px !important; padding:12px 12px !important; border:1px solid rgba(6,182,212,0.06) !important; background: rgba(250,255,255,0.97) !important; }
        .actions { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:12px; flex-wrap:wrap; }
        .btn-primary-modern { background: linear-gradient(90deg,#2bbf9a,#5cc4e6); border:none; color:white; padding:10px 18px; border-radius:10px; font-weight:800; box-shadow:0 12px 30px rgba(43,191,154,0.12); }
        .btn-secondary-modern { background:transparent; border:1px solid rgba(4,70,75,0.06); color:#04464b; padding:8px 14px; border-radius:10px; font-weight:700; }
        .muted { color:#0b556b; opacity:0.78; font-size:13px; }
        @media (max-width:720px){ .hero { flex-direction:row; } .logo{ width:56px; height:56px; } }
      `}</style>

      <div className="wrap">
        <div className="card-shell">
          <div className="hero">
            <div className="logo">
              <FaHeartbeat size={28} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="title">Simple Health Form</div>
              <div className="subtitle">
                Short, easy questions — for Dr.{" "}
                {doctorData?.name || "your doctor"}
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                Takes ~5 minutes. You can skip any question you don't
                understand.
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="muted">Patient form</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="steps">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className={`pill ${step === i ? "active" : ""}`}>
                  Step {i}
                </div>
              ))}
            </div>
            <div style={{ width: 240 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ fontWeight: 800, color: "#03363a" }}>
                  {Math.round((step / 8) * 100)}% done
                </div>
                <div style={{ flex: 1 }}>
                  <ProgressBar now={(step / 8) * 100} />
                </div>
              </div>
            </div>
          </div>

          <Form onSubmit={handleSubmit}>
            {/* STEP 1 */}
            {step === 1 && (
              <div className="section">
                <label className="lbl">Your full name *</label>
                <Form.Control
                  className="soft"
                  type="text"
                  name="patientname"
                  placeholder="Write full name"
                  value={formData.patientname}
                  onChange={handleChange}
                  isInvalid={!!errors.patientname}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.patientname}
                </Form.Control.Feedback>

                <Row style={{ marginTop: 12 }} className="g-3">
                  <Col md={4}>
                    <label className="lbl">Age *</label>
                    <Form.Control
                      className="soft"
                      type="number"
                      name="patientage"
                      placeholder="Years"
                      value={formData.patientage}
                      onChange={handleChange}
                      isInvalid={!!errors.patientage}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.patientage}
                    </Form.Control.Feedback>
                  </Col>

                  <Col md={4}>
                    <label className="lbl">Gender</label>
                    <Form.Control
                      className="soft"
                      as="select"
                      name="patientgender"
                      value={formData.patientgender}
                      onChange={handleChange}
                    >
                      <option value="">Choose</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Form.Control>
                  </Col>

                  <Col md={4}>
                    <label className="lbl">Phone</label>
                    <InputGroup>
                      <InputGroup.Text
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(6,182,212,0.06)",
                        }}
                      >
                        +91
                      </InputGroup.Text>
                      <Form.Control
                        className="soft"
                        type="tel"
                        name="patientphone"
                        placeholder="Mobile number"
                        value={formData.patientphone}
                        onChange={handleChange}
                      />
                    </InputGroup>
                  </Col>
                </Row>

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">Address (optional)</label>
                  <Form.Control
                    className="soft"
                    as="textarea"
                    rows={2}
                    name="patientaddress"
                    placeholder="House, street, city, pin"
                    value={formData.patientaddress}
                    onChange={handleChange}
                  />
                  <div className="hint">
                    If you don't remember, write city only.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 - safety and meds */}
            {step === 2 && (
              <div className="section">
                <label className="lbl">
                  Do you feel like hurting yourself today?
                </label>
                <div>
                  {["No", "Sometimes", "Often"].map((o, i) => (
                    <Form.Check
                      key={i}
                      inline
                      type="radio"
                      name="suicide"
                      value={o}
                      label={o}
                      checked={formData.suicide === o}
                      onChange={handleChange}
                    />
                  ))}
                </div>
                <div className="hint">
                  If 'Often' — tell a family member or emergency number now.
                </div>

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">
                    Do you use any of these? (tick all that apply)
                  </label>
                  {[
                    "Alcohol",
                    "Tobacco / Smoking",
                    "Cannabis",
                    "Prescription drugs",
                    "Other",
                  ].map((o, i) => (
                    <Form.Check
                      key={i}
                      type="checkbox"
                      name="addiction"
                      value={o}
                      label={o}
                      checked={formData.addiction?.includes(o)}
                      onChange={handleCheckboxChange}
                    />
                  ))}
                </div>

                <Row className="g-3" style={{ marginTop: 12 }}>
                  <Col md={6}>
                    <label className="lbl">
                      Any skin problem treated before?
                    </label>
                    <Form.Control
                      className="soft"
                      as="textarea"
                      rows={1}
                      name="skincondition"
                      placeholder="e.g., rash treated with cream"
                      value={formData.skincondition}
                      onChange={handleChange}
                    />
                  </Col>
                  <Col md={6}>
                    <label className="lbl">
                      Any emotional issue treated before?
                    </label>
                    <Form.Control
                      className="soft"
                      as="textarea"
                      rows={1}
                      name="mentalcondition"
                      placeholder="e.g., medicines given for sadness"
                      value={formData.mentalcondition}
                      onChange={handleChange}
                    />
                  </Col>
                </Row>

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">Any bad reaction after vaccine?</label>
                  <Form.Control
                    className="soft"
                    as="textarea"
                    rows={1}
                    name="vaccine"
                    placeholder="fever, long swelling, other"
                    value={formData.vaccine}
                    onChange={handleChange}
                  />
                  <div className="hint">If you are not sure — leave blank.</div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">Who supports you at home?</label>
                  <Form.Control
                    className="soft"
                    as="textarea"
                    rows={1}
                    name="support"
                    placeholder="e.g., wife, son, neighbour"
                    value={formData.support}
                    onChange={handleChange}
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">Current medicines (names)</label>
                  <Form.Control
                    className="soft"
                    as="textarea"
                    rows={1}
                    name="medication"
                    placeholder="List tablets you take now"
                    value={formData.medication}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* STEP 3 - chief */}
            {step === 3 && (
              <div className="section">
                <label className="lbl">
                  Main problem (write one short sentence)
                </label>
                <Form.Control
                  className="soft"
                  as="textarea"
                  rows={3}
                  name="todayconcern"
                  placeholder="e.g., 'headache every day for 2 months'"
                  value={formData.todayconcern}
                  onChange={handleChange}
                />
                <div className="hint">
                  Be short. Doctor will ask details later.
                </div>

                <Row className="g-3" style={{ marginTop: 12 }}>
                  <Col md={6}>
                    <label className="lbl">How did it start?</label>
                    <Form.Control
                      className="soft"
                      as="select"
                      name="origintrigger"
                      value={formData.origintrigger}
                      onChange={handleChange}
                    >
                      <option value="">Choose</option>
                      <option value="emotional_shock">
                        After a big shock or sadness
                      </option>
                      <option value="physical_injury">After an injury</option>
                      <option value="illness">After fever / illness</option>
                      <option value="vaccination">After vaccine</option>
                      <option value="slow_start">Started slowly</option>
                      <option value="unknown">Don't know</option>
                    </Form.Control>
                  </Col>

                  <Col md={6}>
                    <label className="lbl">Does it come and go or stay?</label>
                    <Form.Control
                      className="soft"
                      as="select"
                      name="pattern"
                      value={formData.pattern}
                      onChange={handleChange}
                    >
                      <option value="">Choose</option>
                      <option value="sudden">Sudden & strong</option>
                      <option value="gradual">Slow & getting worse</option>
                      <option value="intermittent">Comes & goes</option>
                      <option value="periodic">At certain times</option>
                      <option value="suppressed_return">
                        Returned after medicine
                      </option>
                    </Form.Control>
                  </Col>
                </Row>

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">
                    How much does it affect your life?
                  </label>
                  <Form.Control
                    className="soft"
                    as="select"
                    name="impact"
                    value={formData.impact}
                    onChange={handleChange}
                  >
                    <option value="">Choose</option>
                    <option value="mild">Mild — not much trouble</option>
                    <option value="bothers_daily">Bothers me daily</option>
                    <option value="affect_sleep">Affects sleep</option>
                    <option value="affect_work">Affects work</option>
                    <option value="severe">Severe — needs urgent help</option>
                  </Form.Control>
                </div>
              </div>
            )}

            {/* STEP 4 - body type + simple miasm UI (plain text labels + preserved VALUES) */}
            {step === 4 && (
              <div className="section">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <label className="lbl">Body temperature feel</label>
                    <div>
                      <Form.Check
                        inline
                        type="radio"
                        name="thermal"
                        value="hot"
                        label="Usually feels hot"
                        checked={formData.thermal === "hot"}
                        onChange={handleChange}
                      />
                      <Form.Check
                        inline
                        type="radio"
                        name="thermal"
                        value="cold"
                        label="Usually feels cold"
                        checked={formData.thermal === "cold"}
                        onChange={handleChange}
                      />
                      <Form.Check
                        inline
                        type="radio"
                        name="thermal"
                        value="variable"
                        label="Varies"
                        checked={formData.thermal === "variable"}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="lbl">Energy level</label>
                    {/* VALUES preserved for backend: 'high'/'low'/'variable' */}
                    <div>
                      <Form.Check
                        inline
                        type="radio"
                        name="energy"
                        value="high"
                        label="Active / High energy"
                        checked={formData.energy === "high"}
                        onChange={handleChange}
                      />
                      <Form.Check
                        inline
                        type="radio"
                        name="energy"
                        value="low"
                        label="Often tired / low"
                        checked={formData.energy === "low"}
                        onChange={handleChange}
                      />
                      <Form.Check
                        inline
                        type="radio"
                        name="energy"
                        value="variable"
                        label="Varies day to day"
                        checked={formData.energy === "variable"}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">
                    How strongly does your body react to things?
                  </label>
                  {/* VALUES preserved for backend: 'hyper' / 'hypo' / 'normal' */}
                  <div>
                    <Form.Check
                      inline
                      type="radio"
                      name="reactivity"
                      value="hyper"
                      label="Strong reactions (small things cause big trouble)"
                      checked={formData.reactivity === "hyper"}
                      onChange={handleChange}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      name="reactivity"
                      value="hypo"
                      label="Weak reactions (hardly reacts)"
                      checked={formData.reactivity === "hypo"}
                      onChange={handleChange}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      name="reactivity"
                      value="normal"
                      label="Normal reaction"
                      checked={formData.reactivity === "normal"}
                      onChange={handleChange}
                    />
                    <Button
                      variant="link"
                      style={{ padding: 0, marginLeft: 8 }}
                      onClick={() => openExplain("reactivity")}
                    >
                      <FaInfoCircle /> What does this mean?
                    </Button>
                  </div>
                  <div className="hint">
                    If you don’t know — choose 'Normal' or leave blank.
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">Body build (choose nearest)</label>
                  <Form.Control
                    className="soft"
                    as="select"
                    name="physique"
                    value={formData.physique}
                    onChange={handleChange}
                  >
                    <option value="">Choose</option>
                    <option value="tall_thin">Tall & thin</option>
                    <option value="average">Average</option>
                    <option value="short_stout">Short & heavy</option>
                    <option value="muscular">Muscular</option>
                  </Form.Control>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">
                    Long-term patterns (choose if you know)
                  </label>
                  <div className="hint">
                    Example labels shown in plain language. If unsure — skip.
                  </div>

                  {/* IMPORTANT: underlying VALUES preserved for doctor API */}
                  <div style={{ marginTop: 8 }}>
                    <Form.Check
                      type="checkbox"
                      name="miasmatic"
                      id="mia-psora"
                      value="psora"
                      label="Lifelong skin problems (itchy rashes / eczema)"
                      checked={formData.miasmatic?.includes("psora")}
                      onChange={handleCheckboxChange}
                    />
                    <Form.Check
                      type="checkbox"
                      name="miasmatic"
                      id="mia-sycosis"
                      value="sycosis"
                      label="Long-standing warts / growths"
                      checked={formData.miasmatic?.includes("sycosis")}
                      onChange={handleCheckboxChange}
                    />
                    <Form.Check
                      type="checkbox"
                      name="miasmatic"
                      id="mia-syph"
                      value="syphilis"
                      label="Deep, recurrent infections or very destructive problems"
                      checked={formData.miasmatic?.includes("syphilis")}
                      onChange={handleCheckboxChange}
                    />
                    <Form.Check
                      type="checkbox"
                      name="miasmatic"
                      id="mia-tub"
                      value="tubercular"
                      label="Long-term wasting / cough / weakness"
                      checked={formData.miasmatic?.includes("tubercular")}
                      onChange={handleCheckboxChange}
                    />
                    <Form.Check
                      type="checkbox"
                      name="miasmatic"
                      id="mia-cancer"
                      value="cancer"
                      label="Serious chronic disease history"
                      checked={formData.miasmatic?.includes("cancer")}
                      onChange={handleCheckboxChange}
                    />
                  </div>

                  <div className="hint" style={{ marginTop: 6 }}>
                    If you don't understand these terms — leave blank. Doctor
                    will fill during consultation.
                    <Button variant="link" onClick={() => openExplain("miasm")}>
                      <FaInfoCircle /> Explain in one line
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5 - mental */}
            {step === 5 && (
              <div className="section">
                <label className="lbl">Bad dreams or night fears?</label>
                <Form.Control
                  className="soft"
                  as="textarea"
                  rows={2}
                  name="nightmares"
                  placeholder="Shortly write if yes"
                  value={formData.nightmares}
                  onChange={handleChange}
                />

                <Row className="g-3" style={{ marginTop: 12 }}>
                  <Col md={6}>
                    <label className="lbl">How do you sleep?</label>
                    <Form.Control
                      className="soft"
                      as="select"
                      name="sleep"
                      value={formData.sleep}
                      onChange={handleChange}
                    >
                      <option value="">Choose</option>
                      <option value="sleep_well">Sleep well</option>
                      <option value="take_long_time">Take long to sleep</option>
                      <option value="wake_early">
                        Wake early / can't sleep
                      </option>
                      <option value="wake_3am">Wake at 3 AM often</option>
                    </Form.Control>
                  </Col>

                  <Col md={6}>
                    <label className="lbl">How you feel on waking?</label>
                    <Form.Control
                      className="soft"
                      as="select"
                      name="wakeup"
                      value={formData.wakeup}
                      onChange={handleChange}
                    >
                      <option value="">Choose</option>
                      <option value="refreshed">Refreshed</option>
                      <option value="tired">Tired</option>
                      <option value="anxious">Anxious</option>
                    </Form.Control>
                  </Col>
                </Row>

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">
                    Fears & repeated thoughts (tick any)
                  </label>
                  {[
                    "Death",
                    "Disease",
                    "Crowds",
                    "Darkness",
                    "Being alone",
                  ].map((o, i) => (
                    <Form.Check
                      key={i}
                      inline
                      type="checkbox"
                      name="fear"
                      value={o}
                      label={o}
                      checked={formData.fear?.includes(o)}
                      onChange={handleCheckboxChange}
                    />
                  ))}
                </div>

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">
                    Anything else about your mind? (short)
                  </label>
                  <Form.Control
                    className="soft"
                    as="textarea"
                    rows={2}
                    name="mentalsymtoms"
                    placeholder="Short note, e.g., worry, panic"
                    value={formData.mentalsymtoms}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* STEP 6 - timings/weather */}
            {step === 6 && (
              <div className="section">
                <label className="lbl">When is it better or worse?</label>
                <div className="muted">
                  Pick Better or Worse (if unsure leave blank)
                </div>
                {[
                  "morning",
                  "noon",
                  "afternoon",
                  "evening",
                  "night",
                  "beforeMidnight",
                  "afterMidnight",
                ].map((t, i) => (
                  <div key={t} style={{ marginTop: 10 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#03363a",
                        textTransform: "capitalize",
                      }}
                    >
                      {t.replace(/([A-Z])/g, " $1")}
                    </div>
                    <Form.Check
                      inline
                      type="radio"
                      name={t}
                      value="Better"
                      label="Better"
                      checked={formData[t] === "Better"}
                      onChange={handleChange}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      name={t}
                      value="Worse"
                      label="Worse"
                      checked={formData[t] === "Worse"}
                      onChange={handleChange}
                    />
                  </div>
                ))}

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">Weather effect</label>
                  {[
                    ["hotWeather", "Hot weather"],
                    ["coldWeather", "Cold weather"],
                    ["dampWeather", "Humid/damp"],
                    ["dryWeather", "Dry"],
                  ].map(([name, label], i) => (
                    <div key={name} style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 700 }}>{label}</div>
                      <Form.Check
                        inline
                        type="radio"
                        name={name}
                        value="Better"
                        label="Better"
                        checked={formData[name] === "Better"}
                        onChange={handleChange}
                      />
                      <Form.Check
                        inline
                        type="radio"
                        name={name}
                        value="Worse"
                        label="Worse"
                        checked={formData[name] === "Worse"}
                        onChange={handleChange}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 7 - womens & systems */}
            {step === 7 && (
              <div className="section">
                <label className="lbl">Women's health (if applicable)</label>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Control
                      className="soft"
                      type="text"
                      name="menstrualcycle"
                      placeholder="Cycle length (days)"
                      value={formData.menstrualcycle}
                      onChange={handleChange}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Control
                      className="soft"
                      type="text"
                      name="flowduration"
                      placeholder="Flow length (days)"
                      value={formData.flowduration}
                      onChange={handleChange}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Control
                      className="soft"
                      as="select"
                      name="flowtype"
                      value={formData.flowtype}
                      onChange={handleChange}
                    >
                      <option value="">Flow type</option>
                      <option value="heavy_clots">Heavy, with clots</option>
                      <option value="moderate_normal">Moderate</option>
                      <option value="light_scanty">Light</option>
                    </Form.Control>
                  </Col>
                </Row>

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">Problems in body (tick any)</label>
                  <div style={{ maxHeight: 160, overflowY: "auto" }}>
                    {[
                      "Headache",
                      "Cough",
                      "Short breath",
                      "Chest pain",
                      "Stomach pain",
                      "Constipation",
                      "Diarrhoea",
                      "Urine trouble",
                      "Joint pain",
                      "Rashes",
                      "Tiredness",
                    ].map((o, i) => (
                      <Form.Check
                        key={i}
                        type="checkbox"
                        name="systemreview"
                        value={o}
                        label={o}
                        checked={formData.systemreview?.includes(o)}
                        onChange={handleCheckboxChange}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8 - files & final */}
            {step === 8 && (
              <div className="section">
                <label className="lbl">
                  Attach any reports or photos (optional)
                </label>
                <Form.Control
                  className="soft"
                  type="file"
                  name="image"
                  accept="image/*,application/pdf"
                  onChange={handleImageChange}
                />
                <div className="muted" style={{ marginTop: 8 }}>
                  Photos of rash, old prescriptions, or lab reports help the
                  doctor.
                </div>

                {imagePreview && (
                  <div style={{ marginTop: 12 }}>
                    <img
                      src={imagePreview}
                      alt="preview"
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 10,
                        boxShadow: "0 8px 20px rgba(6,90,80,0.06)",
                      }}
                    />
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <label className="lbl">
                    Any other important note (short)
                  </label>
                  <Form.Control
                    className="soft"
                    as="textarea"
                    rows={3}
                    name="constassess"
                    placeholder="Anything else you want the doctor to know"
                    value={formData.constassess}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div className="actions">
              <div>
                {step > 1 ? (
                  <Button
                    variant="secondary"
                    className="btn-secondary-modern"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div className="muted" style={{ alignSelf: "center" }}>
                  Step {step}/8
                </div>
                {step < 8 ? (
                  <Button
                    type="button"
                    className="btn-primary-modern"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="btn-primary-modern"
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </Button>
                )}
              </div>
            </div>
          </Form>
        </div>
      </div>

      {/* Explanation modal (plain language short helps) */}
      <Modal
        show={showExplainModal}
        onHide={() => setShowExplainModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Quick explain</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ color: "#03363a", fontWeight: 700, marginBottom: 8 }}>
            Short note
          </div>
          <div style={{ color: "#0b556b" }}>{explainText}</div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowExplainModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default UserForm;
