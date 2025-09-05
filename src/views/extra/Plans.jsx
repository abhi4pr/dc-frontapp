import React, { useMemo, useState } from "react";
import api from "../../utility/api";
import { API_URL } from "../../constants";
import { toast } from "react-toastify";

// Plans — Homeopathika (2025 theme + glassmorphism + clinical palette)
// - Uses inline CSS for the visual tokens so this can run without changing Tailwind config.
// - Cards use glassmorphic panels, soft shadows, and the clinical violet-blue gradient accents.
// - Accessible focus states, clear contrast, and subtle motion via CSS transitions.

const THEME = {
  primary: "rgba(10, 87, 87, 1)", // Slate Blue
  
  primaryHover: "#5A4ACF",
  secondary: "#rgba(10, 87, 87, 1)", // Medium Purple
  secondaryHover: "#8260C9",
  bgMain: "#F9FAFB",
  panelBg: "rgba(255,255,255,0.66)",
  border: "#E5E7EB",
  primaryText: "#111827",
  secondaryText: "#4B5563",
  linkText: "#6A5ACD",
  success: "#10B981",
  error: "#EF4444",
  info: "#3B82F6",
};

const PLAN_DEFINITIONS = {
  basic: {
    id: "basic",
    title: "Basic",
    monthly: 1500,
    annual: 15000,
    bullets: [
      "Offline-first repertory & case recording",
      "Cross-Materia Medica (read-only)",
      "Patient history vault & follow-ups",
      "Voice dictation (basic)",
      "20 free AI analyses (launch promo)",
    ],
    cta: "Start Basic",
  },
  advance: {
    id: "advance",
    title: "Advance",
    monthly: 5000,
    annual: 50000,
    bullets: [
      "Offline-first repertory & case recording",
      "Cross-Materia Medica (read-only)",
      "Patient history vault & follow-ups",
      "Voice dictation (advance)",
      "20 free AI analyses (launch promo)",
    ],
    cta: "Start Advance",
  },
  pro: {
    id: "pro",
    title: "Pro",
    monthly: 10000,
    annual: 100000,
    bullets: [
      "Unlimited AI-augmented analysis",
      "Case synthesis assistant & differential matrix",
      "Advanced outcome analytics & longitudinal graphs",
      "Priority onboarding + webinars",
      "Voice dictation (priority parsing)",
    ],
    cta: "Start Pro",
  },
};

