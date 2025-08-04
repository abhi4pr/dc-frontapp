import React, { useState, useEffect } from "react";
import { Card, Row, Button, Form, Col } from "react-bootstrap";
import "react-confirm-alert/src/react-confirm-alert.css";
import api from "../../utility/api";
import Loader from "./Loader";

const RemedySuggestion = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 10;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    // image: null,
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  const handleSubmit = () => {};

  const handleChange = () => {
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
                onClick={() => navigate("/diets")}
              >
                Cancel
              </Button>
            </Col>
          </Form.Group>
        </Form>
      </Card>
    </Row>
  );
};

export default RemedySuggestion;
