import React, { useState, useEffect, useContext } from "react";
import { Card, Row, Button, Form, Col } from "react-bootstrap";
import "react-confirm-alert/src/react-confirm-alert.css";
import api from "../../utility/api";
import Loader from "./Loader";
import { toast } from "react-toastify";
import { API_URL } from "constants";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext";

const RemedySuggestion = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    disease: "",
  });
  const [errors, setErrors] = useState({});
  const [data, setData] = useState({});
  const navigate = useNavigate();
  const { user, logout } = useContext(UserContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const response = await api.post(
        `${API_URL}/ai/send_search_remedy/${user?._id}`,
        { disease: formData.disease }
      );
      setData(response.data.data);
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "An error occurred.");
      } else {
        toast.error("An error occurred.");
      }
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <Row className="justify-content-center">
      <Card>
        <div className="text-center mb-4 mt-4">
          <h4 className="fw-bold">{"Remedy Suggestion"}</h4>
          <p className="text-muted">{"Remedy Suggestion"}</p>
        </div>
        <Form onSubmit={handleSubmit}>
          <Form.Group as={Row} className="mb-3" controlId="formTitle">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Title:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="text"
                placeholder="Enter title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                isInvalid={!!errors.title}
              />
              <Form.Control.Feedback type="invalid">
                {errors.title}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Col sm={{ span: 10, offset: 2 }} className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => navigate("/app/dashboard")}
              >
                Cancel
              </Button>
            </Col>
          </Form.Group>
        </Form>
        {data && <p>{data?.show}</p>}
      </Card>
    </Row>
  );
};

export default RemedySuggestion;