function formatINR(amount) {
  if (amount == null) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function Plans() {
  const [frequency, setFrequency] = useState("monthly");
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsQty, setCreditsQty] = useState(10);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [selectedPlanForConfirm, setSelectedPlanForConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txn, setTxn] = useState(null);

  const plans = useMemo(
    () => [
      PLAN_DEFINITIONS.basic,
      PLAN_DEFINITIONS.advance,
      PLAN_DEFINITIONS.pro,
    ],
    []
  );

  const getAmount = (plan) => {
    if (plan.id === "enterprise") return null;
    return frequency === "monthly" ? plan.monthly : plan.annual;
  };

  const handlePayment = async (plan) => {
    const amount = getAmount(plan);
    if (!amount) return;
    setSelectedPlanForConfirm(plan);
  };

  const confirmAndPay = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${API_URL}/payments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 499, userId: "user_123" }),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "initiate failed");
      setTxn(data.merchantTransactionId);
      // Redirect to PhonePe checkout
      window.location.href = data.redirectUrl;
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }

  };

  const handleContactSales = () => {
    const subject = encodeURIComponent("Homeopathika Enterprise Inquiry");
    const body = encodeURIComponent(
      "Hi team,%0AI'd like to discuss an Enterprise deployment for Homeopathika. Please contact me.%0A--%0AClinic name:%0ATeam size:%0AIntegration needs:"
    );
    window.location.href = `mailto:sales@homeopathika.ai?subject=${subject}&body=${body}`;
  };

  const purchaseCredits = async () => {
    if (creditsQty <= 0) {
      toast.warn("Enter a valid credit quantity");
      return;
    }
    setLoadingCredits(true);

    try {
      const unitPrice = 50;
      const amount = creditsQty * unitPrice;

      const payload = {
        amount,
        currency: "INR",
        product: "ai_credits",
        quantity: creditsQty,
      };
      const response = await api.post(`${API_URL}/create_payment`, payload, {
        timeout: 15000,
      });

      if (response?.data?.checkoutPageUrl) {
        window.open(response.data.checkoutPageUrl, "_blank");
        window.location.href = response.data.checkoutPageUrl;
      } else {
        throw new Error("No checkout URL for credits");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate credits purchase");
    } finally {
      setLoadingCredits(false);
      setShowCreditsModal(false);
    }
  };

  return (
    <div
      style={{
        background: THEME.bgMain,
        minHeight: "100vh",
        padding: "48px 16px",
      }}
    >
      <style>{`
        .hp-card { border-radius: 18px; padding: 20px; border: 1px solid rgba(229,231,235,0.7); background: ${THEME.panelBg}; box-shadow: 0 6px 20px rgba(16,24,40,0.06); backdrop-filter: blur(8px); }
        .hp-btn { transition: all 180ms ease; border-radius: 10px; padding: 10px 14px; font-weight: 600; }
        .hp-primary { background: rgba(10, 87, 87, 1); color: white;  border: none; }
        // .hp-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 40px rgba(10, 87, 87, 1); }
        .hp-primary:active { transform: translateY(0); }
        .hp-secondary { background: white; border: 1px solid rgba(0,0,0,0.06); color: ${THEME.primaryText}; }
        .hp-pill { background: rgba(106,90,205,0.08); color: ${THEME.primary}; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
        .hp-highlight { background: linear-gradient(135deg, rgba(106,90,205,0.06), rgba(147,112,219,0.04)); border: 1px solid rgba(106,90,205,0.08); }
        .hp-savings { color: ${THEME.primary}; font-weight: 700; }
        .hp-badge { padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; color: white; background: ${THEME.primary}; }
        .hp-modal { background: rgba(255,255,255,0.9); border-radius: 14px; padding: 18px; border: 1px solid rgba(229,231,235,0.7); box-shadow: 0 20px 60px rgba(17,24,39,0.18); }
        .hp-feature { display: flex; gap: 8px; align-items: flex-start; }
        .hp-feature svg { flex: 0 0 18px; }
        a.hp-link { color: ${THEME.linkText}; text-decoration: underline; }

        /* Responsiveness */
        @media (min-width: 768px) {
          .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        }
        @media (max-width: 767px) {
          .plans-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <h2 style={{ color: THEME.primaryText, fontSize: 28, margin: 6 }}>
            Homeopathika — Pricing Plans
          </h2>
          <p style={{ color: THEME.secondaryText, margin: 0 }}>
            Clinical-grade AI for practising homeopathic physicians —
            transparent pricing, enterprise options.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            margin: "22px 0",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              background: "white",
              borderRadius: 999,
              padding: 4,
              border: `1px solid ${THEME.border}`,
            }}
          >
            <button
              onClick={() => setFrequency("monthly")}
              aria-pressed={frequency === "monthly"}
              className="hp-btn hp-secondary"
              style={{
                borderRadius: 999,
                padding: "8px 14px",
                background:
                  frequency === "monthly"
                    ? "linear-gradient(90deg, rgba(106,90,205,0.12), rgba(147,112,219,0.08))"
                    : "transparent",
                color:
                  frequency === "monthly" ? THEME.primary : THEME.secondaryText,
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setFrequency("annual")}
              aria-pressed={frequency === "annual"}
              className="hp-btn hp-secondary"
              style={{
                borderRadius: 999,
                padding: "8px 14px",
                background:
                  frequency === "annual"
                    ? "linear-gradient(90deg, rgba(106,90,205,0.12), rgba(147,112,219,0.08))"
                    : "transparent",
                color:
                  frequency === "annual" ? THEME.primary : THEME.secondaryText,
              }}
            >
              Annual (2 months free)
            </button>
          </div>
        </div>

        <div className="plans-grid" style={{ marginTop: 8 }}>
          {plans.map((plan) => {
            const amount = getAmount(plan);
            const highlighted = plan.id === "pro";

            return (
              <div
                key={plan.id}
                className={`hp-card ${highlighted ? "hp-highlight" : ""}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 320,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          color: highlighted ? "#241a45" : THEME.primaryText,
                        }}
                      >
                        {plan.title}
                      </h3>
                      {highlighted && (
                        <div className="hp-badge">Most popular</div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: THEME.secondaryText,
                        marginTop: 6,
                      }}
                    >
                      {plan.id === "enterprise"
                        ? "Custom pricing for institutions"
                        : frequency === "monthly"
                          ? "Billed monthly"
                          : "Billed annually"}
                    </div>
                  </div>
                  {/* optional small savings hint */}
                  {amount && frequency === "annual" && (
                    <div style={{ textAlign: "right" }}>
                      <div className="hp-savings">Save 2 months</div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 18, flex: 1 }}>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>
                    {amount ? formatINR(amount) : "Contact"}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    {plan.bullets.map((b, i) => (
                      <div
                        key={i}
                        className="hp-feature"
                        style={{ marginBottom: 8 }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden
                        >
                          <path
                            d="M20 6L9 17l-5-5"
                            stroke={THEME.success}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div style={{ color: THEME.secondaryText }}>{b}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  {plan.id === "enterprise" ? (
                    <button
                      onClick={handleContactSales}
                      className="hp-btn hp-secondary"
                      style={{ width: "100%" }}
                    >
                      Contact Sales
                    </button>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={() => handlePayment(plan)}
                        disabled={loadingPlan === plan.id}
                        className="hp-btn hp-primary"
                        style={{ width: "100%" }}
                        aria-label={`Purchase ${plan.title} plan`}
                      >
                        {loadingPlan === plan.id
                          ? "Starting payment..."
                          : plan.cta}
                      </button>

                      {plan.id === "basic" && (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => setShowCreditsModal(true)}
                            className="hp-btn hp-secondary"
                            style={{ flex: 1 }}
                          >
                            Buy AI Credits
                          </button>
                          <button
                            onClick={async () => {
                              setLoadingPlan("basic_trial");
                              try {
                                const resp = await api.post(
                                  `${API_URL}/activate_trial`,
                                  { days: 14 },
                                  { timeout: 10000 }
                                );
                                if (resp?.data?.activated) {
                                  toast.success(
                                    "14-day AI trial activated. 20 free analyses credited."
                                  );
                                  window.dataLayer = window.dataLayer || [];
                                  window.dataLayer.push({
                                    event: "activate_trial",
                                    product: "basic_ai_trial",
                                  });
                                } else
                                  throw new Error("Trial activation failed");
                              } catch (err) {
                                console.error(err);
                                toast.error(
                                  "Could not activate trial. Please contact support."
                                );
                              } finally {
                                setLoadingPlan(null);
                              }
                            }}
                            className="hp-btn"
                            style={{
                              flex: 1,
                              background: "transparent",
                              border: `1px dashed ${THEME.border}`,
                              color: THEME.primaryText,
                            }}
                          >
                            Start 14-day AI trial
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Credits modal */}
        {showCreditsModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(2,6,23,0.45)",
              zIndex: 60,
            }}
          >
            <div className="hp-modal" style={{ width: 520 }}>
              <h4 style={{ margin: 0, color: THEME.primaryText }}>
                Buy AI Credits (pay-per-analysis)
              </h4>
              <p
                style={{
                  marginTop: 6,
                  color: THEME.secondaryText,
                  fontSize: 13,
                }}
              >
                Credits are charged at ₹50 per analysis. Useful for occasional
                AI usage without a Pro subscription.
              </p>

              <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
                <label
                  style={{
                    width: 80,
                    color: THEME.secondaryText,
                    fontSize: 13,
                  }}
                >
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={creditsQty}
                  onChange={(e) => setCreditsQty(Number(e.target.value))}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid ${THEME.border}`,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 12,
                  color: THEME.secondaryText,
                }}
              >
                <div>Total</div>
                <div style={{ fontWeight: 700 }}>
                  {formatINR(creditsQty * 50)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => setShowCreditsModal(false)}
                  className="hp-btn hp-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={purchaseCredits}
                  disabled={loadingCredits}
                  className="hp-btn hp-primary"
                  style={{ flex: 1 }}
                >
                  {loadingCredits ? "Starting..." : "Proceed to pay"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm modal */}
        {selectedPlanForConfirm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(2,6,23,0.45)",
              zIndex: 70,
            }}
          >
            <div className="hp-modal" style={{ width: 640 }}>
              <h4 style={{ margin: 0, color: THEME.primaryText }}>
                Confirm purchase
              </h4>
              <p
                style={{
                  marginTop: 10,
                  color: THEME.secondaryText,
                  fontSize: 13,
                }}
              >
                You are about to purchase the{" "}
                <strong>{selectedPlanForConfirm.title}</strong> plan —{" "}
                <strong>
                  {frequency === "monthly" ? "Monthly" : "Annual"}
                </strong>{" "}
                billing for{" "}
                <strong>{formatINR(getAmount(selectedPlanForConfirm))}</strong>.
                This will redirect you to the secure checkout page.
              </p>

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button
                  onClick={() => setSelectedPlanForConfirm(null)}
                  className="hp-btn hp-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndPay}
                  disabled={loadingPlan !== null}
                  className="hp-btn hp-primary"
                  style={{ flex: 1 }}
                >
                  {loadingPlan ? "Starting..." : "Proceed to Checkout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
