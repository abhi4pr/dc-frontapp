import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col } from 'react-bootstrap';

import axios from 'axios';
import Breadcrumb from '../../../layouts/AdminLayout/Breadcrumb';
import { API_URL } from '../../../constants';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { token } = response.data;
      localStorage.setItem('token', token);
      alert('Login successful');
      navigate('/app/dashboard');
    } catch (error) {
      if (error.response && error.response.data) {
        alert(error.response.data.message || 'Invalid email or password.');
      } else {
        alert('An error occurred during login.');
      }
      console.error('Login error:', error);
    }
  };

  return (
    <React.Fragment>
      <Breadcrumb />
      <div className="auth-wrapper">
        <div className="auth-content text-center">
          <Card className="borderless">
            <Row className="align-items-center text-center">
              <Col>
                <Card.Body className="card-body">

                  <h4 className="mb-3 f-w-400">Login</h4>

                  <div className="input-group mb-3">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="input-group mb-4">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button className="btn btn-primary btn-block mb-4" onClick={handleLogin}>Login</button>

                </Card.Body>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Login;
