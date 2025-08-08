import React, { useState, useEffect, useContext } from "react";
import { Card, Row, Button, Form, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";
import { API_URL } from "../../constants";
import "react-confirm-alert/src/react-confirm-alert.css";
import api from "../../utility/api";
import Loader from "./Loader";
import { UserContext } from "../../contexts/UserContext";

const MeteriaMedica = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState("");
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // title: "",
    medicine_name: "",
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const { user, logout } = useContext(UserContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      const response = await api.post(
        `${API_URL}/ai/send_medicine_detail/${user?._id}`,
        { medicine_name: formData.medicine_name }
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

  const handleChange = () => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <Row className="justify-content-center">
      <Card>
        <div className="text-center mb-4 mt-4">
          <h4 className="fw-bold">{"Meteria medica"}</h4>
          <p className="text-muted">{"Meteria medica"}</p>
        </div>
        <Form onSubmit={handleSubmit}>
          <Form.Group as={Row} className="mb-3" controlId="formTitle">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Medicine:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="text"
                placeholder="Enter Remedy Name"
                name="medicine_name"
                value={formData.medicine_name}
                onChange={handleChange}
                isInvalid={!!errors.medicine_name}
              />
              <Form.Control.Feedback type="invalid">
                {errors.medicine_name}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>

          {/* <Form.Group as={Row} className="mb-3" controlId="formSubstanceUse">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              medicine ?
            </Form.Label>
            <Col sm={10}>
              {["name 1", "name 2", "name 3", "name 4", "name 5"].map(
                (option, idx) => (
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    label={option}
                    name="medicine"
                    value={option}
                    checked={formData.medicine?.includes(option)}
                    onChange={handleCheckboxChange}
                    id={`medicine-${idx}`}
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

        {user?.hit_count == 0 && (
          <p className="text-danger mt-2">
            You have reached your limit please recharge your limit.
          </p>
        )}
        {data && <p>{data}</p>}
      </Card>
    </Row>
  );
};

export default MeteriaMedica;
