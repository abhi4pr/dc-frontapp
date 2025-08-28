import React, { useState, useContext } from "react";
import { Card, Row, Col, Button } from "react-bootstrap";
import Loader from "./Loader";
import { FRONT_URL } from "../../constants";
import { UserContext } from "../../contexts/UserContext";
import { toast } from "react-toastify";

const QRGenerator = () => {
  const [loading] = useState(false);
  const { user } = useContext(UserContext);

  const shareLink = `${FRONT_URL}/user-form/${user?._id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard!");
  };

  return (
    <React.Fragment>
      <Row className="justify-content-center mt-5">
        <Col md={8} lg={6}>
          <Card className="shadow-lg border-0 rounded-4">
            <Card.Body className="p-4">
              {/* Header */}
              <div className="mb-4 text-center">
                <h3 className="fw-bold mb-2 text-primary">Link Generator</h3>
                <p className="text-muted mb-0">
                  Generate and share your personalized link
                </p>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <Loader />
                </div>
              ) : (
                <div className="text-center">
                  <h5 className="fw-semibold mb-3">
                    This is your sharable link
                  </h5>

                  <a
                    href={`${FRONT_URL}/user-form/${user?._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="d-block mb-4 text-decoration-none fw-semibold"
                    style={{ color: "#0d6efd", wordBreak: "break-word" }}
                  >
                    {`${FRONT_URL}/user-form/${user?._id}`}
                  </a>

                  <Button
                    variant="primary"
                    onClick={handleCopy}
                    className="px-4 py-2 rounded-pill shadow-sm"
                  >
                    Open Link
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default QRGenerator;
