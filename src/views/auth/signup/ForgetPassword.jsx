import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, Row, Col, Spinner } from "react-bootstrap";
import { UserContext } from "../../../contexts/UserContext";
import axios from "axios";
import Breadcrumb from "../../../layouts/AdminLayout/Breadcrumb";
import { API_URL } from "../../../constants";
import { toast } from "react-toastify";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { login } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  const handleForget = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/forget_password`, {
        email,
      });
      toast.success(
        "Email Sent, Please check your email for reset your password"
      );
      navigate("/app/dashboard");
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error("Email not exist in our database");
      }
      console.error("Login error:", error);
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
                  <h4 className="mb-3 f-w-400">Doctor's Forget Password</h4>

                  <div className="input-group mb-3">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn btn-primary btn-block mb-4"
                    onClick={handleForget}
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
                        Checking in...
                      </>
                    ) : (
                      "Get Password"
                    )}
                  </button>
                  <br />
                  <Link to="/auth/register" className="">
                    Register
                  </Link>
                  <br />
                  <Link to="/auth/login" className="">
                    Signin
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

export default ForgetPassword;
