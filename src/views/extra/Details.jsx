import React, { useState, useEffect } from "react";
import { Card, Row, Col, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { API_URL } from "../../constants";
import { useParams } from "react-router-dom";
import api from "../../utility/api";

const Details = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      api
        .get(`${API_URL}/cases/single_post/${id}`)
        .then((response) => {
          setFormData(response.data.post || {});
        })
        .catch((error) => {
          console.error("Error fetching case data:", error);
          toast.error("Error fetching case data.");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <Row className="justify-content-center mt-5">
        <Spinner animation="border" />
      </Row>
    );
  }

  return (
    <Row className="justify-content-center">
      <Card className="p-4">
        <div className="text-center mb-4">
          <h4 className="fw-bold">Case Details</h4>
          <p className="text-muted">Complete case information</p>
        </div>

        {Object.keys(formData).length === 0 ? (
          <p className="text-center text-muted">No case data available</p>
        ) : (
          <Form>
            {Object.entries(formData).map(([key, value]) => (
              <Form.Group as={Row} className="mb-3" key={key}>
                <Form.Label column sm={3} style={{ textAlign: "right" }}>
                  {key.replace(/_/g, " ")}:
                </Form.Label>
                <Col sm={9}>
                  <Form.Control
                    type="text"
                    value={
                      Array.isArray(value) ? value.join(", ") : value ?? ""
                    }
                    readOnly
                  />
                </Col>
              </Form.Group>
            ))}
          </Form>
        )}
      </Card>
    </Row>
  );
};

export default Details;
