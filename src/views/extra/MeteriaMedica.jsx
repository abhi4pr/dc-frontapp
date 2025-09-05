import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import {
  Card,
  Row,
  Button,
  Form,
  Col,
  Spinner,
  Badge,
  Modal,
  ProgressBar,
  Nav,
  Tab
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BsSearch, BsPrinter, BsPlusLg, BsXLg } from "react-icons/bs";
import { FaBook, FaHistory } from "react-icons/fa";
import "react-confirm-alert/src/react-confirm-alert.css";
import api from "../../utility/api";
import { toast } from "react-toastify";
import { API_URL } from "../../constants";
import { UserContext } from "../../contexts/UserContext";
import Reachedlimit from "components/Modal/Reachedlimit";

/**
 * MeteriaMedica — upgraded single-file
 * - Keeps: component name MeteriaMedica, input name "medicine_name", handlers handleChange & handleSubmit
 * - Adds: IndexedDB caching, multi-component confidence, compare Venn/diff, matched-snippet highlights
 * - No external CSS: inline injection below (glassmorphism + the pink/blue palette)
 */

/* ------------------ IndexedDB Helper (single-file) ------------------ */
const DB_NAME = "homeopathika_mm_db_v1";
const DB_STORE = "mm_cache";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h default
const CACHE_MAX = 500;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        const store = db.createObjectStore(DB_STORE, { keyPath: "key" });
        store.createIndex("ts_idx", "ts");
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

async function getCacheEntry(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const store = tx.objectStore(DB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const v = req.result;
        if (!v) return resolve(null);
        const now = Date.now();
        if (v.ttl && now - v.ts > v.ttl) {
          // expired
          resolve(null);
        } else {
          resolve(v.value);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}

async function setCacheEntry(key, value, ttl = CACHE_TTL) {
  try {
    const db = await openDB();
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    store.put({ key, value, ts: Date.now(), ttl, ver: 1 });
    await tx.complete;
    // trim if needed
    trimCacheIfNeeded();
  } catch (e) {
    // ignore
  }
}

async function getAllCacheKeys() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, "readonly");
      const store = tx.objectStore(DB_STORE);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

async function trimCacheIfNeeded() {
  try {
    const db = await openDB();
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      if (all.length <= CACHE_MAX) return;
      all.sort((a, b) => a.ts - b.ts);
      const toRemove = all.slice(0, all.length - CACHE_MAX);
      toRemove.forEach((r) => store.delete(r.key));
    };
  } catch (e) {}
}

async function clearExpiredEntries() {
  try {
    const db = await openDB();
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    const req = store.openCursor();
    const now = Date.now();
    req.onsuccess = (ev) => {
      const cursor = ev.target.result;
      if (!cursor) return;
      const val = cursor.value;
      if (val && val.ttl && now - val.ts > val.ttl) {
        cursor.delete();
      }
      cursor.continue();
    };
  } catch (e) {}
}

