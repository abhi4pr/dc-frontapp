import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import {
  Row,
  Button,
  Form,
  Col,
  Spinner,
  Badge,
  ProgressBar,
  Modal,
  Nav,
  Tab,
  FormCheck,
  InputGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaBook, FaHistory } from "react-icons/fa";
import {
  BsSearch,
  BsClockHistory,
  BsPrinter,
  BsInfoCircle,
  BsXLg,
  BsFillLightningFill,
} from "react-icons/bs";
import api from "../../utility/api";
import { API_URL } from "constants";
import { UserContext } from "../../contexts/UserContext"
import Reachedlimit from "components/Modal/Reachedlimit";


/* ----------------------------- IndexedDB helpers ----------------------------- */

const DB_NAME = "homeopathika_repertory_db_v3";
const STORE = "rep_cache_v3";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h
const CACHE_MAX = 800;


function openDB() {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: "key" });
        s.createIndex("ts_idx", "ts");
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}
async function dbGet(key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const store = tx.objectStore(STORE);
      const rq = store.get(key);
      rq.onsuccess = () => {
        const val = rq.result;
        if (!val) return resolve(null);
        const now = Date.now();
        if (val.ttl && now - val.ts > val.ttl) return resolve(null);
        resolve(val.value);
      };
      rq.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}
async function dbSet(key, value, ttl = CACHE_TTL) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put({ key, value, ts: Date.now(), ttl });
    tx.oncomplete = () => trimCache().catch(() => {});
  } catch (e) {}
}
async function trimCache() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const rq = store.getAll();
    rq.onsuccess = () => {
      const list = rq.result || [];
      if (list.length <= CACHE_MAX) return;
      list.sort((a, b) => a.ts - b.ts);
      const remove = list.slice(0, list.length - CACHE_MAX);
      remove.forEach((r) => store.delete(r.key));
    };
  } catch (e) {}
}
async function clearExpired() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const rq = store.openCursor();
    const now = Date.now();
    rq.onsuccess = (ev) => {
      const c = ev.target.result;
      if (!c) return;
      const v = c.value;
      if (v && v.ttl && now - v.ts > v.ttl) c.delete();
      c.continue();
    };
  } catch (e) {}
}

/* ----------------------------- small utilities ----------------------------- */
const esc = (s) =>
  s === null || s === undefined
    ? ""
    : String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function highlight(text = "", tokens = []) {
  if (!text) return esc(text);
  let out = esc(text);
  const uniq = Array.from(
    new Set(tokens.filter(Boolean).map((t) => t.trim().toLowerCase()))
  ).sort((a, b) => b.length - a.length);
  uniq.forEach((t) => {
    if (!t) return;
    try {
      const re = new RegExp(`(${escapeRegExp(t)})`, "gi");
      out = out.replace(re, "<mark>$1</mark>");
    } catch (e) {}
  });
  return out;
}

