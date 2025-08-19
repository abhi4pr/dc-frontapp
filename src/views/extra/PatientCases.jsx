// PatientCases.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
  useRef,
  Fragment,
} from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Badge,
  Button,
  Spinner,
  InputGroup,
  Dropdown,
  Modal,
} from "react-bootstrap";
import { UserContext } from "../../contexts/UserContext";
import api from "../../utility/api";
import { API_URL } from "../../constants";
import { Link, useNavigate } from "react-router-dom";

/**
 * Upgraded single-file PatientCases.jsx
 * - Preserves state/handler names (fetchData, patientCase, search, loading)
 * - Modern Dribbble-like UI using inline styles + small CSS block (no external files)
 * - Single-file, paste & run (requires existing imports in your project)
 */

/* ---------- tiny helpers ---------- */
const formatTimeAgo = (iso) => {
  if (!iso) return "Unknown";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
};
const priorityColor = (p) =>
  p === "High" ? "danger" : p === "Medium" ? "warning" : "success";
const defaultStatuses = ["Active", "Closed"];

/* temporary demo useful fallback (kept) */
const staticData = [

];

/* ---------- Styles: CSS block for animations + small classes ---------- */
const GlobalStyles = () => (
  <style>{`
    :root{
      --bg: #f7fbfc;
      --muted: #6b7280;
      --accent: #0f6b66;
      --card-bg: rgba(255,255,255,0.9);
      --glass: rgba(255,255,255,0.6);
      --soft-shadow: 0 8px 30px rgba(16,24,40,0.06);
      --radius-lg: 14px;
    }

    /* shimmer skeleton */
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .skeleton {
      background: linear-gradient(90deg, #eef2f3 0%, #f7fafb 50%, #eef2f3 100%);
      background-size: 200% 100%;
      animation: shimmer 1.4s linear infinite;
      border-radius: 8px;
    }
    /* subtle focus */
    .focus-ring:focus { outline: 3px solid rgba(15,107,102,0.12); outline-offset: 2px; }
    .dribbble-card { transition: transform .16s ease, box-shadow .16s ease; }
    .dribbble-card:hover { transform: translateY(-6px); box-shadow: var(--soft-shadow); }
    .pill { padding: 6px 10px; border-radius: 999px; font-size: 13px; display:inline-flex; align-items:center; gap:8px; }
    .muted { color: var(--muted); font-size:13px; }
    .tiny { font-size:12px; color:var(--muted); }
    /* responsive board */
    @media (max-width: 980px) {
      .board { overflow-x: auto; padding-bottom: 12px; }
      .column { min-width: 300px; }
    }
  `}</style>
);

