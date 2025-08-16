// src/pages/payment/redirect.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function PaymentRedirect() {
    const [params] = useSearchParams();
    const [status, setStatus] = useState("Checking...");

    useEffect(() => {
        // PhonePe will send you back (POST/GET depending on redirectMode). For simplicity,
        // also poll server status in case you land here without rich params.
        const merchantTransactionId =
            params.get("transactionId") || localStorage.getItem("last_txn");

        async function poll() {
            if (!merchantTransactionId) { setStatus("No transaction"); return; }
            const r = await fetch(`${API_URL}/payments/status/${merchantTransactionId}`);
            const d = await r.json();
            setStatus(d.status || "PENDING");
        }
        poll();
    }, [params]);

    return <div>Payment Status: {status}</div>;
}