/* ------------------ Utilities ------------------ */
const escapeHtml = (str) => {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

// highlight tokens in text by wrapping matches in <mark>
function highlightMatches(text = "", tokens = []) {
  if (!text) return escapeHtml(text);
  let escaped = escapeHtml(text);
  // sort tokens by length desc to avoid partial overlaps
  const uniqueTokens = Array.from(
    new Set(tokens.filter(Boolean).map((t) => t.trim().toLowerCase()))
  ).sort((a, b) => b.length - a.length);
  uniqueTokens.forEach((tok) => {
    if (!tok) return;
    const re = new RegExp(`(${escapeRegExp(tok)})`, "gi");
    escaped = escaped.replace(re, "<mark>$1</mark>");
  });
  return escaped;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ------------------ Confidence (multi-component) ------------------ */
/**
 * Returns:
 * {
 *   score: Number (0-100),
 *   components: {
 *     sourceCount: Number (0-100),
 *     provingCount: Number (0-100),
 *     concordance: Number (0-100),
 *     matchScore: Number (0-100)
 *   }
 * }
 *
 * Heuristics used:
 * - sourceCount: capped scaling of sources
 * - provingCount: capped scaling of provings
 * - concordance: measures overlap of keynotes across sources (best-effort)
 * - matchScore: token overlap between query and keynotes/provings
 */
function computeConfidenceComponents(entry, query = "") {
  // defensively handle shapes
  const sources = Array.isArray(entry?.sources)
    ? entry.sources
    : entry?.source
      ? [entry.source]
      : [];
  const provings = Array.isArray(entry?.provings) ? entry.provings : [];
  const keynotes = Array.isArray(entry?.keynotes)
    ? entry.keynotes
    : entry?.summary
      ? Array.isArray(entry.summary)
        ? entry.summary
        : String(entry.summary)
            .split(".")
            .map((s) => s.trim())
            .filter(Boolean)
      : [];

  const sourceCountRaw = Math.min(10, sources.length);
  const provingCountRaw = Math.min(30, provings.length);
  const keynotesRaw = Math.min(20, keynotes.length);

  const sourceCount = Math.round((sourceCountRaw / 10) * 100); // 0..100
  const provingCount = Math.round((provingCountRaw / 30) * 100); // 0..100

  // concordance: naive best-effort - look for keynotes that appear in multiple source strings if sources provided
  let concordance = 0;
  try {
    if (sources.length >= 2 && keynotes.length) {
      // count keynotes that appear in at least 2 sources (string match)
      let matchedAcross = 0;
      keynotes.forEach((k) => {
        const low = String(k).toLowerCase();
        let count = 0;
        sources.forEach((s) => {
          if (!s) return;
          if (String(s).toLowerCase().includes(low)) count++;
        });
        if (count >= 2) matchedAcross++;
      });
      concordance = Math.round(
        (matchedAcross / Math.max(1, keynotes.length)) * 100
      );
    } else {
      // fallback: if many sources -> assume higher concordance up to a point
      concordance = Math.min(50, sourceCount * 7);
    }
  } catch (e) {
    concordance = Math.min(50, sourceCount * 7);
  }

  // matchScore: similarity between query tokens and keynotes + provings text
  const queryTokens = (query || "")
    .split(/\s+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  let matches = 0;
  let totalCheck = Math.max(1, keynotes.length + provings.length);
  try {
    if (queryTokens.length) {
      queryTokens.forEach((qt) => {
        // check in keynotes
        keynotes.forEach((k) => {
          if (String(k).toLowerCase().includes(qt)) matches++;
        });
        // check in provings text
        provings.forEach((p) => {
          const txt = (p.text || p.excerpt || p.summary || "").toLowerCase();
          if (txt.includes(qt)) matches++;
        });
      });
    }
  } catch (e) {
    /* ignore */
  }
  // normalize: but matches could be > totalCheck so clamp
  const matchScore = Math.round(
    Math.min(100, (matches / Math.max(1, queryTokens.length || 1)) * 12)
  );

  // combine with weights (tunable)
  const score = Math.round(
    0.4 * matchScore + // how well it matches the doctor's search
      0.25 * sourceCount + // how many sources
      0.2 * provingCount + // how many provings
      0.15 * concordance // how much agreement across sources
  );

  return {
    score: Math.min(99, Math.max(0, score)),
    components: {
      sourceCount,
      provingCount,
      concordance,
      matchScore,
    },
  };
}

/* ------------------ Main Component ------------------ */
const MeteriaMedica = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [show, setShow] = useState(false);
  

  // preserve form state and handlers
  const [formData, setFormData] = useState({ medicine_name: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [data, setData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cacheBadge, setCacheBadge] = useState(false);
  const [inlineError, setInlineError] = useState(null);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1);

  // compare UI
  const [compareList, setCompareList] = useState([]); // entries or names
  const [showCompareModal, setShowCompareModal] = useState(false);

  // author/edition filters (UI)
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedEditions, setSelectedEditions] = useState([]);

  // refs
  const suggestionsRef = useRef(null);
  const resultsRef = useRef(null);
  const debounceRef = useRef(null);
  const controllerRef = useRef(null);
  const latestReqId = useRef(0);

  // inject inline CSS (uses the provided palette & glassmorphism)
  useEffect(() => {
    if (user?.hit_count === 0) {
      setShow(true); 
    }
    const id = "mm-upgrade-styles-v2";
    if (document.getElementById(id)) return;
    const css = `
      /* Upgraded Materia Medica styles (glassmorphism & gradient palette) */
      .mm-root { padding: 36px 22px 90px; display:flex; justify-content:center; }
      .mm-card { width:100%; max-width:1200px; margin:0 auto; border-radius:20px;
        background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,250,255,0.86));
        border:1px solid rgba(255,255,255,0.5); box-shadow:0 30px 50px rgba(20,22,50,0.10);
        padding:28px 26px; position:relative; backdrop-filter: blur(10px) saturate(120%);
      }
      .mm-aurora { position:absolute; inset:-40% -20% auto -20%; height:380px; pointer-events:none;
        background: radial-gradient(circle at 15% 10%, rgba(126,163,255,0.12), transparent 8%),
                    radial-gradient(circle at 90% 10%, rgba(255,144,193,0.12), transparent 10%),
                    linear-gradient(120deg, rgba(98,141,255,0.06), rgba(255,112,171,0.06));
        filter: blur(40px); border-radius:24px; z-index:1;
      }
      .mm-top { position:relative; z-index:2; display:flex; align-items:flex-start; gap:14px; margin-bottom:18px; }
      .mm-logo { width:52px; height:52px; border-radius:14px; background: linear-gradient(135deg,#7ea3ff,#ff90c1);
        display:grid; place-items:center; color:white; font-weight:800; font-size:18px; box-shadow:0 8px 28px rgba(124,109,255,0.12); }
      .mm-title { margin:0; font-size:20px; font-weight:800; color:#072038; }
      .mm-sub { margin-top:4px; color:#4b5b63; font-size:13px; }
      .mm-controls { margin-left:auto; display:flex; gap:10px; align-items:center; }
      .mm-search-row { display:flex; gap:12px; align-items:center; width:100%; }
      .mm-search { position:relative; flex:1; min-width:260px; }
      .mm-search input.search-input { width:100%; height:54px; border-radius:14px; padding:12px 48px 12px 48px;
        border: 1px solid rgba(10,60,80,0.06); background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,255,0.98));
        box-shadow: 0 10px 30px rgba(18,35,80,0.04) inset; outline:none; font-size:15px; color:#062234;
      }
      .mm-search .left-ic { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#375e84; font-size:18px; }
      .mm-search .right-actions { position:absolute; right:14px; top:50%; transform:translateY(-50%); display:flex; gap:8px; align-items:center; }
      .mm-pill { padding:8px 16px; border-radius:999px; font-weight:700; cursor:pointer; border:1px solid rgba(10,60,80,0.06);
        background: linear-gradient(90deg, rgba(126,163,255,0.08), rgba(255,144,193,0.04));
      }
      .mm-btn-primary { padding:10px 18px; border-radius:12px; border:none; color:white; font-weight:800;
        background: linear-gradient(90deg,#7ea3ff,#ff90c1); box-shadow: 0 12px 30px rgba(126,163,255,0.12);
      }
      .mm-suggestions { position:absolute; left:0; right:0; top:calc(100% + 10px); z-index:60;
        background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(252,254,255,0.98));
        box-shadow: 0 18px 38px rgba(10,20,40,0.08); border-radius:12px; overflow:auto; max-height:260px; border:1px solid rgba(10,60,80,0.04);
      }
      .mm-suggestion { padding:12px 14px; cursor:pointer; display:flex; justify-content:space-between; gap:12px; align-items:center; }
      .mm-suggestion:hover, .mm-suggestion.active { background: linear-gradient(90deg, rgba(126,163,255,0.04), rgba(255,144,193,0.03)); }
      .mm-meta { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:12px; }
      .mm-results { margin-top:18px; display:grid; gap:12px; }
      .mm-remedy { display:flex; gap:14px; align-items:flex-start; justify-content:space-between; padding:14px; border-radius:12px;
        background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(255,255,255,0.96)); border:1px solid rgba(10,60,80,0.03);
        box-shadow: 0 10px 30px rgba(6,40,60,0.03);
      }
      .mm-remedy-badge { min-width:84px; height:84px; border-radius:12px; display:grid; place-items:center;
        background: linear-gradient(135deg,#7ea3ff33,#ff90c133); font-weight:800; color:#073642; font-size:18px;
      }
      .mm-remedy-title { font-weight:800; font-size:16px; color:#042b33; margin-bottom:6px; }
      .mm-remedy-meta { font-size:13px; color:#4b5b63; margin-bottom:8px; }
      .mm-remedy-chips { display:flex; gap:8px; flex-wrap:wrap; }
      .mm-remedy-actions { display:flex; flex-direction:column; gap:8px; align-items:flex-end; min-width:160px; }
      .mm-inline-error { background: rgba(255,230,230,0.95); color:#842029; padding:12px; border-radius:10px; border:1px solid rgba(200,60,60,0.12); margin-bottom:12px; }
      .compare-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; }
      .compare-card { padding:12px; border-radius:12px; background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,250,255,0.98)); border:1px solid rgba(10,60,80,0.04); }
      .radar-svg { width:100%; height:160px; }
      mark { background: #fffd82; padding:0 2px; border-radius:3px; }
      @media (max-width:900px) { .mm-search-row { flex-direction:column; align-items:stretch; } .compare-grid { grid-template-columns: 1fr; } .mm-remedy { flex-direction:column; align-items:stretch; } }
    `;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = css;
    document.head.appendChild(style);
  }, []);

  // cleanup expired entries on mount
  useEffect(() => {
    clearExpiredEntries();
  }, []);

  /* ---------- Suggestion fetcher (server-first, fallback corpus) ---------- */
  const fetchSuggestions = async (q) => {
    try {
      const resp = await api.get(`${API_URL}/`);
      if (
        resp &&
        resp.data &&
        Array.isArray(resp.data.suggestions) &&
        resp.data.suggestions.length
      ) {
        return resp.data.suggestions;
      }
    } catch (e) {
      // fallback below
    }
    const corpus = [
      "Arsenicum album",
      "Belladonna",
      "Bryonia",
      "Natrum muriaticum",
      "Sulphur",
      "Phosphorus",
      "Pulsatilla",
      "Ignatia",
      "Nux vomica",
      "Rhus tox",
      "Arnica montana",
      "Calcarea carbonica",
      "Lycopodium",
      "Sepia",
      "Carbo vegetabilis",
    ];
    return corpus
      .filter((c) => c.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 12);
  };

  // suggestions logic
  useEffect(() => {
    const q = formData.medicine_name?.trim();
    if (!q || q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const s = await fetchSuggestions(q);
      setSuggestions(s);
      setShowSuggestions(s.length > 0);
      setActiveSuggestionIdx(-1);
    }, 220);
    return () => clearTimeout(debounceRef.current);
  }, [formData.medicine_name, selectedAuthors, selectedEditions]);

  // close suggestions outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // keyboard nav within suggestions
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
        const sel = suggestions[activeSuggestionIdx];
        handleChange({ target: { name: "medicine_name", value: sel } });
        setShowSuggestions(false);
        setActiveSuggestionIdx(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSuggestions, suggestions, activeSuggestionIdx]);

  /* ---------- Preserve signature exactly ---------- */
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    setInlineError(null);
    if (name === "medicine_name" && value && value.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  /* ---------- handleSubmit preserved (payload unchanged) with IndexedDB caching and AbortController ---------- */
  const handleSubmit = async (event) => {
    if (event && event.preventDefault) event.preventDefault();
    setInlineError(null);

    if (!formData.medicine_name || formData.medicine_name.trim() === "") {
      setErrors({ medicine_name: "Please enter a remedy name." });
      return;
    }

    const key = formData.medicine_name.trim().toLowerCase();
    // check indexedDB cache

    // abort previous
    try {
      controllerRef.current?.abort();
    } catch (e) {}
    controllerRef.current = new AbortController();
    const reqId = ++latestReqId.current;

    try {
      setLoading(true);
      const response = await api.post(`${API_URL}/ai/send_meteria/`, {
        medicine_name: formData.medicine_name,
        authors: selectedAuthors,
        edition: selectedEditions,
        userId: user?._id,
      });

      const payload = response?.data;
      // compute and attach confidence components
      if (payload && !Array.isArray(payload)) {
        const cc = computeConfidenceComponents(payload, formData.medicine_name);
        payload._confidence = cc;
        payload._fetched_at = Date.now();
      } else if (Array.isArray(payload)) {
        payload.forEach((p) => {
          if (typeof p === "object") {
            const cc = computeConfidenceComponents(p, formData.medicine_name);
            p._confidence = cc;
            p._fetched_at = Date.now();
          }
        });
      }
      setData(payload);
      setCacheBadge(false);
      await setCacheEntry(key, payload);
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
      console.error("Materia Medica search error:", err);
      setInlineError(
        err?.response?.data?.message ||
          "An error occurred while fetching medicine detail."
      );
      if (err.response && err.response.data) {
        toast.error(err.response.data.message || "An error occurred.");
      } else {
        toast.error("An error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshFromServer = async (key) => {
    try {
      const resp = await api.post(
        `${API_URL}/ai/send_medicine_detail/${user?._id}`,
        { medicine_name: formData.medicine_name }
      );
      const p = resp?.data?.data;
      if (!p) return;
      if (!Array.isArray(p)) {
        const cc = computeConfidenceComponents(p, formData.medicine_name);
        p._confidence = cc;
        p._fetched_at = Date.now();
      } else {
        p.forEach((it) => {
          if (typeof it === "object") {
            const cc = computeConfidenceComponents(it, formData.medicine_name);
            it._confidence = cc;
            it._fetched_at = Date.now();
          }
        });
      }
      setData(p);
      await setCacheEntry(key, p);
    } catch (e) {
      // ignore
    }
  };

  /* ---------- Compare helpers (Venn/diff + matched-snippet highlights) ---------- */
  const addToCompare = (item) => {
    const name =
      typeof item === "string"
        ? item
        : item.remedy || item.name || (item && (item.remedy || item.name));
    if (!name) return;
    if (
      compareList.find(
        (c) => (typeof c === "string" ? c : c.remedy || c.name) === name
      )
    ) {
      toast.info("Already in compare");
      return;
    }
    if (compareList.length >= 3) {
      toast.info("Max 3 items to compare");
      return;
    }
    setCompareList((prev) => [...prev, item]);
  };

  const removeFromCompare = (name) => {
    setCompareList((prev) =>
      prev.filter(
        (p) => (typeof p === "string" ? p : p.remedy || p.name) !== name
      )
    );
  };

  const openCompare = () => {
    if (compareList.length < 2) {
      toast.info("Select two or more remedies to compare");
      return;
    }
    setShowCompareModal(true);
  };

  // derive keynotes set for Venn/diff
  function getKeynoteSet(entry) {
    if (!entry) return new Set();
    let keynotes = [];
    if (Array.isArray(entry.keynotes) && entry.keynotes.length)
      keynotes = entry.keynotes;
    else if (entry.summary) {
      if (Array.isArray(entry.summary)) keynotes = entry.summary;
      else
        keynotes = String(entry.summary)
          .split(".")
          .map((s) => s.trim())
          .filter(Boolean);
    }
    return new Set(
      keynotes.map((k) => String(k).trim().toLowerCase()).filter(Boolean)
    );
  }

  // compute venn/diff for compareList
  const computeCompareDiff = (list) => {
    const entries = list.map((it) =>
      typeof it === "string" ? { remedy: it, keynotes: [] } : it
    );
    const sets = entries.map((e) => getKeynoteSet(e));
    if (sets.length === 2) {
      const a = sets[0],
        b = sets[1];
      const shared = [...a].filter((x) => b.has(x));
      const onlyA = [...a].filter((x) => !b.has(x));
      const onlyB = [...b].filter((x) => !a.has(x));
      return { shared, unique: [onlyA, onlyB] };
    } else if (sets.length === 3) {
      const [a, b, c] = sets;
      const sharedAll = [...a].filter((x) => b.has(x) && c.has(x));
      const onlyA = [...a].filter((x) => !b.has(x) && !c.has(x));
      const onlyB = [...b].filter((x) => !a.has(x) && !c.has(x));
      const onlyC = [...c].filter((x) => !a.has(x) && !b.has(x));
      return { shared: sharedAll, unique: [onlyA, onlyB, onlyC] };
    }
    return { shared: [], unique: sets.map((s) => [...s]) };
  };

  // matched snippets: return array of { source, highlightedHtml } for provings or summary with query tokens highlighted
  function matchedSnippetsForEntry(entry, query) {
    const tokens = (query || "")
      .split(/\s+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const results = [];
    if (!entry) return results;
    // summary
    if (entry.summary) {
      const txt = Array.isArray(entry.summary)
        ? entry.summary.join(" ")
        : String(entry.summary);
      const highlighted = highlightMatches(txt, tokens);
      results.push({ source: "Summary", html: highlighted });
    }
    // provings
    if (Array.isArray(entry.provings)) {
      entry.provings.slice(0, 6).forEach((p, i) => {
        const txt = p.text || p.excerpt || p.summary || "";
        const highlighted = highlightMatches(txt, tokens);
        results.push({
          source: p.source || `Prov ${i + 1}`,
          html: highlighted,
        });
      });
    }
    return results;
  }

  /* ---------- Print / Export (sanitized) ---------- */
  const generatePrintableHtml = (payload) => {
    const sanitize = (s) => {
      if (!s && s !== 0) return "";
      return escapeHtml(String(s));
    };
    const title = sanitize(
      payload.remedy || payload.name || formData.medicine_name
    );
    const sourcesHtml = (payload.sources || [])
      .map((src) => `<li>${sanitize(src)}</li>`)
      .join("");
    const keynotesHtml = (payload.keynotes || [])
      .map((k) => `<li>${sanitize(k)}</li>`)
      .join("");
    return `
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>${title} — Materia Medica</title>
          <style>
            body{font-family:system-ui, -apple-system, Roboto, Arial; padding:24px; color:#0b1730;}
            .card{border-radius:12px;padding:18px;border:1px solid #eee;box-shadow:0 12px 30px rgba(10,20,40,0.06);}
            h1{margin:0 0 8px 0;font-size:20px;}
            ul{margin:8px 0 12px 18px;}
            pre{white-space:pre-wrap;font-size:13px;}
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${title}</h1>
            <div class="meta">${sanitize(payload.family || payload.kingdom || "")} • ${sanitize(payload.source || "")}</div>
            <h3>Keynotes</h3>
            <ul>${keynotesHtml || "<li>—</li>"}</ul>
            <h3>Sources</h3>
            <ul>${sourcesHtml || "<li>—</li>"}</ul>
            <h3>Provings / Excerpts</h3>
            <pre>${sanitize(JSON.stringify(payload.provings || payload.excerpts || payload, null, 2))}</pre>
          </div>
        </body>
      </html>
    `;
  };

  /* ---------- Renderers (keeps original logic but enriched) ---------- */
  const renderResults = () => {
    if (!data) return null;

    // string fallback
    if (data.raw_text) {
      return (
        <Card className="p-3" aria-live="polite">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 800 }}>Search Result</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Badge bg="secondary">AI Summary</Badge>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  const w = window.open("", "_blank");
                  w.document.write(`<pre>${escapeHtml(data)}</pre>`);
                  w.document.close();
                  w.print();
                }}
              >
                <BsPrinter />
              </Button>
            </div>
          </div>
          <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {data.raw_text}
          </pre>
        </Card>
      );
    }

    // array of matches
    if (Array.isArray(data) && data.length > 0) {
      return data.map((it, idx) => {
        const remedy =
          typeof it === "string" ? it : it.remedy || it.name || "Unknown";
        const family = (it && (it.family || it.kingdom)) || "—";
        const keynotes =
          (it &&
            (it.keynotes ||
              (it.summary
                ? Array.isArray(it.summary)
                  ? it.summary
                  : it.summary.split(".").slice(0, 3)
                : []))) ||
          [];
        const provings = (it && it.provings) || [];
        const conf =
          it?._confidence ||
          computeConfidenceComponents(it, formData.medicine_name);
        const confScore = conf.score || it?._computed_confidence || 60;
        const source = it?.source || "source unknown";

        return (
          <div
            className="mm-remedy"
            key={`${remedy}-${idx}`}
            role="article"
            aria-labelledby={`remedy-${idx}`}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                flex: 1,
              }}
            >
              <div className="mm-remedy-badge" aria-hidden>
                {(remedy || "").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div id={`remedy-${idx}`} className="mm-remedy-title">
                  {remedy}
                </div>
                <div className="mm-remedy-meta">
                  <strong>Family:</strong> {family} •{" "}
                  <span style={{ color: "#6c757d" }}>{source}</span>
                </div>
                <div className="mm-remedy-chips" style={{ marginTop: 8 }}>
                  {keynotes && keynotes.length ? (
                    keynotes.slice(0, 4).map((k, i) => (
                      <span
                        key={i}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: "rgba(126,163,255,0.06)",
                          fontSize: 13,
                        }}
                      >
                        {k}
                      </span>
                    ))
                  ) : (
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: "rgba(240,240,240,0.6)",
                      }}
                    >
                      No keynotes
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 10 }} className="mm-small">
                  <strong>Confidence:</strong> <strong>{confScore}%</strong>
                </div>

                {/* provenance accordion */}
                {(it.sources || it.provings) && (
                  <details style={{ marginTop: 10 }}>
                    <summary
                      style={{
                        cursor: "pointer",
                        color: "#375e84",
                        fontWeight: 700,
                      }}
                    >
                      View provenance & excerpts
                    </summary>
                    <div style={{ marginTop: 8 }}>
                      {it.sources && it.sources.length ? (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>
                            Sources
                          </div>
                          <ul style={{ marginTop: 0 }}>
                            {it.sources.map((s, si) => (
                              <li key={si} style={{ color: "#4b5b63" }}>
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {it.provings && it.provings.length ? (
                        <div>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>
                            Provings (excerpt)
                          </div>
                          {it.provings.slice(0, 3).map((p, pi) => (
                            <div
                              key={pi}
                              style={{
                                marginBottom: 10,
                                background: "rgba(126,163,255,0.03)",
                                padding: 10,
                                borderRadius: 8,
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: 13 }}>
                                {p.source || p.title || "Prov."}
                              </div>
                              <div style={{ fontSize: 13, color: "#2f3b40" }}>
                                {p.text || p.excerpt || ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </details>
                )}
              </div>
            </div>

            <div className="mm-remedy-actions">
              <div style={{ display: "flex", gap: 8 }}>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(remedy)
                      .then(() =>
                        toast.success(`${remedy} copied to clipboard.`)
                      )
                      .catch(() => toast.info(remedy));
                  }}
                >
                  <BsPlusLg /> Quick add
                </Button>

                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => {
                    const html = generatePrintableHtml(
                      typeof it === "string" ? { remedy: it } : it
                    );
                    const w = window.open("", "_blank");
                    w.document.write(html);
                    w.document.close();
                    w.focus();
                  }}
                >
                  <BsPrinter />
                </Button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  alignItems: "flex-end",
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 18 }}>
                  {confScore}%
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    size="sm"
                    variant="light"
                    onClick={() => addToCompare(it)}
                  >
                    Compare
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    onClick={() =>
                      handleChange({
                        target: { name: "medicine_name", value: remedy },
                      })
                    }
                  >
                    Open
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      });
    }

    // single object
    if (typeof data === "object") {
      const remedy = data.remedy || data.name || formData.medicine_name;
      const family = data.family || data.kingdom || "—";
      const keynotes =
        data.keynotes ||
        (data.summary
          ? Array.isArray(data.summary)
            ? data.summary
            : data.summary.split(".").slice(0, 4)
          : []);
      const provings = data.provings || [];
      const related = data.related || [];
      const sources = data.sources || (data.source ? [data.source] : []);
      const confObj =
        data._confidence ||
        computeConfidenceComponents(data, formData.medicine_name);
      const confScore = confObj.score || 60;

      return (
        <Card className="p-3" aria-live="polite">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{remedy}</div>
              <div style={{ color: "#6c757d", marginTop: 6 }}>
                {family} • {data.source || "Source not specified"}
              </div>
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Badge bg="info">AI Summary</Badge>
                <div style={{ fontSize: 13, color: "#6c757d" }}>
                  Last fetched:{" "}
                  {data._fetched_at
                    ? new Date(data._fetched_at).toLocaleString()
                    : "—"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => {
                  const html = generatePrintableHtml(data);
                  const w = window.open("", "_blank");
                  w.document.write(html);
                  w.document.close();
                  w.focus();
                }}
              >
                <BsPrinter />
              </Button>

              <div style={{ minWidth: 160, textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 20 }}>
                  {confScore}%
                </div>
                <div style={{ fontSize: 12, color: "#6c757d" }}>confidence</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Keynotes</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {keynotes.length ? (
                keynotes.map((k, i) => (
                  <div
                    key={i}
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
                <div>No keynotes</div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>
                Provings (excerpt)
              </div>
              {provings.length ? (
                provings.slice(0, 4).map((p, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {p.source || p.title}
                    </div>
                    <div style={{ fontSize: 13 }}>{p.text || p.excerpt}</div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 13 }}>No provings</div>
              )}
            </div>

            {related.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>
                  Related Remedies
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {related.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        background: "rgba(200,200,200,0.08)",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        handleChange({
                          target: { name: "medicine_name", value: r },
                        })
                      }
                    >
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sources.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>
                  Cited Sources
                </div>
                <ul style={{ marginTop: 0 }}>
                  {sources.map((s, i) => (
                    <li key={i} style={{ color: "#3b4a4f" }}>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                size="sm"
                variant="primary"
                className="mm-btn-primary"
                onClick={() => addToCompare(data)}
              >
                <BsPlusLg /> Add to compare
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() =>
                  navigator.clipboard
                    ?.writeText(remedy)
                    .then(() => toast.success("Copied"))
                    .catch(() => {})
                }
              >
                Copy name
              </Button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <Button
                size="sm"
                variant="light"
                onClick={() => {
                  toast.info("Feedback recorded (demo).");
                }}
              >
                I confirm
              </Button>
              <Button
                size="sm"
                variant="light"
                onClick={() => {
                  toast.info("Flagged for review (demo).");
                }}
              >
                Flag
              </Button>
            </div>
          </div>

          {/* confidence breakdown */}
          {data._confidence && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                Confidence breakdown
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>Match score</div>
                  <div>{data._confidence.components.matchScore}%</div>
                </div>
                <ProgressBar now={data._confidence.components.matchScore} />
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>Sources</div>
                  <div>{data._confidence.components.sourceCount}%</div>
                </div>
                <ProgressBar now={data._confidence.components.sourceCount} />
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>Provings</div>
                  <div>{data._confidence.components.provingCount}%</div>
                </div>
                <ProgressBar now={data._confidence.components.provingCount} />
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>Concordance</div>
                  <div>{data._confidence.components.concordance}%</div>
                </div>
                <ProgressBar now={data._confidence.components.concordance} />
              </div>
            </div>
          )}
        </Card>
      );
    }

    return (
      <Card className="p-3">
        <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </Card>
    );
  };

  const authorChips = [
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
  const editionChips = ["1st Ed", "2nd Ed", "3rd Ed", "Modern"];

  /* ---------- JSX ---------- */
  return (
    <Row className="justify-content-center mm-root">
      <div className="mm-card" role="region" aria-labelledby="mm-title">
        <div className="mm-aurora" aria-hidden />

        <div className="mm-top">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="mm-logo">HM</div>
            <div>
              <h4 id="mm-title" className="mm-title">
                Materia Medica — Doctor View
              </h4>
              <div className="mm-sub">
                Search remedies across authors, compare evidence, and inspect
                provenance.
              </div>
            </div>
          </div>

          <div className="mm-controls" style={{ marginLeft: "30%" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "#495057" }}>
                Hits left: <strong>{user?.hit_count ?? "-"}</strong>
              </div>
              <Button
                size="sm"
                variant="outline-primary"
                className="mm-pill"
                onClick={() => navigate("/plans")}
              >
                Recharge
              </Button>
            </div>
          </div>
        </div>

        {inlineError && (
          <div className="mm-inline-error" role="alert">
            {inlineError}{" "}
          </div>
        )}

        <Form onSubmit={handleSubmit} aria-label="Materia Medica search form">
          <Form.Group as={Row} className="mb-3" controlId="formTitle">
            <Form.Label
              column
              sm={2}
              style={{ textAlign: "right", paddingTop: 8 }}
            >
              Medicine:
            </Form.Label>

            <Col sm={10}>
              <div className="mm-search-row">
                <div className="mm-search" ref={suggestionsRef}>
                  <BsSearch className="left-ic" aria-hidden />
                  <input
                    className="search-input"
                    type="text"
                    placeholder="Enter remedy name (e.g., Arsenicum album)..."
                    name="medicine_name"
                    value={formData.medicine_name}
                    onChange={handleChange}
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-controls="mm-suggestions"
                    aria-expanded={showSuggestions}
                  />

                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      id="mm-suggestions"
                      className="mm-suggestions"
                      role="listbox"
                    >
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          role="option"
                          aria-selected={i === activeSuggestionIdx}
                          tabIndex={0}
                          className={`mm-suggestion ${i === activeSuggestionIdx ? "active" : ""}`}
                          onMouseDown={() => {
                            handleChange({
                              target: { name: "medicine_name", value: s },
                            });
                            setShowSuggestions(false);
                            setActiveSuggestionIdx(-1);
                          }}
                          onMouseEnter={() => setActiveSuggestionIdx(i)}
                        >
                          <div style={{ fontWeight: 700 }}>{s}</div>
                          <div style={{ color: "#6c757d", fontSize: 13 }}>
                            Remedy
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    type="submit"
                    variant="primary"
                    className="mm-btn-primary"
                    disabled={loading || user?.hit_count === 0}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden
                        />{" "}
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
                    className="mm-pill"
                    onClick={() => {
                      setFormData({ medicine_name: "" });
                      setData(null);
                      setSuggestions([]);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <Form.Control.Feedback type="invalid">
                {errors.medicine_name}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>

          {/* <Form.Group as={Row} className="mb-3">
            <Col sm={{ span: 10, offset: 2 }}>
              <div className="mm-meta">
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#375e84" }}>
                    <FaBook /> Authors:
                  </div>
                  {authorChips.map((a) => (
                    <div
                      key={a}
                      className="mm-pill"
                      onClick={() => {
                        setSelectedAuthors((prev) =>
                          prev.includes(a)
                            ? prev.filter((x) => x !== a)
                            : [...prev, a]
                        );
                      }}
                      style={{
                        border: selectedAuthors.includes(a)
                          ? "2px solid rgba(126,163,255,0.6)"
                          : undefined,
                      }}
                    >
                      {a}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#375e84" }}>
                    <FaHistory /> Editions:
                  </div>
                  {editionChips.map((e) => (
                    <div
                      key={e}
                      className="mm-pill"
                      onClick={() => {
                        setSelectedEditions((prev) =>
                          prev.includes(e)
                            ? prev.filter((x) => x !== e)
                            : [...prev, e]
                        );
                      }}
                      style={{
                        border: selectedEditions.includes(e)
                          ? "2px solid rgba(255,144,193,0.5)"
                          : undefined,
                      }}
                    >
                      {e}
                    </div>
                  ))}
                </div>

                <div style={{ marginLeft: 12, color: "#6c757d", fontSize: 13 }}>
                  Tip: Use exact remedy names for most precise retrieval. Use
                  Author/Edition filters to limit provenance sources.
                </div>
              </div>
            </Col>
          </Form.Group> */}

          <Row className="mb-3">
            <Col sm={{ span: 10, offset: 2 }}>
                <Tab.Container id="left-tabs-example" defaultActiveKey="first">
                  <Row>
                    <Col sm={3}>
                      <Nav variant="pills" className="flex-column fliter-tab">
                        <Nav.Item>
                          <Nav.Link eventKey="first"><FaBook /> Authors:</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="second"><FaHistory /> Editions:</Nav.Link>
                        </Nav.Item>
                      </Nav>
                    </Col>
                    <Col sm={9}>
                      <Tab.Content>
                        <Tab.Pane className="d-flex align-items-center flex-wrap" eventKey="first" style={{ gap: 8}}>
                          {authorChips.map((a) => (
                        <div
                            key={a}
                            className="mm-pill"
                            onClick={() => {
                              setSelectedAuthors((prev) =>
                                prev.includes(a)
                                  ? prev.filter((x) => x !== a)
                                  : [...prev, a]
                              );
                            }}
                            style={{
                              border: selectedAuthors.includes(a)
                                ? "2px solid rgba(126,163,255,0.6)"
                                : undefined,
                            }}>
                            {a}
                        </div>
                  ))}
                        </Tab.Pane>
                        <Tab.Pane className="d-flex align-items-center flex-wrap" eventKey="second" style={{ gap: 8}}>
                          {editionChips.map((e) => (
                            <div
                              key={e}
                              className="mm-pill"
                              onClick={() => {
                                setSelectedEditions((prev) =>
                                  prev.includes(e)
                                    ? prev.filter((x) => x !== e)
                                    : [...prev, e]
                                );
                              }}
                              style={{
                                border: selectedEditions.includes(e)
                                  ? "2px solid rgba(255,144,193,0.5)"
                                  : undefined,
                              }}
                            >
                              {e}
                            </div>
                          ))}
                        </Tab.Pane>
                      </Tab.Content>
                    </Col>
                  </Row>
                </Tab.Container>

                <div className="mt-2" style={{ marginLeft: 12, color: "#6c757d", fontSize: 13 }}>
                  Tip: Use exact remedy names for most precise retrieval. Use
                  Author/Edition filters to limit provenance sources.
                </div>
            </Col>
          </Row>

          
        </Form>
        
        

        {/* {user?.hit_count === 0 && (
          <p className="text-danger mt-2">
            You have reached your limit — please recharge.
          </p>
        )} */}

        <div className="mm-results" ref={resultsRef} aria-live="polite">
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
            <div style={{ padding: 12, color: "#6c757d" }}>No results yet</div>
          )}
        </div>

        {/* bottom bar for compare actions */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {compareList.map((c, i) => (
              <Badge
                key={i}
                bg="light"
                text="dark"
                style={{ border: "1px solid rgba(0,0,0,0.06)" }}
              >
                {typeof c === "string" ? c : c.remedy || c.name}
              </Badge>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}></div>
        </div>

        {/* Compare Modal */}
        <Modal
          show={showCompareModal}
          onHide={() => setShowCompareModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Compare Remedies — Venn / Matched snippets
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ marginBottom: 12, color: "#6c757d" }}>
              Shared keynotes are shown in the center. Click a source to view
              matched snippets highlighted by your query.
            </div>
            <div className="compare-grid">
              {compareList.slice(0, 3).map((c, idx) => {
                const entry =
                  typeof c === "string"
                    ? { remedy: c, keynotes: [], sources: [] }
                    : c;
                const conf =
                  entry._confidence ||
                  computeConfidenceComponents(entry, formData.medicine_name);
                const keynotesSet = [...getKeynoteSet(entry)];
                const snippets = matchedSnippetsForEntry(
                  entry,
                  formData.medicine_name
                );
                return (
                  <div key={idx} className="compare-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>
                        {entry.remedy || entry.name}
                      </div>
                      <div style={{ color: "#6c757d" }}>{conf.score}%</div>
                    </div>

                    <div
                      style={{ marginTop: 8, fontSize: 13, color: "#4b5b63" }}
                    >
                      {entry.family || entry.kingdom || entry.source || ""}
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        Keynotes
                      </div>
                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        {keynotesSet.length ? (
                          keynotesSet.slice(0, 8).map((k, i) => (
                            <div
                              key={i}
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
                          <div>—</div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        Sources
                      </div>
                      <div style={{ fontSize: 13, color: "#4b5b63" }}>
                        {(entry.sources || []).slice(0, 3).join(" • ") || "—"}
                      </div>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        Matched Snippets (query highlighted)
                      </div>
                      <div
                        style={{
                          maxHeight: 120,
                          overflow: "auto",
                          padding: 6,
                          border: "1px solid rgba(0,0,0,0.04)",
                          borderRadius: 8,
                          background: "#fff",
                        }}
                      >
                        {snippets.length ? (
                          snippets.map((s, si) => (
                            <div key={si} style={{ marginBottom: 8 }}>
                              <div style={{ fontSize: 12, fontWeight: 700 }}>
                                {s.source}
                              </div>
                              <div
                                style={{ fontSize: 13 }}
                                dangerouslySetInnerHTML={{
                                  __html:
                                    s.html.length > 0
                                      ? s.html
                                      : escapeHtml("—"),
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
                        onClick={() =>
                          removeFromCompare(entry.remedy || entry.name)
                        }
                      >
                        <BsXLg />
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          handleChange({
                            target: {
                              name: "medicine_name",
                              value: entry.remedy || entry.name,
                            },
                          });
                          setShowCompareModal(false);
                        }}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Venn / diff column (center) if 2+ items */}
              <div className="compare-card" style={{ minHeight: 260 }}>
                <div style={{ fontWeight: 800 }}>Venn / Diff</div>
                <div style={{ marginTop: 10 }}>
                  {(() => {
                    const diff = computeCompareDiff(compareList);
                    return (
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>
                            Shared Keynotes
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            {diff.shared.length ? (
                              diff.shared.map((s, i) => (
                                <div
                                  key={i}
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
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>
                            Unique Keynotes (per item)
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              flexDirection: "column",
                            }}
                          >
                            {diff.unique.map((uArr, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                }}
                              >
                                <div style={{ fontWeight: 800 }}>
                                  {(compareList[i] &&
                                    (typeof compareList[i] === "string"
                                      ? compareList[i]
                                      : compareList[i].remedy ||
                                        compareList[i].name)) ||
                                    `Item ${i + 1}`}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 6,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {uArr.length ? (
                                    uArr.slice(0, 6).map((u, j) => (
                                      <div
                                        key={j}
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
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontWeight: 700 }}>Notes</div>
                  <div style={{ color: "#6c757d", fontSize: 13 }}>
                    Use the matched snippets to inspect why these items overlap
                    or diverge for the current query:{" "}
                    <strong>{formData.medicine_name || "—"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCompareModal(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* reached limit modal */}
        <Reachedlimit show={show} handleClose={() => setShow(false)} />
      </div>
    </Row>
  );
};

export default MeteriaMedica;
