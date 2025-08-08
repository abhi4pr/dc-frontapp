import React, { useState, useEffect, useContext } from "react";
import { Card, Row, Button, Form, Col } from "react-bootstrap";
import "react-confirm-alert/src/react-confirm-alert.css";
import api from "../../utility/api";
import Loader from "./Loader";
import { toast } from "react-toastify";
import { API_URL } from "constants";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext";

const Repertory = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState("");
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    disease: "",
  });
  const [errors, setErrors] = useState({});
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
          <h4 className="fw-bold">{"Repertory"}</h4>
          <p className="text-muted">{"repertory"}</p>
        </div>
        <Form onSubmit={handleSubmit}>
          <Form.Group as={Row} className="mb-3" controlId="formTitle">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Symptom:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="text"
                placeholder="Seach Problem"
                name="disease"
                value={formData.disease}
                onChange={handleChange}
                isInvalid={!!errors.disease}
              />
              <Form.Control.Feedback type="invalid">
                {errors.disease}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>

          {/* <Form.Group as={Row} className="mb-3" controlId="formSubstanceUse">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Doctor?
            </Form.Label>
            <Col sm={10}>
              {["name 1", "name 2", "name 3", "name 4", "name 5"].map(
                (option, idx) => (
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    label={option}
                    name="doctor"
                    value={option}
                    checked={formData.doctor?.includes(option)}
                    onChange={handleCheckboxChange}
                    id={`doctor-${idx}`}
                  />
                )
              )}
            </Col>
          </Form.Group> */}

          <Form.Group as={Row} className="mb-3">
            <Col sm={{ span: 10, offset: 2 }} className="d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || user.hit_count == 0}
              >
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
        {user?.hit_count === 0 && (
          <p className="text-danger mt-2">
            You have reached your limit please recharge your limit.
          </p>
        )}
        {data && <p>{data}</p>}
      </Card>
    </Row>
  );
};

export default Repertory;