/* ---------- Main component (name preserved) ---------- */
const PatientCases = () => {
  // preserved states and handler names
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [patientCase, setPatientCase] = useState([]);
  const [error, setError] = useState(null);

  // extra UI states
  const { user } = useContext(UserContext);
  const [maskPHI, setMaskPHI] = useState(true);
  const [filters, setFilters] = useState({
    department: "All",
    priority: "All",
    assignedTo: "All",
  });
  const [activeStatus, setActiveStatus] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoverCard, setHoverCard] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [dragging, setDragging] = useState(null);
  const [lastFetchAt, setLastFetchAt] = useState(null);
  const navigate = useNavigate();

  // MARK: handler name must be preserved
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `${API_URL}/cases/get_user_posts/${user?._id}`
      );
      setPatientCase(response.data?.posts || []);
    } catch (err) {
      console.error("Error fetching data", err);
      setError("");
      // keep fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch(search.trim().toLowerCase()),
      280
    );
    return () => clearTimeout(t);
  }, [search]);

  /* dataset normalization (same idea as original) */
  const dataset = useMemo(() => {
    const source =
      patientCase && patientCase.length > 0 ? patientCase : staticData;
    return source.map((item) => ({
      ...item,
      patient: {
        name: item.patientname || "Unknown",
        age: item.patientage || "",
        sex: item.patientgender || "",
        id: item._id || "",
      },
      description: item.todayconcern || item.keynotes || "",
      priority: "Medium", // or map from your data if you have a field
      assignedTo: { name: "Unassigned", initials: "U" },
      attachments: 0,
      lastUpdated: item.updatedAt || item.createdAt,
      status: item.acuteOrChronic === "chronic" ? "Active" : "New",
    }));
  }, [patientCase]);

  function inferStatusFromCategory(category) {
    if (!category) return null;
    const cat = category.toLowerCase();
    if (cat.includes("cardio") || cat.includes("emergency")) return "New";
    if (cat.includes("follow")) return "Follow-up";
    if (cat.includes("general") || cat.includes("neuro")) return "Active";
    return "Active";
  }

  const filtered = useMemo(() => {
    return dataset.filter((item) => {
      const q = debouncedSearch;
      if (q) {
        const hay =
          `${item.title || ""} ${item.description || ""} ${item.patient?.name || ""} ${item.category || ""} ${item.lastPrescription || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (
        filters.department !== "All" &&
        (item.category || "Unknown") !== filters.department
      )
        return false;
      if (
        filters.priority !== "All" &&
        (item.priority || "Medium") !== filters.priority
      )
        return false;
      if (
        filters.assignedTo !== "All" &&
        filters.assignedTo !== item.assignedTo?.name
      )
        return false;
      if (activeStatus && item.status !== activeStatus) return false;
      return true;
    });
  }, [dataset, debouncedSearch, filters, activeStatus]);

  const grouped = useMemo(() => {
    const map = {};
    defaultStatuses.forEach((s) => (map[s] = []));
    filtered.forEach((it) => {
      const st =
        it.status && defaultStatuses.includes(it.status) ? it.status : "Active";
      map[st].push(it);
    });
    return map;
  }, [filtered]);

  const departments = useMemo(
    () => [
      "All",
      ...Array.from(new Set(dataset.map((d) => d.category || "Unknown"))),
    ],
    [dataset]
  );
  const priorities = useMemo(
    () => [
      "All",
      ...Array.from(new Set(dataset.map((d) => d.priority || "Medium"))),
    ],
    [dataset]
  );
  const assignedList = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(dataset.map((d) => d.assignedTo?.name || "Unassigned"))
      ),
    ],
    [dataset]
  );

  const openQuickView = (item) => {
    setSelectedCase(item);
    setDrawerOpen(true);
  };

  const updateCaseStatusLocally = (caseId, newStatus) => {
    setPatientCase((prev) =>
      prev.map((p) => {
        if (p.id === caseId) {
          return {
            ...p,
            status: newStatus,
            lastUpdated: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  const markUrgent = (caseId) => {
    setPatientCase((prev) =>
      prev.map((p) =>
        p.id === caseId
          ? { ...p, priority: "High", lastUpdated: new Date().toISOString() }
          : p
      )
    );
  };

  const boardRef = useRef(null);

  const onDragStart = (e, itemId) => {
    e.dataTransfer.setData("text/plain", String(itemId));
    setDragging(itemId);
  };
  const onDragOver = (e) => {
    e.preventDefault();
  };
  const onDropToStatus = (e, status) => {
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    updateCaseStatusLocally(Number(id), status);
    setDragging(null);
  };

  const maskString = (s) => {
    if (!s) return "";
    const parts = s.split(" ");
    return parts
      .map((p) => p[0] + "*".repeat(Math.max(1, Math.min(3, p.length - 1))))
      .join(" ");
  };

  /* ---------- Small presentational components inside file ---------- */

  const IconSearch = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35"
      />
      <circle
        cx="11"
        cy="11"
        r="5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const IconAttachment = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12v6a3 3 0 0 1-3 3H6a5 5 0 0 1-5-5V6A3 3 0 0 1 4 3h6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const CaseCard = ({ item }) => {
    const isHover = hoverCard === item.id;
    const displayName = maskPHI
      ? maskString(item.patient?.name || item.title || "Unknown")
      : item.patient?.name || item.title;

    return (
      <div
        role="article"
        aria-label={`Case ${item.id} ${item.patient?.name || item.title}`}
        tabIndex={0}
        onMouseEnter={() => setHoverCard(item.id)}
        onMouseLeave={() => setHoverCard(null)}
        onFocus={() => setHoverCard(item.id)}
        onBlur={() => setHoverCard(null)}
        draggable
        onDragStart={(e) => onDragStart(e, item.id)}
        className="dribbble-card"
        style={{
          background: "var(--card-bg)",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          border: "1px solid rgba(15,107,102,0.06)",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          cursor: "pointer",
        }}
        // 👇 Redirect to new page instead of opening modal
        onClick={() => navigate(`/case-details/${item._id}`)}
      >
        {/* avatar */}
        <div
          aria-hidden
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontWeight: 700,
            color: "#063836",
            background: "linear-gradient(135deg,#dffaf7,#ecfffb)",
            boxShadow: "inset 0 -2px 8px rgba(10,20,20,0.02)",
          }}
          title={item.assignedTo?.name || "Unassigned"}
        >
          {item.assignedTo?.initials ||
            (item.assignedTo?.name || "U")
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.05 }}>
              {displayName}
            </div>
            <div className="tiny">
              {item.patient?.age ? ` • ${item.patient.age}y` : ""}
            </div>
          </div>

          <div
            style={{
              color: "#24303b",
              marginTop: 8,
              fontSize: 13,
              whiteSpace: "normal",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.description}
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Render ---------- */
  return (
    <div
      style={{
        minHeight: "70vh",
        padding: 20,
        background: "var(--bg)",
        fontFamily:
          "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
      }}
      ref={boardRef}
    >
      <GlobalStyles />

      {/* Header / toolbar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#0f4660",
            }}
          >
            All Cases
          </h3>
          <div className="muted" style={{ marginTop: 6 }}>
            {lastFetchAt ? `Updated ${formatTimeAgo(lastFetchAt)} ago` : ""}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* search + filters */}
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            minWidth: 420,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "white",
              padding: "6px 8px",
              borderRadius: 10,
              boxShadow: "0 6px 20px rgba(12,16,22,0.04)",
              border: "1px solid rgba(12,16,22,0.04)",
            }}
          >
            <div style={{ color: "var(--muted)", paddingLeft: 6 }}>
              <IconSearch />
            </div>
            <input
              className="focus-ring"
              aria-label="Search patient cases"
              placeholder="Search patient, symptom, medication..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                minWidth: 220,
                fontSize: 14,
                background: "transparent",
              }}
            />
            {search ? (
              <button
                onClick={() => setSearch("")}
                title="Clear"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--muted)",
                  fontWeight: 700,
                }}
              >
                ⨯
              </button>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* quick filter chips */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {defaultStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveStatus((x) => (x === s ? null : s))}
                  className="pill focus-ring"
                  style={{
                    background:
                      activeStatus === s
                        ? "linear-gradient(90deg,#e6fffb,#ecfeff)"
                        : "transparent",
                    border:
                      activeStatus === s
                        ? "1px solid rgba(15,107,102,0.12)"
                        : "1px solid rgba(12,16,22,0.04)",
                    cursor: "pointer",
                  }}
                  aria-pressed={activeStatus === s}
                  title={`Toggle ${s}`}
                >
                  <strong style={{ fontWeight: 700 }}>{s}</strong>
                  <span className="muted" style={{ marginLeft: 6 }}>
                    {grouped[s]?.length || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setMaskPHI((m) => !m)}
          >
            {maskPHI ? "Show PHI" : "Hide PHI"}
          </Button>
          <Button variant="primary" size="sm" onClick={() => fetchData()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* counts + status bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(15,107,102,0.06), rgba(15,107,102,0.03))",
            padding: 10,
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Showing</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{filtered.length}</div>
          <div className="muted">
            {patientCase.length > 0 ? "live" : "demo"}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div className="muted">
          {" "}
          {lastFetchAt ? new Date(lastFetchAt).toLocaleString() : ""}
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ display: "flex", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                minWidth: 300,
                background: "var(--glass)",
                padding: 12,
                borderRadius: 12,
              }}
            >
              <div
                className="skeleton"
                style={{
                  height: 18,
                  width: "60%",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              />
              {[1, 2, 3].map((x) => (
                <div
                  key={x}
                  className="skeleton"
                  style={{ height: 76, borderRadius: 12, marginBottom: 10 }}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: "#ef4444", marginBottom: 8 }}>{error}</div>
          <Button onClick={() => fetchData()}>Retry</Button>
        </div>
      )}

      {/* Board */}
      {!loading && (
        <div
          className="board"
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
            overflowX: "auto",
            paddingBottom: 24,
          }}
        >
          {defaultStatuses.map((status) => (
            <div
              key={status}
              className="column"
              style={{
                minWidth: 320,
                maxWidth: 360,
                background: "rgba(255,255,255,0.6)",
                borderRadius: 14,
                padding: 12,
                boxShadow: "0 6px 18px rgba(12,16,22,0.04)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(12,16,22,0.03)",
              }}
              onDragOver={onDragOver}
              onDrop={(e) => onDropToStatus(e, status)}
              aria-label={`${status} column`}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ fontWeight: 700 }}>{status}</div>
                  <div className="muted">{grouped[status]?.length || 0}</div>
                </div>
                <div>
                  <button
                    title={`Open ${status}`}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      color: "var(--muted)",
                    }}
                    onClick={() => {
                      const first = grouped[status]?.[0];
                      if (first) openQuickView(first);
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>

              {/* cards */}
              {grouped[status] && grouped[status].length > 0 ? (
                grouped[status].map((item) => (
                  <CaseCard key={item.id} item={item} />
                ))
              ) : (
                <div
                  style={{ padding: 12, color: "var(--muted)", fontSize: 13 }}
                >
                  No cases
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick View as Modal (cleaner, accessible) */}
      <Modal
        show={drawerOpen}
        onHide={() => setDrawerOpen(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedCase
              ? maskPHI
                ? maskString(selectedCase.patient?.name || selectedCase.title)
                : selectedCase.patient?.name || selectedCase.title
              : "Case"}
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {selectedCase?.patient?.age
                ? `${selectedCase.patient.age}y • ${selectedCase.category || "General"}`
                : selectedCase?.category}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCase ? (
            <div>
              <div style={{ fontSize: 14, color: "#24303b", marginBottom: 12 }}>
                {selectedCase.description}
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div className="muted">
                  Attachments: {selectedCase.attachments}
                </div>
                <div className="muted">
                  Last: {formatTimeAgo(selectedCase.lastUpdated)} ago
                </div>
                <div className="muted">
                  Assigned: {selectedCase.assignedTo?.name}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <Button
                  variant="primary"
                  onClick={() => alert("Prescribe (stub)")}
                >
                  Prescribe
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() =>
                    updateCaseStatusLocally(selectedCase.id, "Follow-up")
                  }
                >
                  Schedule Follow-up
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() =>
                    updateCaseStatusLocally(selectedCase.id, "Closed")
                  }
                >
                  Close
                </Button>
                <Button
                  variant="light"
                  onClick={() => alert("Export PDF (stub)")}
                >
                  Export
                </Button>
              </div>

              <hr />

              <div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>
                  Recent activity
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div style={{ display: "flex", gap: 10 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 99,
                        background: "#0f6b66",
                        marginTop: 6,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        Case created
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {new Date(selectedCase.lastUpdated).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 99,
                        background: "#f59e0b",
                        marginTop: 6,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        Last prescription
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {selectedCase.lastPrescription ||
                          "No prescriptions recorded"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <hr />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <div className="muted">Case ID: {selectedCase.id}</div>
                <div className="muted">
                  Status: <strong>{selectedCase.status}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PatientCases;
