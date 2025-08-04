import React, { useState } from "react";
import { Card, Row, Col, Form } from "react-bootstrap";

// Example static data
const staticData = [
  {
    id: 1,
    title: "Case 1: abhi sharma",
    description: "Patient reports chest pain for the past 3 days.",
    category: "Cardiology",
  },
  {
    id: 2,
    title: "Case 2: rahit naya",
    description: "Recurring headaches with nausea and sensitivity to light.",
    category: "Neurology",
  },
  {
    id: 3,
    title: "Case 3: gagan flick",
    description: "Fever and fatigue, possibly viral infection.",
    category: "General Medicine",
  },
];

const PatientCases = () => {
  const [search, setSearch] = useState("");

  // Filter data based on search term
  const filteredData = staticData.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Row className="justify-content-center">
      <Col md={10}>
        <Form.Control
          type="text"
          placeholder="Search patient cases..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="my-4"
        />

        {filteredData.map((item) => (
          <Card key={item.id} className="mb-3 w-100">
            <Card.Body>
              <Card.Title>{item.title}</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">
                {item.category}
              </Card.Subtitle>
              <Card.Text>{item.description}</Card.Text>
            </Card.Body>
          </Card>
        ))}

        {filteredData.length === 0 && (
          <p className="text-center text-muted">No results found.</p>
        )}
      </Col>
    </Row>
  );
};

export default PatientCases;
