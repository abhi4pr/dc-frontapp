import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../../constants';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utility/api';

const Repertory = () => {
  const navigate = useNavigate();
  const { bookId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Default',
    pdfFile: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const categories = [
    'Default',
    'Fiction',
    'Non-Fiction',
    'Science',
    'History',
    'Biography',
    'Fantasy',
    'Mystery',
    'Romance',
    'Self-Help',
    'Health & Wellness'
  ];

  useEffect(() => {
    if (bookId) {
      api
        .get(`${API_URL}/books/${bookId}`)
        .then((response) => {
          const { name, description, category, pdfFile } = response.data;
          setFormData({ name, description, category, pdfFile: null });
          setImagePreview(`${pdfFile}`);
        })
        .catch((error) => {
          console.error('Error fetching book data:', error);
          toast.error('Error fetching book data.');
        });
    }
  }, [bookId]);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Title is required';
    }
    if (!bookId && !formData.category) {
      newErrors.category = 'category is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
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
      setFormData({ ...formData, pdfFile: file });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill all required fields.');
      return;
    }
    setLoading(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('category', formData.category);
    if (formData.pdfFile) {
      data.append('pdfFile', formData.pdfFile);
    }

    try {
      if (bookId) {
        await api.put(`${API_URL}/books/${bookId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Book updated successfully!');
      } else {
        await api.post(`${API_URL}/books/add-book`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Book added successfully!');
      }
      navigate('/books');
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit books.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row className="justify-content-center">
      <Card>
        <div className="text-center mb-4 mt-4">
          <h4 className="fw-bold">{bookId ? 'Edit book' : 'Add book'}</h4>
          <p className="text-muted">{bookId ? 'Edit the book details' : 'Add a new book'}</p>
        </div>
        <Form onSubmit={handleSubmit}>
          <Form.Group as={Row} className="mb-3" controlId="formTitle">
            <Form.Label column sm={2} style={{ textAlign: 'right' }}>
              Title:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="text"
                placeholder="Enter title"
                name="name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
              />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formDescription">
            <Form.Label column sm={2} style={{ textAlign: 'right' }}>
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

          <Form.Group as={Row} className="mb-3" controlId="formCategory">
            <Form.Label column sm={2} style={{ textAlign: 'right' }}>
              Category:
            </Form.Label>
            <Col sm={10}>
              <Form.Select name="category" value={formData.category} onChange={handleChange} isInvalid={!!errors.category}>
                <option value="">Select Category</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formImage">
            <Form.Label column sm={2} style={{ textAlign: 'right' }}>
              Pdf file:
            </Form.Label>
            <Col sm={10}>
              <Form.Control type="file" name="pdfFile" accept="application/pdf" onChange={handleImageChange} isInvalid={!!errors.image} />
              <Form.Control.Feedback type="invalid">{errors.pdfFile}</Form.Control.Feedback>
            </Col>
            <Col sm={2}></Col>
            <Col sm={3} className="mt-3">
              {imagePreview && (
                <iframe
                  src={imagePreview}
                  title="PDF Preview"
                  style={{
                    width: '100%',
                    height: '400px',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                />
              )}
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Col sm={{ span: 10, offset: 2 }} className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Submitting...' : bookId ? 'Update' : 'Submit'}
              </Button>
              <Button type="button" variant="danger" onClick={() => navigate('/rewards')}>
                Cancel
              </Button>
            </Col>
          </Form.Group>
        </Form>
      </Card>
    </Row>
  );
};

export default Repertory;
