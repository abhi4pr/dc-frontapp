import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../../constants";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utility/api";

const Details = () => {
  const navigate = useNavigate();
  const { dietId } = useParams();
  const [formData, setFormData] = useState({
    title: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dietId) {
      api
        .get(`${API_URL}/cases/${dietId}`)
        .then((response) => {
          const { title, description, category, calories, image } =
            response.data.diet;
          setFormData({ title, description, category, image: null });
        })
        .catch((error) => {
          console.error("Error fetching diet data:", error);
          toast.error("Error fetching diet data.");
        });
    }
  }, [dietId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  };

  return (
    <Row className="justify-content-center">
      <Card>
        <div className="text-center mb-4 mt-4">
          <h4 className="fw-bold">{"Case details"}</h4>
          <p className="text-muted">{"Case details"}</p>
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
                disabled
              />
              <Form.Control.Feedback type="invalid">
                {errors.title}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>
        </Form>
      </Card>
    </Row>
  );
};

export default Details;
