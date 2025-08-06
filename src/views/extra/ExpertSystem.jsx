import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../../constants";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utility/api";

const ExpertSystem = () => {
  const navigate = useNavigate();
  const { dietId } = useParams();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    calories: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill all required fields.");
      return;
    }
    setLoading(true);

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("calories", formData.calories);
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      if (dietId) {
        await api.put(`${API_URL}/diets/${dietId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Diet updated successfully!");
      } else {
        await api.post(`${API_URL}/diets/`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Diet added successfully!");
      }
      navigate("/diets");
    } catch (error) {
      console.error("Error submitting form:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to add Diet.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row className="justify-content-center">
      <Card>
        <div className="text-center mb-4 mt-4">
          <h4 className="fw-bold">{"Compare experts"}</h4>
          <p className="text-muted">{"Compare experts"}</p>
        </div>
        <Form.Group as={Row} className="mb-3 align-items-center">
          <Col sm={5}>
            <Form.Label>Select Doctor</Form.Label>
            <Form.Control as="select" name="leftSelect" onChange={handleChange}>
              <option value="">Select an option</option>
              <option value="Samuel Hahnemann">Samuel Hahnemann</option>
              <option value="Constantine Hering">Constantine Hering</option>
              <option value="James Tyler Kent">James Tyler Kent</option>
              <option value="C.M.F. Boenninghausen">
                C.M.F. Boenninghausen
              </option>
              <option value="Adolph Lippe">Adolph Lippe</option>
              <option value="H.N. Guernsey">H.N. Guernsey</option>
              <option value="E.A. Farrington">E.A. Farrington</option>
              <option value="Richard Hughes">Richard Hughes</option>
              <option value="J.H. Clarke">J.H. Clarke</option>
              <option value="Margaret Tyler">Margaret Tyler</option>
              <option value="William Boericke">William Boericke</option>
              <option value="G.B. Nash">G.B. Nash</option>
              <option value="Frederik Schroyens">Frederik Schroyens</option>
              <option value="George Vithoulkas">George Vithoulkas</option>
              <option value="Rajesh Shah">Rajesh Shah</option>
              <option value="Farokh Master">Farokh Master</option>
              <option value="Rajan Sankaran">Rajan Sankaran</option>
              <option value="Prafull Vijayakar">Prafull Vijayakar</option>
              <option value="Luc De Schepper">Luc De Schepper</option>
              <option value="Robin Murphy">Robin Murphy</option>
            </Form.Control>
          </Col>

          <Col sm={1} className="text-center">
            <div style={{ borderLeft: "2px solid #ccc", height: "100%" }} />
          </Col>

          <Col sm={5}>
            <Form.Label>Select Doctor</Form.Label>
            <Form.Control
              as="select"
              name="rightSelect"
              onChange={handleChange}
            >
              <option value="">Select an option</option>
              <option value="Samuel Hahnemann">Samuel Hahnemann</option>
              <option value="Constantine Hering">Constantine Hering</option>
              <option value="James Tyler Kent">James Tyler Kent</option>
              <option value="C.M.F. Boenninghausen">
                C.M.F. Boenninghausen
              </option>
              <option value="Adolph Lippe">Adolph Lippe</option>
              <option value="H.N. Guernsey">H.N. Guernsey</option>
              <option value="E.A. Farrington">E.A. Farrington</option>
              <option value="Richard Hughes">Richard Hughes</option>
              <option value="J.H. Clarke">J.H. Clarke</option>
              <option value="Margaret Tyler">Margaret Tyler</option>
              <option value="William Boericke">William Boericke</option>
              <option value="G.B. Nash">G.B. Nash</option>
              <option value="Frederik Schroyens">Frederik Schroyens</option>
              <option value="George Vithoulkas">George Vithoulkas</option>
              <option value="Rajesh Shah">Rajesh Shah</option>
              <option value="Farokh Master">Farokh Master</option>
              <option value="Rajan Sankaran">Rajan Sankaran</option>
              <option value="Prafull Vijayakar">Prafull Vijayakar</option>
              <option value="Luc De Schepper">Luc De Schepper</option>
              <option value="Robin Murphy">Robin Murphy</option>
            </Form.Control>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Col sm={12}>
            <Form.Label>Patient Symptoms</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="description"
              placeholder="Enter Patient Symptoms"
              value={formData.description}
              onChange={handleChange}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Col sm={12} className="text-end">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </Col>
        </Form.Group>
      </Card>
    </Row>
  );
};

export default ExpertSystem;
