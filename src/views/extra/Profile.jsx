import React, { useState, useEffect, useContext } from "react";
import { Card, Row, Button, Form, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../constants";
import "react-confirm-alert/src/react-confirm-alert.css";
import api from "../../utility/api";
import Loader from "./Loader";
import { UserContext } from "../../contexts/UserContext";

const Profile = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    hit_count: 0,
    hit_limit: 0,
    profile_pic: null,
  });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        address: user.address || "",
        phone: user.phone || "",
        hit_count: user?.hit_count || 0,
        hit_limit: user?.hit_limit || 0,
        profile_pic: user?.profile_pic,
      });
      setImagePreview(user.profile_pic ? `${user.profile_pic}` : null);
    }
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);

      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("address", formData.address);
      payload.append("phone", formData.phone);
      if (formData.profile_pic) {
        payload.append("profile_pic", formData.profile_pic);
      }

      const response = await api.put(
        `${API_URL}/users/update_user/${user?._id}`,
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setData(response.data.data);
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error(error.response.data.message || "An error occurred.");
      } else {
        toast.error("An error occurred.");
      }
      console.error("Profile update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData({ ...formData, profile_pic: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <Row className="justify-content-center">
      <Card>
        <div className="text-center mb-4 mt-4">
          <h4 className="fw-bold">Profile</h4>
          <p className="text-muted">Update your profile information</p>
        </div>
        <Form onSubmit={handleSubmit}>
          {/* Profile Picture */}
          <Form.Group as={Row} className="mb-3" controlId="formProfilePic">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Profile Picture:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview}
                    alt="Profile Preview"
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "8px",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
            </Col>
          </Form.Group>

          {/* Name */}
          <Form.Group as={Row} className="mb-3" controlId="formName">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Name:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="text"
                placeholder="Enter name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
              />
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>

          {/* Email */}
          <Form.Group as={Row} className="mb-3" controlId="formEmail">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Email:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="text"
                placeholder="Enter email"
                name="email"
                value={formData.email}
                disabled
              />
            </Col>
          </Form.Group>

          {/* Address */}
          <Form.Group as={Row} className="mb-3" controlId="formAddress">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Address:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="text"
                placeholder="Enter address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                isInvalid={!!errors.address}
              />
              <Form.Control.Feedback type="invalid">
                {errors.address}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>

          {/* Phone */}
          <Form.Group as={Row} className="mb-3" controlId="formPhone">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Phone:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="text"
                placeholder="Enter phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                isInvalid={!!errors.phone}
              />
              <Form.Control.Feedback type="invalid">
                {errors.phone}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formPhone">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Hit Counts:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="number"
                placeholder="Hit counts"
                name="hit_count"
                value={formData.hit_count}
                onChange={handleChange}
                disabled
              />
              <Form.Control.Feedback type="invalid">
                {errors.hit_count}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formPhone">
            <Form.Label column sm={2} style={{ textAlign: "right" }}>
              Hit Limit:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="number"
                placeholder="Hit limit"
                name="hit_limit"
                value={formData.hit_limit}
                onChange={handleChange}
                disabled
              />
              <Form.Control.Feedback type="invalid">
                {errors.hit_limit}
              </Form.Control.Feedback>
            </Col>
          </Form.Group>

          {/* Buttons */}
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
              <Button
                type="button"
                variant="success"
                onClick={() => navigate("/plans")}
              >
                Upgrade Your Plan
              </Button>
            </Col>
          </Form.Group>
        </Form>
      </Card>
    </Row>
  );
};

export default Profile;
