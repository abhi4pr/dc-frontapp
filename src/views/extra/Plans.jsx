import React from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import api from "../../utility/api";
import { API_URL } from "../../constants";
import { toast } from "react-toastify";

const Plans = () => {
  const handlePayment = async (amount) => {
    try {
      const response = await api.post(`${API_URL}/create_payment`, { amount });
      if (response.data.checkoutPageUrl) {
        window.location.href = response.data.checkoutPageUrl;
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment initiation failed!");
    }
  };

  const plans = [
    { name: "Basic", price: 100, features: ["Feature 1", "Feature 2"] },
    {
      name: "Standard",
      price: 200,
      features: ["Feature 1", "Feature 2", "Feature 3"],
    },
    {
      name: "Premium",
      price: 300,
      features: ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
    },
  ];

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Choose Your Plan</h2>
      <Row className="justify-content-center">
        {plans.map((plan, index) => (
          <Col key={index} md={4} className="mb-4">
            <Card className="text-center shadow-sm">
              <Card.Body>
                <Card.Title className="fw-bold">{plan.name}</Card.Title>
                <h3 className="my-3">₹{plan.price}</h3>
                <ul className="list-unstyled mb-4">
                  {plan.features.map((feature, i) => (
                    <li key={i}>✅ {feature}</li>
                  ))}
                </ul>
                <Button
                  variant="primary"
                  onClick={() => handlePayment(plan.price)}
                >
                  Pay Now
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Plans;
