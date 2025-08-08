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
import { toast } from "react-toastify";

const LabReports = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState("");
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    report: null,
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const { user } = useContext(UserContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);

      const form = new FormData();
      form.append("title", formData.title);
      form.append("description", formData.description);
      if (formData.report) {
        form.append("report", formData.report);
      }

      const response = await api.post(
        `${API_URL}/ai/send_ai_report/${user?._id}`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setData(response.data.data);
      toast.success("Report submitted successfully");
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "An error occurred.");
      } else {
        toast.error("An error occurred.");
      }
      console.error("Submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = () => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData({ ...formData, report: file });
    }
  };

  return (
    <Row className="justify-content-center">
      <Card>
        <div className="text-center mb-4 mt-4">
          <h4 className="fw-bold">{"Upload report"}</h4>
          <p className="text-muted">{"upload report"}</p>
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

          <Form.Group as={Row} className="mb-3" controlId="formDescription">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Description:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="text"
                placeholder="Enter description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formImage">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Report image:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="file"
                name="report"
                accept="image/*"
                onChange={handleImageChange}
                // isInvalid={!!errors.image}
              />
              <Form.Control.Feedback type="invalid">
                {errors.image}
              </Form.Control.Feedback>
            </Col>
            <Col sm={2}></Col>
            <Col sm={3} className="mt-3">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "5px",
                    border: "1px solid #ddd",
                  }}
                />
              )}
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Col sm={{ span: 10, offset: 2 }} className="d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || user?.hit_count == 0}
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
      </Card>
      {data && <p>{data}</p>}
    </Row>
  );
};

export default LabReports;
