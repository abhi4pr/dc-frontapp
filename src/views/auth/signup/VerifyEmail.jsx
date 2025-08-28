import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card, Spinner } from "react-bootstrap";
import axios from "axios";
import { API_URL } from "../../../constants";
import { toast } from "react-toastify";
import Breadcrumb from "../../../layouts/AdminLayout/Breadcrumb";

const VerifyEmail = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const token = new URLSearchParams(location.search).get('token'); // Get token from URL query params

    useEffect(() => {
        if (!token) {
            toast.error("No token provided.");
            navigate("/auth/login"); // Redirect to login if no token
        }
    }, [token, navigate]);

    const handleVerifyEmail = async () => {
        if (!token) return;

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/verify_email`, { token });
            toast.success(response.data.message);
            navigate("/auth/login"); // Redirect to login after successful verification
        } catch (error) {
            setError(error.response?.data?.message || "An error occurred.");
            toast.error(error.response?.data?.message || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            handleVerifyEmail();
        }
    }, [token]);

    return (
        <>
            <Breadcrumb />
            <div className="center">
                <section className="shell" aria-live="polite">
                    {/* LEFT — Brand/Trust */}
                    <aside className="hero" aria-label="Homeopathika email verification">
                        <span className="badge">Email Verification</span>
                        <div className="logo" aria-hidden="true">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M7.5 7.5l1-1h7l1 1h2A2.5 2.5 0 0 1 21 10v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17v-7A2.5 2.5 0 0 1 5.5 7.5h2z"
                                    stroke="#3b82f6"
                                    strokeWidth="1.5"
                                />
                                <circle
                                    cx="12"
                                    cy="14"
                                    r="3.2"
                                    stroke="#8b5cf6"
                                    strokeWidth="1.5"
                                />
                            </svg>
                        </div>
                        <h1>Homeopathika™</h1>
                        <p>Secure Doctor Access</p>
                        <div className="trust">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M6 11l4 4 8-8"
                                    stroke="#22d3ee"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span>Clinically curated · PHI-safe</span>
                        </div>
                    </aside>

                    {/* RIGHT — Verification Status */}
                    <div className="form">
                        <div className="label">Verification Status</div>
                        <div className="field" style={{ padding: "20px", textAlign: "center" }}>
                            {loading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    {error ? (
                                        <div style={{ color: "red", fontWeight: "bold" }}>
                                            {error}
                                        </div>
                                    ) : (
                                        <div style={{ color: "green", fontWeight: "bold" }}>
                                            Your email has been successfully verified!
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="row-inline">
                            <span>
                                <Link className="link" to="/auth/login">
                                    Go to Login
                                </Link>
                            </span>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
};

export default VerifyEmail;
