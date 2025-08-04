import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../../constants';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utility/api';
import { jwtDecode } from 'jwt-decode';

const Post = () => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const [formData, setFormData] = useState({
    // user_name: '',
    title: '',
    content: '',
    category: '',
    images: [],
    user: ''
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [idFromToken, setIdFromToken] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded?.id) {
          setIdFromToken(decoded.id);
        }
      } catch (error) {
        console.error('Failed to decode token', error);
      }
    }

    if (postId) {
      api
        .get(`${API_URL}/posts/${postId}`)
        .then((response) => {
          const { user, title, content, images, category } = response.data.post;
          setFormData((prev) => ({
            ...prev,
            user: user?.id,
            title,
            content,
            category,
            images: [] // empty images so the user can re-upload if needed
          }));
          setImagePreviews(images || []);
        })
        .catch((error) => {
          console.error('Error fetching post data:', error);
          toast.error('Error fetching post data.');
        });
    }
  }, [postId]);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Post title is required';
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Post message is required';
    }
    if (!postId && imagePreviews.length === 0) {
      newErrors.images = 'At least one image is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    const totalImages = imagePreviews.length + files.length;

    if (totalImages > 3) {
      toast.error('You can upload a maximum of 3 images.');
      return;
    }

    const newImagePreviews = [...imagePreviews];
    const newImages = [...formData.images];

    for (let file of files) {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImagePreviews.push(reader.result);
        setImagePreviews([...newImagePreviews]);
      };
      reader.readAsDataURL(file);
      newImages.push(file);
    }

    setFormData({ ...formData, images: newImages });
  };

  const removeImage = (index) => {
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    const updatedFiles = formData.images.filter((_, i) => i !== index);
    setImagePreviews(updatedPreviews);
    setFormData({ ...formData, images: updatedFiles });
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
    data.append('content', formData.content);
    data.append('category', formData.category);
    data.append('user', idFromToken);

    // Append images as an array
    formData.images.forEach((img, i) => {
      data.append(`images`, img);
    });

    try {
      if (postId) {
        await api.put(`${API_URL}/posts/${postId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Post updated successfully!');
      } else {
        await api.post(`${API_URL}/posts/add-post/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Post added successfully!');
      }
      navigate('/posts');
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit post.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row className="justify-content-center">
      <Card className="p-4">
        <div className="text-center mb-4">
          <h4 className="fw-bold">{postId ? 'Edit Post' : 'Add Post'}</h4>
          <p className="text-muted">{postId ? 'Edit the post details' : 'Add a new post'}</p>
        </div>
        <Form onSubmit={handleSubmit}>
          {/* Title */}
          <Form.Group as={Row} className="mb-3" controlId="formPostTitle">
            <Form.Label column sm={2} style={{ textAlign: 'right' }}>
              Post Title:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                type="text"
                placeholder="Enter post title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                isInvalid={!!errors.title}
              />
              <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
            </Col>
          </Form.Group>

          {/* Content */}
          <Form.Group as={Row} className="mb-3" controlId="formPostContent">
            <Form.Label column sm={2} style={{ textAlign: 'right' }}>
              Post Message:
            </Form.Label>
            <Col sm={10}>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter post message"
                name="content"
                value={formData.content}
                onChange={handleChange}
                isInvalid={!!errors.content}
              />
              <Form.Control.Feedback type="invalid">{errors.content}</Form.Control.Feedback>
            </Col>
          </Form.Group>

          {/* Category */}
          <Form.Group as={Row} className="mb-3" controlId="formCategory">
            <Form.Label column sm={2} style={{ textAlign: 'right' }}>
              Category:
            </Form.Label>
            <Col sm={10}>
              <Form.Control as="select" name="category" value={formData.category} onChange={handleChange} isInvalid={!!errors.category}>
                <option value="">Select a category</option>
                <option value="Default">Default</option>
                <option value="Health">Health</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
              </Form.Control>
              <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
            </Col>
          </Form.Group>

          {/* Image Upload */}
          <Form.Group as={Row} className="mb-3" controlId="formImages">
            <Form.Label column sm={2} style={{ textAlign: 'right' }}>
              Images:
            </Form.Label>
            <Col sm={10}>
              <Form.Control type="file" multiple accept="image/*" onChange={handleImageChange} isInvalid={!!errors.images} />
              <Form.Control.Feedback type="invalid">{errors.images}</Form.Control.Feedback>
              <div className="d-flex gap-2 mt-3 flex-wrap">
                {imagePreviews.map((preview, index) => (
                  <div key={index} style={{ position: 'relative', width: '100px', height: '100px' }}>
                    <img
                      src={preview}
                      alt={`preview-${index}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '5px',
                        border: '1px solid #ddd'
                      }}
                    />
                    <span
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: 'red',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        textAlign: 'center',
                        lineHeight: '20px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}
                    >
                      &times;
                    </span>
                  </div>
                ))}
              </div>
            </Col>
          </Form.Group>

          {/* Submit / Cancel */}
          <Form.Group as={Row} className="mb-3">
            <Col sm={{ span: 10, offset: 2 }} className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Submitting...' : postId ? 'Update' : 'Submit'}
              </Button>
              <Button type="button" variant="danger" onClick={() => navigate('/posts')}>
                Cancel
              </Button>
            </Col>
          </Form.Group>
        </Form>
      </Card>
    </Row>
  );
};

export default Post;
