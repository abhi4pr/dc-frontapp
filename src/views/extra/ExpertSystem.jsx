import React, { useState, useEffect, useContext } from "react";
import { Card, Row, Col, Form, Button } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import { API_URL } from "../../constants";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utility/api";
import { UserContext } from "../../contexts/UserContext";

const ExpertSystem = () => {
  const navigate = useNavigate();
  const { dietId } = useParams();
  const [formData, setFormData] = useState({
    dr1: "",
    dr2: "",
    symptoms: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { user, logout } = useContext(UserContext);
  const [data, setData] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.dr1 == formData.dr2) {
      toast.error("Doctor 1 and Doctor 2 must be different.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        `${API_URL}/ai/send_compare_data/${user?._id}`,
        { dr1: formData.dr1, dr2: formData.dr2, symptoms: formData.symptoms }
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

  return (
    <Row className="justify-content-center">
      <Card>
        <div className="text-center mb-4 mt-4">
          <h4 className="fw-bold">{"Compare experts"}</h4>
          <p className="text-muted">{"Compare experts"}</p>
        </div>
        <Form onSubmit={handleSubmit}>
          <Form.Group
            as={Row}
            className="mb-3 align-items-center"
            // onSubmit={handleSubmit}
          >
            <Col sm={5}>
              <Form.Label>Select Doctor</Form.Label>
              <Form.Control as="select" name="dr1" onChange={handleChange}>
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
              <Form.Control as="select" name="dr2" onChange={handleChange}>
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
                name="symptoms"
                placeholder="Enter Patient Symptoms"
                value={formData.symptoms}
                onChange={handleChange}
              />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Col sm={12} className="text-end">
              <Button
                type="submit"
                variant="primary"
                disabled={loading || user?.hit_count == 0}
              >
                {loading ? "Submitting..." : "Submit"}
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

export default ExpertSystem;
