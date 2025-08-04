import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../../constants';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utility/api';

const ExpertSystem = () => {
    const navigate = useNavigate();
    const { dietId } = useParams();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        calories: '',
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (dietId) {
            api
                .get(`${API_URL}/diets/${dietId}`)
                .then((response) => {
                    const { title, description, category, calories, image } = response.data.diet;
                    setFormData({ title, description, category, image: null });
                    setImagePreview(`${image}`);
                })
                .catch((error) => {
                    console.error('Error fetching diet data:', error);
                    toast.error('Error fetching diet data.');
                });
        }
    }, [dietId]);

    const validateForm = () => {
        let newErrors = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }
        if (!formData.calories.trim()) {
            newErrors.calories = 'calories is required';
        }
        if (!dietId && !formData.image) {
            newErrors.image = 'diet image is required';
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
            setFormData({ ...formData, image: file });
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
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('calories', formData.calories);
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            if (dietId) {
                await api.put(`${API_URL}/diets/${dietId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Diet updated successfully!');
            } else {
                await api.post(`${API_URL}/diets/`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Diet added successfully!');
            }
            navigate('/diets');
        } catch (error) {
            console.error('Error submitting form:', error);
            const errorMessage = error.response?.data?.message || 'Failed to add Diet.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Row className="justify-content-center">
            <Card>
                <div className="text-center mb-4 mt-4">
                    <h4 className="fw-bold">{dietId ? 'Edit Diet' : 'Add Diet'}</h4>
                    <p className="text-muted">{dietId ? 'Edit the Diet details' : 'Add a new Diet'}</p>
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
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                isInvalid={!!errors.title}
                            />
                            <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
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
                            <Form.Control as="select" name="category" value={formData.category} onChange={handleChange} isInvalid={!!errors.category}>
                                <option value="">Select a category</option>
                                <option value="General">General</option>
                                <option value="Indian Recipes">Indian Recipes</option>
                                <option value="Grains">Grains</option>
                                <option value="Vegetables">Vegetables</option>
                                <option value="Fruits Dairy">Fruits Dairy</option>
                                <option value="Veg">Veg</option>
                                <option value="Non-veg">Non-veg</option>
                                <option value="Satvik food">Satvik food</option>
                                <option value="Special Drinks">Special Drinks</option>
                            </Form.Control>
                            <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="mb-3" controlId="formTitle">
                        <Form.Label column sm={2} style={{ textAlign: 'right' }}>
                            Calories:
                        </Form.Label>
                        <Col sm={10}>
                            <Form.Control
                                type="number"
                                placeholder="Enter calories"
                                name="calories"
                                value={formData.calories}
                                onChange={handleChange}
                                isInvalid={!!errors.calories}
                            />
                            <Form.Control.Feedback type="invalid">{errors.calories}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="mb-3" controlId="formImage">
                        <Form.Label column sm={2} style={{ textAlign: 'right' }}>
                            image:
                        </Form.Label>
                        <Col sm={10}>
                            <Form.Control
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={handleImageChange}
                            // isInvalid={!!errors.image}
                            />
                            <Form.Control.Feedback type="invalid">{errors.image}</Form.Control.Feedback>
                        </Col>
                        <Col sm={2}></Col>
                        <Col sm={3} className="mt-3">
                            {imagePreview && (
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        objectFit: 'cover',
                                        borderRadius: '5px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                            )}
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="mb-3">
                        <Col sm={{ span: 10, offset: 2 }} className="d-flex gap-2">
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Submitting...' : dietId ? 'Update' : 'Submit'}
                            </Button>
                            <Button type="button" variant="danger" onClick={() => navigate('/diets')}>
                                Cancel
                            </Button>
                        </Col>
                    </Form.Group>
                </Form>
            </Card>
        </Row>
    );
};

export default ExpertSystem;