/* --------------------------- explainable scoring --------------------------- */
function computeScoreComponents(
  item = {},
  query = "",
  severity = 3,
  authorWeights = {}
) {
  const matched = Array.isArray(item.matched_rubrics)
    ? item.matched_rubrics
    : [];
  const sumGrades = matched.reduce((s, r) => s + (r.grade || r.weight || 1), 0);
  const countGrades = Math.max(1, matched.length);
  const rubricWeight = Math.round(
    Math.min(100, (sumGrades / (countGrades * 3)) * 100)
  );

  const sources = Array.isArray(item.sources_struct)
    ? item.sources_struct
    : Array.isArray(item.sources)
      ? item.sources
      : [];
  let baseTrust = Math.min(
    90,
    (Array.isArray(sources) ? sources.length : 0) * 12
  );
  if (Array.isArray(sources) && Object.keys(authorWeights || {}).length) {
    try {
      sources.forEach((s) => {
        const auth = (s.author || s.book || "").toLowerCase();
        Object.keys(authorWeights).forEach((a) => {
          if (!authorWeights[a]) return;
          if (auth.includes(a.toLowerCase()))
            baseTrust = Math.min(
              100,
              baseTrust + Math.round(authorWeights[a] * 0.2)
            );
        });
      });
    } catch (e) {}
  }
  const sourceTrust = Math.round(baseTrust);

  const tokens = (query || "")
    .split(/\s+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  let matches = 0;
  if (tokens.length) {
    const pool = [];
    if (Array.isArray(item.matched_rubrics))
      pool.push(
        ...item.matched_rubrics.map((r) =>
          typeof r === "string" ? r : r.rubric || r.text || ""
        )
      );
    if (item.summary)
      pool.push(
        Array.isArray(item.summary) ? item.summary.join(" ") : item.summary
      );
    if (Array.isArray(item.provings))
      pool.push(...item.provings.map((p) => p.text || p.excerpt || ""));
    const combined = pool.join(" ").toLowerCase();
    tokens.forEach((t) => {
      if (combined.includes(t)) matches++;
    });
  }
  const degreeMatch = Math.round(
    Math.min(100, tokens.length ? (matches / tokens.length) * 100 : 30)
  );
  const severityMatch = (() => {
    const hint = item.severity_hint || 3;
    return Math.round(100 - Math.min(100, Math.abs(hint - severity) * 25));
  })();

  const final = Math.round(
    0.34 * degreeMatch +
      0.28 * sourceTrust +
      0.22 * rubricWeight +
      0.16 * severityMatch
  );
  return {
    score: Math.min(99, Math.max(0, final)),
    components: {
      rubricWeight: Math.round(rubricWeight),
      sourceTrust: Math.round(sourceTrust),
      degreeMatch: Math.round(degreeMatch),
      severityMatch: Math.round(severityMatch),
    },
  };
}

/* ------------------------- matched snippet generator ------------------------ */
function matchedSnips(item, query) {
  const tokens = (query || "")
    .split(/\s+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const out = [];
  if (!item) return out;
  if (item.summary)
    out.push({
      source: "Summary",
      html: highlight(
        Array.isArray(item.summary) ? item.summary.join(" ") : item.summary,
        tokens
      ),
    });
  if (Array.isArray(item.matched_rubrics))
    item.matched_rubrics.slice(0, 6).forEach((r, i) => {
      const txt = typeof r === "string" ? r : r.rubric || r.text || "";
      out.push({ source: `Rubric ${i + 1}`, html: highlight(txt, tokens) });
    });
  if (Array.isArray(item.provings))
    item.provings.slice(0, 6).forEach((p, i) => {
      const txt = p.text || p.excerpt || "";
      out.push({
        source: p.source || `Prov ${i + 1}`,
        html: highlight(txt, tokens),
      });
    });
  return out;
}

/* ----------------------------- Venn/diff helpers ---------------------------- */
function keynoteSet(item) {
  const keys = Array.isArray(item.keynotes)
    ? item.keynotes
    : item.summary
      ? Array.isArray(item.summary)
        ? item.summary
        : String(item.summary)
            .split(".")
            .map((s) => s.trim())
            .filter(Boolean)
      : [];
  return new Set(
    keys.map((k) => String(k).trim().toLowerCase()).filter(Boolean)
  );
}
function computeVenn(list) {
  const sets = list.map((it) => keynoteSet(it));
  if (sets.length === 2) {
    const [a, b] = sets;
    const shared = [...a].filter((x) => b.has(x));
    return {
      shared,
      unique: [
        [...a].filter((x) => !b.has(x)),
        [...b].filter((x) => !a.has(x)),
      ],
    };
  } else if (sets.length === 3) {
    const [a, b, c] = sets;
    const shared = [...a].filter((x) => b.has(x) && c.has(x));
    return {
      shared,
      unique: [
        [...a].filter((x) => !b.has(x) && !c.has(x)),
        [...b].filter((x) => !a.has(x) && !c.has(x)),
        [...c].filter((x) => !a.has(x) && !b.has(x)),
      ],
    };
  }
  return { shared: [], unique: sets.map((s) => [...s]) };
}


/* --------------------------------- Component --------------------------------- */
const Repertory = () => {
  const { user } = useContext(UserContext);
  const [show, setShow] = useState(false);

  const navigate = useNavigate();

  // preserved names
  const [formData, setFormData] = useState({ disease: "" });
  const [data, setData] = useState(""); // array | object | string
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [severity, setSeverity] = useState(3);
  const [inlineError, setInlineError] = useState(null);
  const [cacheBadge, setCacheBadge] = useState(false);

  // advanced features
  const [searchMode, setSearchMode] = useState("semantic"); // exact | fuzzy | boolean | semantic
  const [availableRepertories] = useState([
    "Synthesis",
    "Complete",
    "Kent",
    "Boericke",
    "Modern",
  ]);
  const [repertoriesSelected, setRepertoriesSelected] = useState([
    "Synthesis",
    "Complete",
  ]);
  const [authorsList] = useState([
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
    "Rajan Sankaran",
    "Luc De Schepper",
    "Robin Murphy",
    "Massimo Mangialavori",
  ]);
  const [authorFilter, setAuthorFilter] = useState([]);
  const [authorWeights, setAuthorWeights] = useState(() => ({})); // percent weights

  // compare UI
  const [comparison, setComparison] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);

  // modals
  const [mmOpen, setMmOpen] = useState(false);
  const [mmContent, setMmContent] = useState(null);
  const [scoreOpen, setScoreOpen] = useState(false);

  // suggestions & keyboard
  const suggestionsRef = useRef(null);
  const debounceRef = useRef(null);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);

  // request ctrl
  const latestReq = useRef(0);
  const controllerRef = useRef(null);

  // virtualization
  const resultsRef = useRef(null);
  const [windowStart, setWindowStart] = useState(0);
  const WINDOW = 16;
  const ITEM_H = 128;

  // inject the glassmorphic theme + fancy slider CSS once
  useEffect(() => {
       if (user?.hit_count === 0) {
      setShow(true); 
    }
    const styleId = "rep-upgrade-v5-styles";
    if (document.getElementById(styleId)) return;
    const css = `
      /* glassmorphic theme — palettes from your references */
      .rep-root { padding:34px 26px 90px; display:flex; justify-content:center; }
      .rep-card { width:100%; max-width:1200px; border-radius:18px; padding:28px; position:relative;
        background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(250,250,255,0.92));
        box-shadow: 0 30px 60px rgba(18,28,60,0.08); backdrop-filter: blur(8px) saturate(120%);
        border: 1px solid rgba(255,255,255,0.6);
      }
      .rep-hero { display:flex; gap:12px; align-items:flex-start; margin-bottom:16px; }
      .rep-badge { width:56px; height:56px; border-radius:14px; display:grid; place-items:center; color:white; font-weight:900;
        background: linear-gradient(135deg,#7ea3ff,#ff7fc4); box-shadow: 0 10px 30px rgba(126,163,255,0.12);
      }
      .rep-title { font-size:20px; font-weight:800; color:#072034; margin:0; }
      .rep-sub { color:#51646a; margin-top:4px; font-size:13px; }
      .rep-top-actions { margin-left:auto; display:flex; gap:10px; align-items:center; }

      .search-row { display:flex; gap:12px; align-items:center; width:100%; }
      .search-box { position:relative; flex:1; }
      input.search-input { width:100%; height:54px; padding:12px 48px 12px 48px; border-radius:14px; border:1px solid rgba(10,60,80,0.06);
        background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,255,0.98)); box-shadow:0 8px 30px rgba(20,40,80,0.03) inset; font-size:15px; color:#062034;
      }
      .search-left-ic { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#375e84; font-size:18px; }
      .search-right { position:absolute; right:14px; top:50%; transform:translateY(-50%); display:flex; gap:8px; align-items:center; }
      .mode-select { height:36px; border-radius:10px; border:1px solid rgba(10,60,80,0.04); background:transparent; padding:4px 8px; }
      .search-btn { padding:10px 18px; border-radius:12px; border:none; color:white; background: linear-gradient(90deg,#7ea3ff,#ff90c1); font-weight:800; box-shadow: 0 12px 30px rgba(126,163,255,0.12); }

      .chips-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:12px; }
      .chip { padding:8px 14px; border-radius:999px; background: rgba(126,163,255,0.06); border:1px solid rgba(126,163,255,0.08); cursor:pointer; font-weight:700; color:#073642; }

      .author-weights { display:flex; gap:12px; margin-top:14px; overflow-x:auto; padding-bottom:6px; }
      .author-card { min-width:170px; background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,250,255,0.96)); border-radius:12px; padding:10px; border:1px solid rgba(10,60,80,0.03); box-shadow:0 8px 24px rgba(10,30,50,0.03); }
      .author-title { font-weight:700; font-size:13px; color:#08303a; margin-bottom:8px; }

      /* Fancy glass slider — colored track + animated thumb */
      .glass-slider { -webkit-appearance:none; appearance:none; height:14px; border-radius:999px; width:100%; background: linear-gradient(90deg,#dfeeff,#ffdff0); position:relative; box-shadow: inset 0 6px 16px rgba(60,90,140,0.04); }
      .glass-slider::-webkit-slider-runnable-track { height:14px; border-radius:999px; }
      .glass-slider::-moz-range-track { height:14px; border-radius:999px; }
      .glass-slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:34px; height:34px; margin-top:-10px; border-radius:50%; background: linear-gradient(135deg,#ffffff,#f6f8ff); box-shadow: 0 6px 20px rgba(126,163,255,0.18); border: 6px solid rgba(255,255,255,0.55); transition: transform .18s cubic-bezier(.2,.9,.2,1); }
      .glass-slider:hover::-webkit-slider-thumb { transform: scale(1.04); }
      .glass-slider::-moz-range-thumb { width:34px; height:34px; border-radius:50%; background: linear-gradient(135deg,#ffffff,#f6f8ff); box-shadow: 0 6px 20px rgba(126,163,255,0.18); border:6px solid rgba(255,255,255,0.55); }

      .glass-track-fill { position:absolute; left:0; top:0; bottom:0; border-radius:999px; z-index:0; pointer-events:none; background: linear-gradient(90deg,#7ea3ff 0%, #ff90c1 100%); opacity:0.18; }

      .results { margin-top:18px; max-height:560px; overflow:auto; padding-right:8px; }
      .remedy { display:flex; justify-content:space-between; gap:12px; padding:14px; border-radius:12px; background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(255,255,255,0.96)); border:1px solid rgba(10,60,80,0.03); box-shadow:0 8px 26px rgba(10,30,50,0.03); }
      .rem-left { display:flex; gap:12px; align-items:flex-start; flex:1; }
      .badge-round { width:84px; height:84px; border-radius:12px; display:grid; place-items:center; font-weight:900; background: linear-gradient(135deg,#7ea3ff33,#ff90c133); color:#072034; font-size:18px; }
      .rem-title { font-weight:800; font-size:16px; color:#042b33; }
      .rem-meta { color:#4b5b63; font-size:13px; margin-bottom:8px; }
      
      .mm-pill { padding:8px 16px; border-radius:999px; font-weight:700; cursor:pointer; border:1px solid rgba(10,60,80,0.06);
        background: linear-gradient(90deg, rgba(126,163,255,0.08), rgba(255,144,193,0.04));
      }
      mark { background: #fff59a; padding:0 3px; border-radius:3px; }

      .controls-col { display:flex; flex-direction:column; align-items:flex-end; gap:8px; min-width:140px; }

      @media (max-width:900px) {
        .search-row { flex-direction:column; align-items:stretch; }
        .remedy { flex-direction:column; align-items:stretch; }
        .author-weights { flex-direction:column; }
        .controls-col { align-items:flex-start; min-width:auto; }
      }
    `;
    const s = document.createElement("style");
    s.id = styleId;
    s.innerHTML = css;
    document.head.appendChild(s);
  }, []);

  // clear expired cache
  useEffect(() => {
    clearExpired().catch(() => {});
  }, []);

  /* ----------------------------- suggestion fetch ----------------------------- */
  const fetchSugs = async (q) => {
    try {
      const res = await api.get(`${API_URL}/`);
      if (res && res.data && Array.isArray(res.data.suggestions))
        return res.data.suggestions;
    } catch (e) {}
    const corp = [
      "anxiety",
      "headache",
      "fever",
      "cough",
      "restlessness",
      "insomnia",
      "burning pain",
      "stitching pain",
      "worse at night",
    ];
    return corp.filter((x) => x.includes(q.toLowerCase())).slice(0, 8);
  };

  useEffect(() => {
    if (!formData.disease || formData.disease.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const s = await fetchSugs(formData.disease.trim());
      setSuggestions(s);
      setShowSuggestions(s.length > 0);
      setActiveSuggestionIdx(-1);
    }, 220);
    return () => clearTimeout(debounceRef.current);
  }, [formData.disease]);

  useEffect(() => {
    const onDoc = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (!showSuggestions || suggestions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIdx((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && activeSuggestionIdx >= 0) {
        e.preventDefault();
        const s = suggestions[activeSuggestionIdx];
        handleChange({ target: { name: "disease", value: s } });
        setShowSuggestions(false);
        setActiveSuggestionIdx(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSuggestions, suggestions, activeSuggestionIdx]);

  /* ------------------------------ preserved handlers ------------------------------ */
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    setInlineError(null);
    if (name === "disease" && value && value.trim().length >= 2)
      setShowSuggestions(true);
    else setShowSuggestions(false);
  };

  /* ------------------------------- handleSubmit -------------------------------- */
  const handleSubmit = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    setInlineError(null);
    if (!formData.disease || formData.disease.trim() === "") {
      setErrors({ disease: "Please enter a symptom or rubric." });
      return;
    }

    const cacheKey = [
      formData.disease.trim().toLowerCase(),
      `mode:${searchMode}`,
      `reps:${repertoriesSelected.join(",")}`,
      `authors:${authorFilter.join(",")}`,
      `sev:${severity}`,
    ].join("|");

    try {
      const cached = await dbGet(cacheKey);
      if (cached) {
        setCacheBadge(true);
        setData(cached);
        refreshBackground(cacheKey).catch(() => {});
        setTimeout(
          () =>
            resultsRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            }),
          120
        );
        return;
      }
    } catch (e) {}

    try {
      controllerRef.current?.abort();
    } catch (e) {}
    controllerRef.current = new AbortController();
    const reqId = ++latestReq.current;

    try {
      setLoading(true);
      // PRESERVED PAYLOAD EXACTLY: disease property must exist in body
      const body = {
        query: formData.disease,
        mode: searchMode,
        repertories: repertoriesSelected,
        authors: authorFilter,
        severity,
        userId: user?._id,
      };

      const resp = await api.post(`${API_URL}/ai/send_repertory/`, body);

      const payload = resp?.data;

      setData(payload);
      setCacheBadge(false);
      await dbSet(cacheKey, payload);

      setTimeout(
        () =>
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        150
      );
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("Repertory search error:", err);
      setInlineError(
        err?.response?.data?.message ||
          "An unexpected error occurred while searching. Please retry."
      );
      if (err.response && err.response.data)
        toast.error(err.response.data.message || "An error occurred.");
      else toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const refreshBackground = async (cacheKey) => {
    try {
      const resp = await api.post(
        `${API_URL}/ai/send_search_remedy/${user?._id}`,
        {
          disease: formData.disease,
          mode: searchMode,
          repertories: repertoriesSelected,
          authors: authorFilter,
          severity,
          page: 1,
          limit: 200,
        }
      );
      const payload = resp?.data?.data;
      if (Array.isArray(payload)) {
        payload.forEach((p) => {
          if (p && typeof p === "object") {
            p._score = computeScoreComponents(
              p,
              formData.disease,
              severity,
              authorWeights
            );
            p._snips = matchedSnips(p, formData.disease);
          }
        });
      } else if (payload && typeof payload === "object") {
        payload._score = computeScoreComponents(
          payload,
          formData.disease,
          severity,
          authorWeights
        );
        payload._snips = matchedSnips(payload, formData.disease);
      }
      setData(payload);
      await dbSet(cacheKey, payload);
    } catch (e) {}
  };

  /* ----------------------- author & repertory helpers ----------------------- */
  const toggleRep = (r) =>
    setRepertoriesSelected((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  const toggleAuthor = (a) =>
    setAuthorFilter((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  const setAuthorWeight = (a, v) =>
    setAuthorWeights((prev) => ({ ...prev, [a]: Number(v) }));

  /* ----------------------------- comparison helpers ---------------------------- */
  const addCompare = (item) => {
    const name = typeof item === "string" ? item : item.remedy || item.name;
    if (!name) return;
    if (comparison.includes(name)) {
      toast.info("Already added");
      return;
    }
    if (comparison.length >= 3) {
      toast.info("Max 3");
      return;
    }
    setComparison((prev) => [...prev, name]);
  };
  const removeCompare = (name) =>
    setComparison((prev) => prev.filter((x) => x !== name));
  const openCompare = () => {
    if (comparison.length < 2) {
      toast.info("Select 2+ remedies");
      return;
    }
    setCompareOpen(true);
  };

  /* --------------------------- provenance viewer stub -------------------------- */
  const openScan = async (src) => {
    if (!src) {
      toast.info("No scan info");
      return;
    }
    if (src.scan_url_signed)
      window.open(src.scan_url_signed, "_blank", "noopener");
    else if (src.scan_id) {
      try {
        const resp = await api.get(
          `${API_URL}/content/scan_signed/${src.scan_id}?user=${user?._id}`
        );
        if (resp?.data?.signed_url)
          window.open(resp.data.signed_url, "_blank", "noopener");
        else toast.info("Scan not available");
      } catch (e) {
        toast.info("Unable to fetch scan");
      }
    } else toast.info("No scan available");
  };

  /* ------------------------- virtualization render helpers ------------------------- */
  const flatList = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? [data]
      : [];
  const filteredList = flatList.filter((item) => {
    if (!authorFilter || authorFilter.length === 0) return true;
    const srcs = Array.isArray(item?.sources_struct)
      ? item.sources_struct
      : Array.isArray(item?.sources)
        ? item.sources
        : [];
    if (!srcs || srcs.length === 0) return false;
    const combined = srcs
      .map((s) =>
        typeof s === "string" ? s : s.author || s.book || s.source || ""
      )
      .join(" ")
      .toLowerCase();
    return authorFilter.some((a) => combined.includes(a.toLowerCase()));
  });
  const total = filteredList.length;
  const windowEnd = Math.min(windowStart + WINDOW, total);

  useEffect(() => {
    setWindowStart(0);
  }, [data, authorFilter, repertoriesSelected, searchMode]);

  const onScroll = useCallback((e) => {
    const el = e.target;
    const idx = Math.floor(el.scrollTop / ITEM_H);
    setWindowStart(Math.max(0, idx));
  }, []);

  /* ----------------------------- render single item ---------------------------- */
  const renderProvenance = (item) => {
    const sources = Array.isArray(item.sources_struct)
      ? item.sources_struct
      : Array.isArray(item.sources)
        ? item.sources
        : [];
    if (!sources || sources.length === 0)
      return <div style={{ color: "#6c757d" }}>Provenance not available</div>;
    return sources.map((s, i) => {
      if (typeof s === "string")
        return (
          <div key={i} style={{ color: "#3b4a4f" }}>
            {s}
          </div>
        );
      return (
        <div key={i} style={{ color: "#3b4a4f", marginBottom: 8 }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", gap: 8 }}
          >
            <div>
              <strong>{s.author || s.book || s.title || "Source"}</strong>
              {s.edition ? ` • ${s.edition}` : ""}
              {s.page ? ` • p.${s.page}` : ""}
              {s.rubric_id ? ` • id:${s.rubric_id}` : ""}
              {s.verified ? (
                <Badge bg="info" style={{ marginLeft: 8 }}>
                  Verified
                </Badge>
              ) : null}
            </div>
            <div>
              {s.scan_url_signed || s.scan_id ? (
                <Button size="sm" variant="link" onClick={() => openScan(s)}>
                  View scan
                </Button>
              ) : null}
            </div>
          </div>
          {s.excerpt ? (
            <div style={{ color: "#4b5b63", marginTop: 6 }}>{s.excerpt}</div>
          ) : null}
        </div>
      );
    });
  };

  const renderItem = (item, idx) => {
    const n =
      typeof item === "string" ? item : item.remedy || item.name || "Unknown";
    const scoreObj =
      item?._score ||
      computeScoreComponents(item, formData.disease, severity, authorWeights);
    const score = scoreObj.score;
    const matched = Array.isArray(item.matched_rubrics)
      ? item.matched_rubrics
      : [];
    const family = item.family || item.kingdom || item.source || "General";
    const inCompare = comparison.includes(n);

    return (
      <div
        key={`${n}-${idx}`}
        className="remedy"
        role="article"
        aria-labelledby={`rem-${idx}`}
      >
        <div className="rem-left">
          <div className="badge-round" aria-hidden>
            {(n || "").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div id={`rem-${idx}`} className="rem-title">
              {n}
            </div>
            <div className="rem-meta">
              <strong>Family:</strong> {family} •{" "}
              <span style={{ color: "#6c757d" }}>{item.source || ""}</span>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div style={{ fontWeight: 800 }}>{score}%</div>
              <div style={{ color: "#6c757d", fontSize: 13 }}>confidence</div>
              <Button
                size="sm"
                variant="link"
                onClick={() => setScoreOpen(true)}
                title="Explain score"
              >
                <BsInfoCircle />
              </Button>
            </div>

            <ProgressBar now={score} style={{ height: 8, borderRadius: 8 }} />

            <div
              style={{
                marginTop: 10,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {matched && matched.length ? (
                matched.slice(0, 5).map((m, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: "rgba(126,163,255,0.06)",
                    }}
                  >
                    {typeof m === "string" ? m : m.rubric || m.text}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    background: "rgba(240,240,240,0.6)",
                  }}
                >
                  No keynotes
                </div>
              )}
            </div>

            {/* expanded details */}
            {item._expanded && (
              <div
                style={{
                  marginTop: 12,
                  background: "rgba(126,163,255,0.03)",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                <div style={{ fontWeight: 700 }}>Matched Rubrics</div>
                <ul style={{ marginTop: 8 }}>
                  {matched.length ? (
                    matched.map((r, i) => {
                      const prov =
                        Array.isArray(item.matched_sources) &&
                        item.matched_sources[i]
                          ? item.matched_sources[i]
                          : null;
                      return (
                        <li key={i}>
                          {typeof r === "string" ? r : r.rubric || r.text}{" "}
                          {prov ? (
                            <span style={{ color: "#6c757d", fontSize: 12 }}>
                              {" "}
                              — {prov.author || prov.source}
                              {prov.page ? ` p.${prov.page}` : ""}
                            </span>
                          ) : null}
                        </li>
                      );
                    })
                  ) : (
                    <li>No matched rubrics</li>
                  )}
                </ul>

                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 700 }}>Provenance</div>
                  {renderProvenance(item)}
                </div>

                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 700 }}>Matched snippets</div>
                  <div
                    style={{ maxHeight: 160, overflow: "auto", marginTop: 6 }}
                  >
                    {(item._snips || matchedSnips(item, formData.disease)).map(
                      (s, si) => (
                        <div key={si} style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>
                            {s.source}
                          </div>
                          <div
                            style={{ fontSize: 13 }}
                            dangerouslySetInnerHTML={{
                              __html: s.html || esc("—"),
                            }}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="controls-col">
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              size="sm"
              variant={item._expanded ? "outline-secondary" : "outline-primary"}
              onClick={() => {
                const clone = Array.isArray(data)
                  ? [...data]
                  : data
                    ? [data]
                    : [];
                const found = clone.find((d) => (d.remedy || d.name) === n);
                if (found) found._expanded = !found._expanded;
                setData(Array.isArray(data) ? clone : clone[0] || "");
              }}
            >
              {item._expanded ? "Collapse" : "Details"}
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                handleChange({ target: { name: "disease", value: n } });
                toast.info(`${n} copied into symptom field.`);
              }}
            >
              Quick add
            </Button>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <Button
              size="sm"
              variant={inCompare ? "success" : "outline-success"}
              onClick={() => {
                inCompare ? removeCompare(n) : addCompare(item);
              }}
            >
              {inCompare ? "Added" : "Compare"}
            </Button>
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() => {
                setMmContent(
                  item.materia_medica ||
                    item.mm_excerpt ||
                    `Materia medica for ${n} not available.`
                );
                setMmOpen(true);
              }}
            >
              <BsInfoCircle />
            </Button>
            <Button
              size="sm"
              variant="outline-primary"
              onClick={() => {
                const w = window.open("", "_blank");
                w.document.write(
                  `<pre>${esc(JSON.stringify(item, null, 2))}</pre>`
                );
                w.document.close();
                w.print();
              }}
            >
              <BsPrinter />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /* ----------------------------- render results area ----------------------------- */
  const renderResults = () => {
    if (!data) return null;
    if (data.raw_text)
      return (
        <div style={{ padding: 12 }}>
          <pre>{data?.raw_text}</pre>
        </div>
      );
    if (!Array.isArray(data) || filteredList.length === 0)
      return (
        <div style={{ padding: 12, color: "#6c757d" }}>
          No results match your filters.
        </div>
      );

    const slice = filteredList.slice(windowStart, windowEnd);
    return (
      <>
        <div
          style={{
            marginBottom: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {filteredList.length} remedies found
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {comparison.length > 1 && (
              <Button size="sm" variant="outline-primary" onClick={openCompare}>
                Open Compare
              </Button>
            )}
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => {
                setData("");
                setComparison([]);
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        <div>
          <div style={{ height: windowStart * ITEM_H }} aria-hidden />
          {slice.map((it, i) => (
            <div
              key={`wrap-${i}`}
              style={{
                height: ITEM_H,
                marginBottom: 8,
                boxSizing: "border-box",
              }}
            >
              {renderItem(it, windowStart + i)}
            </div>
          ))}
          <div
            style={{
              height: Math.max(0, (filteredList.length - windowEnd) * ITEM_H),
            }}
            aria-hidden
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 12,
          }}
        >
          <Button
            size="sm"
            variant="light"
            onClick={() => setWindowStart(Math.max(0, windowStart - WINDOW))}
            disabled={windowStart === 0}
          >
            Prev
          </Button>
          <div style={{ alignSelf: "center", color: "#6c757d" }}>
            Showing {windowStart + 1}-{windowEnd} of {filteredList.length}
          </div>
          <Button
            size="sm"
            variant="light"
            onClick={() =>
              setWindowStart(
                Math.min(
                  Math.max(0, filteredList.length - WINDOW),
                  windowStart + WINDOW
                )
              )
            }
            disabled={windowEnd >= filteredList.length}
          >
            Next
          </Button>
        </div>
      </>
    );
  };

  /* ------------------------------- UI render ------------------------------- */
  return (
    <Row className="justify-content-center rep-root">
      <div className="rep-card" style={{ position: "relative" }}>
        <div className="row mb-3">
          <div className="col-md-8">
            <div className="d-flex align-items-center">
              <div>
                 <div className="rep-badge">HM</div>
              </div>
              <div className="ms-3">
                <h4 className="rep-title">Repertory (AI)</h4>
                  <div className="rep-sub">
                    Advanced repertory search, provenance and explainability for
                    clinicians
                  </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
             <div className="d-flex align-items-center justify-content-md-end justify-content-start mt-md-0 mt-2">
               <div className="me-2">
                  <div style={{ fontSize: 13, color: "#495057" }}>
                    Hits left: <strong>{user?.hit_count ?? "-"}</strong>
                  </div>
               </div>

               <div>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => navigate("/plans")}
                  style={{ borderRadius: 12 }}
                >
                  Recharge
                </Button>
               </div>
             </div>
          </div>
        </div>

        {inlineError && (
          <div
            style={{
              background: "rgba(255,230,230,0.95)",
              color: "#842029",
              padding: 12,
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            {inlineError}{" "}
          </div>
        )}

        <Form onSubmit={handleSubmit} aria-label="Repertory search form">
          <Form.Group as={Row} className="mb-3" controlId="formTitle">
            <Form.Label className="text-md-end text-start" column sm={2}>
              Symptom:
            </Form.Label>
            <Col sm={10}>
              <div className="search-row">
                <div className="search-box" ref={suggestionsRef}>
                  <BsSearch className="search-left-ic" />
                  <input
                    name="disease"
                    className="search-input search-input-padding"
                    placeholder={window.innerWidth <= 768
                    ? "e.g., anxiety..."
                    : "e.g., anxiety - anticipatory, restlessness at night..."
                    }
                    value={formData.disease}
                    onChange={handleChange}
                    onFocus={() =>
                      formData.disease &&
                      formData.disease.length >= 2 &&
                      setShowSuggestions(true)
                    }
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-controls="rep-sugs"
                    aria-expanded={showSuggestions}
                  />
                  <div className="search-right">
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: "#6c757d",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <BsClockHistory /> <small>{severity}</small>
                      </div>
                      <select
                        className="mode-select"
                        value={searchMode}
                        onChange={(e) => setSearchMode(e.target.value)}
                        aria-label="Search mode"
                      >
                        <option value="exact">Exact</option>
                        <option value="fuzzy">Fuzzy</option>
                        <option value="boolean">Boolean</option>
                        <option value="semantic">Semantic</option>
                      </select>
                    </div>
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      id="rep-sugs"
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "calc(100% + 10px)",
                        background: "white",
                        borderRadius: 12,
                        boxShadow: "0 18px 38px rgba(10,20,40,0.08)",
                        zIndex: 60,
                        maxHeight: 260,
                        overflow: "auto",
                        border: "1px solid rgba(10,60,80,0.04)",
                      }}
                    >
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          id={`sugg-${i}`}
                          role="option"
                          tabIndex={0}
                          style={{
                            padding: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "center",
                            cursor: "pointer",
                            background:
                              i === activeSuggestionIdx
                                ? "linear-gradient(90deg, rgba(126,163,255,0.04), rgba(255,144,193,0.03))"
                                : "transparent",
                          }}
                          onMouseDown={() => {
                            handleChange({
                              target: { name: "disease", value: s },
                            });
                            setShowSuggestions(false);
                            setActiveSuggestionIdx(-1);
                          }}
                          onMouseEnter={() => setActiveSuggestionIdx(i)}
                        >
                          <div style={{ fontWeight: 700 }}>{s}</div>
                          <div style={{ color: "#6c757d", fontSize: 13 }}>
                            Suggested
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    type="submit"
                    className="search-btn"
                    disabled={loading || user?.hit_count === 0}
                  >
                    {loading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" />{" "}
                        <span style={{ marginLeft: 8 }}>Searching...</span>
                      </>
                    ) : (
                      <>
                        <BsSearch /> Search
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => {
                      setFormData({ disease: "" });
                      setData("");
                      setSuggestions([]);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* <div className="chips-row" style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, color: "#375e84" }}>
                  <BsFillLightningFill /> Repertories:
                </div>
                {availableRepertories.map((r) => (
                  <div
                    key={r}
                    className="chip"
                    onClick={() => toggleRep(r)}
                    style={{
                      border: repertoriesSelected.includes(r)
                        ? "2px solid rgba(126,163,255,0.5)"
                        : undefined,
                    }}
                  >
                    {r}
                  </div>
                ))}
              </div>       */}

              {/* <div className="chips-row" style={{ marginTop: 8 }}> */}
                {/* <div style={{ fontWeight: 700, color: "#375e84" }}>
                  Authors:
                </div> */}
                {/* {authorsList.map((r) => (
                  <div
                    key={r}
                    className="chip"
                    onClick={() => toggleAuthor(r)}
                    style={{
                      border: authorFilter.includes(r)
                        ? "2px solid rgba(126,163,255,0.5)"
                        : undefined,
                    }}
                  >
                    {r}
                  </div>
                ))} */}

                {/* <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => setAuthorWeights({})}
                >
                  Reset weights
                </Button>
              </div> */}

              {/* <div className="author-weights"></div> */}

              {/* <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div style={{ minWidth: 120, fontWeight: 700 }}>Severity</div>
                <div style={{ flex: 1, position: "relative" }}>
                  <div
                    className="glass-track-fill"
                    style={{
                      width: `${((severity - 1) / 4) * 100}%`,
                      opacity: 0.2,
                    }}
                  />
                  <input
                    className="glass-slider"
                    type="range"
                    min="1"
                    max="5"
                    value={severity}
                    onChange={(e) => setSeverity(Number(e.target.value))}
                    aria-label="Severity"
                  />
                </div>
                <div
                  style={{ minWidth: 42, textAlign: "center", fontWeight: 800 }}
                >
                  {severity}
                </div>
              </div> */}
            </Col>
          </Form.Group>
          <Row className="mb-3">
                <Col sm={{ span: 10, offset: 2 }}>
                    <Tab.Container id="left-tabs-example" defaultActiveKey="first">
                      <Row>
                        <Col sm={3}>
                          <Nav variant="pills" className="flex-column fliter-tab">
                            <Nav.Item>
                              <Nav.Link eventKey="first"><FaBook /> Repertories:</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                              <Nav.Link eventKey="second"><FaHistory /> Authors:</Nav.Link>
                            </Nav.Item>
                          </Nav>
                        </Col>
                        <Col sm={9}>
                          <Tab.Content>
                            <Tab.Pane className="d-flex align-items-center flex-wrap" eventKey="first" style={{ gap: 8}}>
                              {/* {availableRepertories.map((a) => (
                                    <div
                                        key={a}
                                        className="mm-pill"
                                        onClick={() => {
                                          availableRepertories((prev) =>
                                            prev.includes(a)
                                              ? prev.filter((x) => x !== a)
                                              : [...prev, a]
                                          );
                                        }}
                                        style={{
                                          border: repertoriesSelected.includes(a)
                                            ? "2px solid rgba(126,163,255,0.6)"
                                            : undefined,
                                        }}>
                                        {a}
                                    </div>
                                ))} */}
                                {availableRepertories.map((r) => (
                                  <div
                                    key={r}
                                    className="chip"
                                    onClick={() => toggleRep(r)}
                                    style={{
                                      border: repertoriesSelected.includes(r)
                                        ? "2px solid rgba(126,163,255,0.5)"
                                        : undefined,
                                    }}
                                  >
                                    {r}
                                  </div>
                                ))}
                            </Tab.Pane>
                            <Tab.Pane className="d-flex align-items-center flex-wrap" eventKey="second" style={{ gap: 8}}>
                              
                              {authorsList.map((r) => (
                                <div
                                  key={r}
                                  className="chip"
                                  onClick={() => toggleAuthor(r)}
                                  style={{
                                    border: authorFilter.includes(r)
                                      ? "2px solid rgba(255,144,193,0.5)"
                                      : undefined,
                                  }}
                                >
                                  {r}
                                </div>
                              ))}

                              
                            </Tab.Pane>
                          </Tab.Content>
                        </Col>
                      </Row>
                    </Tab.Container>
                     <div
                        style={{
                          marginTop: 12,
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                          }}
                        >
                        <div style={{ minWidth: 120, fontWeight: 700 }}>Severity</div>
                        <div style={{ flex: 1, position: "relative" }}>
                          <div
                            className="glass-track-fill"
                            style={{
                              width: `${((severity - 1) / 4) * 100}%`,
                              opacity: 0.2,
                            }}
                          />
                          <input
                            className="glass-slider"
                            type="range"
                            min="1"
                            max="5"
                            value={severity}
                            onChange={(e) => setSeverity(Number(e.target.value))}
                            aria-label="Severity"
                          />
                        </div>
                        <div
                          style={{ minWidth: 42, textAlign: "center", fontWeight: 800 }}
                        >
                          {severity}
                        </div>
                      </div>

                   
                </Col>
                 
          </Row>
           
        </Form>

        {/* {user?.hit_count === 0 && (
          <div style={{ color: "#c92a2a", marginBottom: 8 }}>
            You have reached your limit please recharge your limit.
          </div>
        )} */}

        <div className="results" ref={resultsRef} onScroll={onScroll}>
          {cacheBadge && (
            <div style={{ marginBottom: 8 }}>
              <Badge bg="info">From Cache</Badge>
            </div>
          )}
          {loading && (
            <div style={{ padding: 12 }}>
              <div
                style={{
                  height: 12,
                  width: "50%",
                  background: "rgba(0,0,0,0.06)",
                  borderRadius: 6,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: "80%",
                  background: "rgba(0,0,0,0.04)",
                  borderRadius: 6,
                }}
              />
            </div>
          )}
          {data ? (
            renderResults()
          ) : (
            <div style={{ padding: 12, color: "#6c757d" }}>No results</div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 16,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontWeight: 800 }}></div>

            {comparison.map((c, i) => (
              <Badge
                key={i}
                bg="light"
                text="dark"
                style={{ border: "1px solid rgba(0,0,0,0.06)" }}
              >
                {c}
              </Badge>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}></div>
        </div>
      </div>

      {/* materia-medica modal */}
      <Modal show={mmOpen} onHide={() => setMmOpen(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Materia Medica</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {mmContent ? (
            <pre style={{ whiteSpace: "pre-wrap" }}>{mmContent}</pre>
          ) : (
            <div>No materia medica available</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMmOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* score explanation */}
      <Modal show={scoreOpen} onHide={() => setScoreOpen(false)} size="md">
        <Modal.Header closeButton>
          <Modal.Title>Score breakdown</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ fontSize: 14, color: "#35484a" }}>
            <p>
              <strong>What the score means</strong>
            </p>
            <ul>
              <li>
                <strong>Degree match</strong> — tokens from your query found in
                rubrics/provings.
              </li>
              <li>
                <strong>Source trust</strong> — number and quality of sources
                (author weights applied).
              </li>
              <li>
                <strong>Rubric weight</strong> — aggregated grade of matched
                rubrics.
              </li>
              <li>
                <strong>Severity match</strong> — closeness to selected
                severity.
              </li>
            </ul>
            <p style={{ color: "#6c757d" }}>
              Server should return structured fields (sources_struct,
              matched_rubrics, model_version, response_hash) for full
              transparency.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setScoreOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* compare modal */}
      <Modal
        show={compareOpen}
        onHide={() => setCompareOpen(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Compare Remedies</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 10, color: "#6c757d" }}>
            Shared keynotes (center) vs unique (per remedy). Matched snippets
            below each card.
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 12,
            }}
          >
            {comparison.map((name, i) => {
              const found = flatList.find(
                (d) => (typeof d === "string" ? d : d.remedy || d.name) === name
              ) || { remedy: name };
              const snips = matchedSnips(found, formData.disease);
              const keys = [...keynoteSet(found)];
              return (
                <div
                  key={i}
                  className="remedy"
                  style={{ flexDirection: "column", alignItems: "stretch" }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <div style={{ fontWeight: 800 }}>
                      {found.remedy || found.name || name}
                    </div>
                    <div style={{ color: "#6c757d" }}>
                      {found._score ? found._score.score + "%" : "—"}
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      Keynotes
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {keys.length ? (
                        keys.slice(0, 8).map((k, ii) => (
                          <div
                            key={ii}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              background: "rgba(126,163,255,0.06)",
                            }}
                          >
                            {k}
                          </div>
                        ))
                      ) : (
                        <div style={{ color: "#6c757d" }}>—</div>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      Matched snippets
                    </div>
                    <div
                      style={{
                        maxHeight: 140,
                        overflow: "auto",
                        padding: 6,
                        border: "1px solid rgba(0,0,0,0.04)",
                        borderRadius: 6,
                      }}
                    >
                      {snips.length ? (
                        snips.map((s, si) => (
                          <div key={si} style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>
                              {s.source}
                            </div>
                            <div
                              style={{ fontSize: 13 }}
                              dangerouslySetInnerHTML={{
                                __html: s.html || esc("—"),
                              }}
                            />
                          </div>
                        ))
                      ) : (
                        <div style={{ color: "#6c757d" }}>
                          No matched snippets
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => removeCompare(name)}
                    >
                      <BsXLg />
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setCompareOpen(false);
                        setFormData({ disease: name });
                      }}
                    >
                      Open
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* venn/diff center */}
            <div className="remedy" style={{ flexDirection: "column" }}>
              <div style={{ fontWeight: 800 }}>Venn / Diff</div>
              <div style={{ marginTop: 10 }}>
                {(() => {
                  const items = comparison.map(
                    (n) =>
                      flatList.find(
                        (d) =>
                          (typeof d === "string" ? d : d.remedy || d.name) === n
                      ) || { remedy: n }
                  );
                  const diff = computeVenn(items);
                  return (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        Shared Keynotes
                      </div>
                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        {diff.shared.length ? (
                          diff.shared.map((s, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                background: "rgba(255,244,182,0.5)",
                              }}
                            >
                              {s}
                            </div>
                          ))
                        ) : (
                          <div style={{ color: "#6c757d" }}>None</div>
                        )}
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          marginTop: 10,
                          marginBottom: 6,
                        }}
                      >
                        Unique
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {diff.unique.map((arr, ii) => (
                          <div key={ii}>
                            <div style={{ fontWeight: 800 }}>
                              {comparison[ii]}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                              }}
                            >
                              {arr.length ? (
                                arr.slice(0, 8).map((u, uj) => (
                                  <div
                                    key={uj}
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: 8,
                                      background: "rgba(240,240,240,0.6)",
                                    }}
                                  >
                                    {u}
                                  </div>
                                ))
                              ) : (
                                <div style={{ color: "#6c757d" }}>—</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCompareOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* reached limit modal */}
      <Reachedlimit show={show} handleClose={() => setShow(false)} />


    </Row>
  );
};

export default Repertory;