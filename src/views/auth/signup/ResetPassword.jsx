import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import axios from "axios";
import Breadcrumb from "../../../layouts/AdminLayout/Breadcrumb";
import { API_URL } from "../../../constants";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from query string
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset_password`, {
        token,
        newPassword,
      });

      toast.success("Password reset successful! Please Re-login.");
      navigate("/auth/login");
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "Failed to reset password");
      } else {
        toast.error("Something went wrong");
      }
      console.error("Reset password error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      <Breadcrumb />
      <div className="auth-wrapper">
        <div className="auth-content text-center">
          <Card className="borderless">
            <Row className="align-items-center text-center">
              <Col>
                <Card.Body className="card-body">
                  <h4 className="mb-3 f-w-400">Reset Your Password</h4>

                  <div className="input-group mb-3">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="input-group mb-3">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn btn-primary btn-block mb-4"
                    onClick={handleReset}
                    disabled={loading}
                  >
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
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                  <br />
                  <Link to="/auth/login" className="">
                    Back to Sign In
                  </Link>
                </Card.Body>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ResetPassword;
