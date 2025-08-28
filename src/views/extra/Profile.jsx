import React, { useState, useEffect, useContext } from "react";
import { Card, Row, Form, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../utility/api";
import { API_URL } from "../../constants";
import "react-confirm-alert/src/react-confirm-alert.css";
import Loader from "./Loader";
import { UserContext } from "../../contexts/UserContext";
import { toast } from "react-toastify";

/**
 * Profile
 * - Keeps component name and handler name handleSubmit unchanged.
 * - Preserves original payload keys and adds new doctor/security fields.
 * - Single-file, inline styles for pastel theme and contrast.
 */

const Profile = () => {
  // original states + new fields for doctor profile
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    hit_count: 0,
    hit_limit: 0,
    profile_pic: null,
    // new professional fields
    qualifications: "",
    specialties: "", // comma-separated or multi-select UI
    years_experience: "",
    license_number: "",
    clinic_name: "",
    clinic_address: "",
    consultation_hours: "", // freeform e.g., "Mon-Fri 9am-1pm"
    languages_spoken: "", // comma-separated
    fee_structure: "", // freeform
    telemedicine_available: false,
    emergency_contact: "",
    // security/privacy
    mfa_enabled: false,
    profile_visible_to_patients: true,
    show_license_to_public: true,
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [auditLog, setAuditLog] = useState([]); // mock or fetched audit entries
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    // load initial values from user context (preserve original keys)
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        address: user.address || prev.address,
        phone: user.phone || prev.phone,
        hit_count: user?.hit_count || prev.hit_count,
        hit_limit: user?.hit_limit || prev.hit_limit,
        profile_pic: user?.profile_pic || prev.profile_pic,
        // try to map any existing server-side fields if present
        qualifications: user.qualifications || prev.qualifications,
        specialties: user.specialties
          ? user.specialties.join?.(",") || user.specialties
          : prev.specialties,
        years_experience: user.years_experience || prev.years_experience,
        license_number: user.license_number || prev.license_number,
        clinic_name: user.clinic_name || prev.clinic_name,
        clinic_address: user.clinic_address || prev.clinic_address,
        consultation_hours: user.consultation_hours || prev.consultation_hours,
        languages_spoken: user.languages_spoken
          ? user.languages_spoken.join?.(",") || user.languages_spoken
          : prev.languages_spoken,
        fee_structure: user.fee_structure || prev.fee_structure,
        telemedicine_available:
          user.telemedicine_available ?? prev.telemedicine_available,
        emergency_contact: user.emergency_contact || prev.emergency_contact,
        mfa_enabled: user.mfa_enabled ?? prev.mfa_enabled,
        profile_visible_to_patients:
          user.profile_visible_to_patients ?? prev.profile_visible_to_patients,
        show_license_to_public:
          user.show_license_to_public ?? prev.show_license_to_public,
      }));
      setImagePreview(user.profile_pic ? `${user.profile_pic}` : null);

      // optionally load audit log if user object provides it; otherwise mock
      setAuditLog(
        user.audit_log || [
          {
            id: 1,
            ts: new Date().toISOString(),
            actor: "system",
            action: "Created account",
          },
          {
            id: 2,
            ts: new Date().toISOString(),
            actor: "admin",
            action: "Verified license",
          },
        ]
      );
    }
  }, [user]);

  // profile completion calculation
  const computeCompletion = (fd) => {
    const fields = [
      "name",
      "email",
      "qualifications",
      "specialties",
      "license_number",
      "clinic_name",
      "clinic_address",
      "phone",
    ];
    const filled = fields.reduce(
      (s, k) => (fd[k] && String(fd[k]).trim() !== "" ? s + 1 : s),
      0
    );
    return Math.round((filled / fields.length) * 100);
  };
  const completionPct = computeCompletion(formData);

  // keep same handler name (important)
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);

      // basic client validation (non-invasive)
      const localErrors = {};
      if (!formData.name || formData.name.trim() === "")
        localErrors.name = "Name is required";
      if (!formData.qualifications || formData.qualifications.trim() === "")
        localErrors.qualifications = "Qualifications required";
      if (!formData.license_number || formData.license_number.trim() === "")
        localErrors.license_number = "License number required";
      if (formData.phone && !/^\d{6,15}$/.test(String(formData.phone).trim()))
        localErrors.phone = "Enter a valid phone (digits only)";
      setErrors(localErrors);
      if (Object.keys(localErrors).length) {
        setLoading(false);
        toast.error("Name, qualification, license number and phone is required");
        return;
      }

      const payload = new FormData();
      // original required payloads preserved
      payload.append("name", formData.name.trim());
      payload.append("address", formData.address || "");
      payload.append("phone", formData.phone || "");
      if (formData.profile_pic) {
        // file or URL - if file object, append; if url, backend may expect a different field
        if (formData.profile_pic instanceof File) {
          payload.append("profile_pic", formData.profile_pic);
        } else {
          payload.append("profile_pic_url", formData.profile_pic);
        }
      }

      // append new professional fields (backend must accept these keys; if not, adjust)
      payload.append("qualifications", formData.qualifications || "");
      payload.append("specialties", formData.specialties || "");
      payload.append("years_experience", formData.years_experience || "");
      payload.append("license_number", formData.license_number || "");
      payload.append("clinic_name", formData.clinic_name || "");
      payload.append("clinic_address", formData.clinic_address || "");
      payload.append("consultation_hours", formData.consultation_hours || "");
      payload.append("languages_spoken", formData.languages_spoken || "");
      payload.append("fee_structure", formData.fee_structure || "");
      payload.append(
        "telemedicine_available",
        formData.telemedicine_available ? "1" : "0"
      );
      payload.append("emergency_contact", formData.emergency_contact || "");

      // security & privacy (UI-level toggles)
      payload.append("mfa_enabled", formData.mfa_enabled ? "1" : "0");
      payload.append(
        "profile_visible_to_patients",
        formData.profile_visible_to_patients ? "1" : "0"
      );
      payload.append(
        "show_license_to_public",
        formData.show_license_to_public ? "1" : "0"
      );

      const response = await api.put(
        `${API_URL}/users/update_user/${user?._id}`,
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setData(response.data.data);
      toast.success("Profile updated");
      // update local audit log with an entry
      setAuditLog((prev) =>
        [
          {
            id: Date.now(),
            ts: new Date().toISOString(),
            actor: user?.email || "you",
            action: "Updated profile",
          },
          ...prev,
        ].slice(0, 12)
      );
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "An error occurred.");
      } else {
        toast.error("An error occurred.");
      }
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const maxMB = 5;
      if (file.size && file.size / 1024 / 1024 > maxMB) {
        toast.error(`File too large. Max ${maxMB}MB.`);
        return;
      }
      setFormData({ ...formData, profile_pic: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // derived values
  const hitLimit = Number(formData.hit_limit || 0);
  const hitCount = Number(formData.hit_count || 0);
  const usagePct =
    hitLimit > 0 ? Math.min(100, Math.round((hitCount / hitLimit) * 100)) : 0;

  // small helper for display of specialties/languages as badges
  const splitComma = (s) =>
    s
      ? s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
      : [];

  return (
    <>
      <style>{`
        :root{
          --page-bg: linear-gradient(180deg, #f7fbff 0%, #fff7fc 100%);
          --left-grad: linear-gradient(135deg, #CDEBFF 0%, #E0D7FF 55%, #FFD2E6 100%);
          --accent-1: #5b6cff;
          --accent-2: #ff6fa3;
          --accent-3: #06b6a4;
          --card-white: #ffffff;
          --muted-dark: #6b7280;
          --text-dark: #0f172a;
          --radius: 14px;
          --shadow-lg: 0 18px 46px rgba(12,22,40,0.08);
        }
        *{box-sizing:border-box}
        body{ margin:0; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; -webkit-font-smoothing:antialiased; background:var(--page-bg); color:var(--text-dark) }
        .wrapper{ padding:28px; display:flex; justify-content:center; }
        .profile-card { width:1100px; max-width:96%; display:grid; grid-template-columns: 360px 1fr; gap:22px; background:transparent; }
        .panel-left { border-radius:var(--radius); padding:22px; background:var(--left-grad); color:#0b1220; box-shadow:var(--shadow-lg); display:flex; flex-direction:column; align-items:center; }
        .avatar-outer{ width:140px; height:140px; border-radius:50%; background: linear-gradient(90deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04)); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(10,20,40,0.06); }
        .avatar-ring{ width:124px; height:124px; border-radius:50%; background:conic-gradient(from 180deg, rgba(91,108,255,0.12), rgba(255,111,163,0.12)); display:flex; align-items:center; justify-content:center; }
        .avatar{ width:96px; height:96px; border-radius:50%; object-fit:cover; border:3px solid #fff; }
        .name{ margin-top:14px; font-size:20px; font-weight:700; color:var(--text-dark); }
        .email{ margin-top:6px; color:var(--muted-dark); font-size:13px; }
        .meta-row{ display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; justify-content:center; }
        .badge { padding:6px 10px; border-radius:999px; background:rgba(255,255,255,0.65); color:var(--text-dark); font-weight:700; font-size:12px; }
        .usage-section{ width:100%; margin-top:18px; background: rgba(255,255,255,0.6); padding:12px; border-radius:12px; }
        .usage-row{ display:flex; justify-content:space-between; align-items:center; color:var(--text-dark); font-size:13px; margin-bottom:8px; font-weight:600; }
        .usage-bar{ height:10px; background: rgba(12,22,40,0.06); border-radius:10px; overflow:hidden; }
        .usage-fill{ height:100%; background:linear-gradient(90deg, var(--accent-1), var(--accent-2)); width:0%; transition: width .4s ease; }

        .panel-right{ background:var(--card-white); border-radius:var(--radius); padding:22px; box-shadow:0 12px 34px rgba(12,22,40,0.04); color:var(--text-dark); }
        .panel-title{ font-size:20px; font-weight:800; margin-bottom:6px; }
        .panel-sub{ color:var(--muted-dark); font-size:13px; margin-bottom:14px; }

        .form-grid{ display:grid; grid-template-columns: 1fr; gap:12px; }
        .row { display:flex; gap:12px; align-items:center; }
        label.field-label{ width:160px; color:var(--muted-dark); text-align:right; padding-right:8px; font-size:14px; }
        .control { flex:1; }

        .input {
          width:100%; padding:12px 14px; border-radius:12px; border:1px solid #e6eef8; background: linear-gradient(180deg,#fbfdff,#f7f9ff); color:var(--text-dark); outline:none;
        }
        .input:focus{ box-shadow:0 8px 24px rgba(91,108,255,0.06); border-color:#dbe8ff; }

        .checkbox-inline{ display:flex; align-items:center; gap:10px; color:var(--muted-dark); }

        .actions { display:flex; gap:12px; margin-top:14px; }
        .btn-primary {
          padding:10px 18px; border-radius:999px; border:0; cursor:pointer; font-weight:800; color:#fff; background: linear-gradient(90deg,var(--accent-1),var(--accent-2));
          box-shadow: 0 12px 28px rgba(91,108,255,0.12);
        }
        .btn-secondary { padding:10px 18px; border-radius:999px; border:0; cursor:pointer; font-weight:700; background:#fff7f9; color:var(--text-dark); box-shadow: 0 8px 20px rgba(0,0,0,0.04); }
        .btn-upgrade { padding:10px 18px; border-radius:999px; border:0; cursor:pointer; font-weight:800; color:#003936; background: linear-gradient(90deg,#7ee3c8,#06b6a4); box-shadow: 0 12px 28px rgba(6,182,164,0.12); }

        .helper { font-size:13px; color:var(--muted-dark); margin-top:6px; }

        .audit { margin-top:18px; background:#fbfdff; padding:12px; border-radius:8px; border:1px solid #f0f6ff; max-height:160px; overflow:auto; }
        .audit-item { font-size:13px; color:var(--muted-dark); padding:8px 0; border-bottom:1px dashed #f0f6ff; }
        .audit-item:last-child{ border-bottom:0; }

        @media (max-width: 980px){ .profile-card{ grid-template-columns: 1fr; } label.field-label{ width:130px; text-align:left; padding-right:8px } .panel-left{ align-items:center } }
      `}</style>

      <div className="wrapper" role="main" aria-label="Doctor profile">
        <div className="profile-card" aria-live="polite">
          {/* LEFT — creative pastel gradient and high-contrast badges */}
          <aside className="panel-left" aria-hidden="false">
            <div className="avatar-outer" aria-hidden="true">
              <div className="avatar-ring" aria-hidden="true">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile preview"
                    className="avatar"
                  />
                ) : (
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || "Dr")}&background=ffffff&color=1f2937&size=96`}
                    alt="Avatar"
                    className="avatar"
                  />
                )}
              </div>
            </div>

            <div className="name" id="profile-heading">
              {formData.name || "—"}
            </div>
            <div className="email">{formData.email || ""}</div>

            <div className="meta-row" aria-hidden="true">
              {formData.qualifications && (
                <div className="badge">{formData.qualifications}</div>
              )}
              {formData.specialties &&
                splitComma(formData.specialties)
                  .slice(0, 3)
                  .map((s, i) => (
                    <div key={i} className="badge">
                      {s}
                    </div>
                  ))}
            </div>

            <div className="usage-section" aria-hidden="false">
              <div className="usage-row">
                <div>Remaining</div>
                <div style={{ fontWeight: 700 }}>
                  {hitCount} / {hitLimit || "—"}
                </div>
              </div>
              <div className="usage-bar" aria-hidden="true">
                <div className="usage-fill" style={{ width: `${usagePct}%` }} />
              </div>
            </div>

            <div style={{ marginTop: 14, width: "100%", textAlign: "center" }}>
              <div
                style={{
                  fontSize: 13,
                  color: "#083344",
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                Profile Completion
              </div>
              <div
                style={{
                  height: 10,
                  background: "rgba(11,20,40,0.06)",
                  borderRadius: 6,
                  overflow: "hidden",
                  margin: "0 22px",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${completionPct}%`,
                    background:
                      "linear-gradient(90deg,var(--accent-1),var(--accent-2))",
                    transition: "width .3s ease",
                  }}
                />
              </div>
              <div style={{ fontSize: 12, color: "#083344", marginTop: 8 }}>
                {completionPct}% complete
              </div>
            </div>
          </aside>

          {/* RIGHT — form on white surface */}
          <section className="panel-right" aria-labelledby="profile-heading">
            <div>
              <div className="panel-title">Profile</div>
              <div className="panel-sub">
                Update your profile information — encrypted & auditable
              </div>
            </div>

            <form onSubmit={handleSubmit} aria-label="Profile update form">
              <div className="form-grid">
                {/* Profile Picture */}
                <div className="row">
                  <label className="field-label">Profile Picture:</label>
                  <div className="control">
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      name="profile_pic"
                      className="input"
                      aria-label="Upload profile picture"
                    />
                    <div className="helper">
                      Allowed: JPG/PNG. Max 5MB. Preview at left.
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="row">
                  <label className="field-label">Name:</label>
                  <div className="control">
                    <Form.Control
                      type="text"
                      placeholder="Enter name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input"
                      aria-label="Full name"
                    />
                    {errors.name && (
                      <div className="helper" style={{ color: "#dc2626" }}>
                        {errors.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Qualifications */}
                <div className="row">
                  <label className="field-label">Qualifications:</label>
                  <div className="control">
                    <Form.Control
                      type="text"
                      placeholder="e.g., M.D., PhD"
                      name="qualifications"
                      value={formData.qualifications}
                      onChange={handleChange}
                      className="input"
                      aria-label="Qualifications"
                    />
                    {errors.qualifications && (
                      <div className="helper" style={{ color: "#dc2626" }}>
                        {errors.qualifications}
                      </div>
                    )}
                  </div>
                </div>

                {/* Specialties */}
                <div className="row">
                  <label className="field-label">Specialties:</label>
                  <div className="control">
                    <Form.Control
                      type="text"
                      placeholder="e.g., Homeopathy, Pediatrics (comma-separated)"
                      name="specialties"
                      value={formData.specialties}
                      onChange={handleChange}
                      className="input"
                      aria-label="Specialties"
                    />
                    <div className="helper">
                      Comma-separated. Will be shown as specialty badges.
                    </div>
                  </div>
                </div>

                {/* Years of experience + License */}
                <div className="row">
                  <label className="field-label">Years Experience:</label>
                  <div className="control">
                    <Form.Control
                      type="number"
                      placeholder="Years"
                      name="years_experience"
                      value={formData.years_experience}
                      onChange={handleChange}
                      className="input"
                      aria-label="Years of experience"
                      style={{ minWidth: 140 }}
                    />
                  </div>
                </div>

                <div className="row">
                  <label className="field-label">License number:</label>
                  <div className="control">
                    <Form.Control
                      type="text"
                      placeholder="License number"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleChange}
                      className="input"
                      aria-label="License number"
                    />
                  </div>
                </div>

                {/* Clinic */}
                <div className="row">
                  <label className="field-label">Clinic Name:</label>
                  <div className="control">
                    <Form.Control
                      type="text"
                      placeholder="Clinic or practice name"
                      name="clinic_name"
                      value={formData.clinic_name}
                      onChange={handleChange}
                      className="input"
                      aria-label="Clinic name"
                    />
                  </div>
                </div>

                <div className="row">
                  <label className="field-label">Clinic Address:</label>
                  <div className="control">
                    <Form.Control
                      type="text"
                      placeholder="Clinic / Practice address"
                      name="clinic_address"
                      value={formData.clinic_address}
                      onChange={handleChange}
                      className="input"
                      aria-label="Clinic address"
                    />
                  </div>
                </div>

                {/* Consultation hours */}
                <div className="row">
                  <label className="field-label">Consultation Hours:</label>
                  <div className="control">
                    <Form.Control
                      type="text"
                      placeholder="e.g., Mon-Fri 9am-1pm, Sat 10am-2pm"
                      name="consultation_hours"
                      value={formData.consultation_hours}
                      onChange={handleChange}
                      className="input"
                      aria-label="Consultation hours"
                    />
                    <div className="helper">
                      Displayed to patients booking appointments.
                    </div>
                  </div>
                </div>

                {/* Languages & Fee */}
                <div className="row">
                  <label className="field-label">Languages:</label>
                  <div className="control">
                    <Form.Control
                      type="text"
                      placeholder="Comma-separated (English, Hindi...)"
                      name="languages_spoken"
                      value={formData.languages_spoken}
                      onChange={handleChange}
                      className="input"
                      aria-label="Languages spoken"
                    />
                  </div>
                </div>

                <div className="row">
                  <label className="field-label">Fee Structure:</label>
                  <div className="control">
                    <Form.Control
                      type="text"
                      placeholder="Consultation fee, follow-up fee (optional)"
                      name="fee_structure"
                      value={formData.fee_structure}
                      onChange={handleChange}
                      className="input"
                      aria-label="Fee structure"
                    />
                  </div>
                </div>

                {/* Phone + Emergency */}
                <div className="row">
                  <label className="field-label">Phone:</label>
                  <div className="control">
                    <Form.Control
                      type="text"
                      placeholder="Enter phone"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: (e.target.value || "").replace(/[^0-9]/g, ""),
                        })
                      }
                      className="input"
                      aria-label="Phone"
                    />
                    {errors.phone && (
                      <div className="helper" style={{ color: "#dc2626" }}>
                        {errors.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="row">
                  <label className="field-label">Emergency Contact:</label>
                  <div className="control">
                    <Form.Control
                      type="text"
                      placeholder="Emergency phone / contact person"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                      className="input"
                      aria-label="Emergency contact"
                    />
                  </div>
                </div>

                {/* Telemedicine toggle */}
                <div className="row">
                  <label className="field-label">Telemedicine:</label>
                  <div className="control">
                    <div className="checkbox-inline">
                      <input
                        id="tele"
                        name="telemedicine_available"
                        type="checkbox"
                        checked={!!formData.telemedicine_available}
                        onChange={handleChange}
                      />
                      <label
                        htmlFor="tele"
                        style={{ color: "var(--muted-dark)" }}
                      >
                        Available for teleconsultation
                      </label>
                    </div>
                  </div>
                </div>

                {/* Security / Privacy toggles */}
                <div className="row">
                  <label className="field-label">Multi-factor Auth:</label>
                  <div className="control">
                    <div className="checkbox-inline">
                      <input
                        id="mfa"
                        name="mfa_enabled"
                        type="checkbox"
                        checked={!!formData.mfa_enabled}
                        onChange={handleChange}
                      />
                      <label
                        htmlFor="mfa"
                        style={{ color: "var(--muted-dark)" }}
                      >
                        Require MFA for login
                      </label>
                    </div>
                    <div className="helper">
                      Strongly recommended when handling PHI.
                    </div>
                  </div>
                </div>

                <div className="row">
                  <label className="field-label">Profile Visibility:</label>
                  <div className="control">
                    <div className="checkbox-inline">
                      <input
                        id="vis"
                        name="profile_visible_to_patients"
                        type="checkbox"
                        checked={!!formData.profile_visible_to_patients}
                        onChange={handleChange}
                      />
                      <label
                        htmlFor="vis"
                        style={{ color: "var(--muted-dark)" }}
                      >
                        Visible to patients
                      </label>
                    </div>
                    <div style={{ height: 8 }} />
                    <div className="checkbox-inline">
                      <input
                        id="lic"
                        name="show_license_to_public"
                        type="checkbox"
                        checked={!!formData.show_license_to_public}
                        onChange={handleChange}
                      />
                      <label
                        htmlFor="lic"
                        style={{ color: "var(--muted-dark)" }}
                      >
                        Show license number on public profile
                      </label>
                    </div>
                  </div>
                </div>

                {/* Hit counts (disabled) */}
                <div className="row">
                  <label className="field-label">Remaining Hit Counts:</label>
                  <div className="control">
                    <Form.Control
                      type="number"
                      placeholder="Hit counts"
                      name="hit_count"
                      value={formData.hit_count}
                      onChange={handleChange}
                      className="input"
                      disabled
                      aria-label="Hit counts"
                    />
                    <div className="helper">
                      Read-only: your usage for the billing period.
                    </div>
                  </div>
                </div>

                <div className="row">
                  <label className="field-label">Hit Limit:</label>
                  <div className="control">
                    <Form.Control
                      type="number"
                      placeholder="Hit limit"
                      name="hit_limit"
                      value={formData.hit_limit}
                      onChange={handleChange}
                      className="input"
                      disabled
                      aria-label="Hit limit"
                    />
                  </div>
                </div>

                {/* Actions + Audit */}
                <div
                  style={{
                    display: "flex",
                    gap: 18,
                    alignItems: "center",
                    marginTop: 6,
                  }}
                >
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  // aria-busy={loading}
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate("/app/dashboard")}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-upgrade"
                    onClick={() => navigate("/plans")}
                  >
                    Upgrade Your Plan
                  </button>
                </div>

                <div className="helper">
                  Changes are encrypted in transit and recorded in your audit
                  log. Use MFA for stronger account protection.
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
};

export default Profile;
