import React, { useState, useEffect, useContext } from "react";
import { Card, Row, Button, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import DataTable from "react-data-table-component";
import axios from "axios";
import { API_URL } from "../../constants";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import { toast } from "react-toastify";
import Loader from "./Loader";
import api from "../../utility/api";
import { FRONT_URL } from "../../constants";
import { UserContext } from "../../contexts/UserContext";

const QRGenerator = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useContext(UserContext);

  return (
    <React.Fragment>
      <Row className="justify-content-center">
        <Card>
          <Card.Body>
            <Row style={{ marginBottom: 20 }}>
              <div>
                <h4 className="fw-bold">QR Generator</h4>
                <p className="text-muted">Share your</p>
              </div>
              <Col md={6}></Col>
            </Row>

            {loading ? (
              <Loader />
            ) : (
              <>
                <h3>This is your sharable link</h3>
                <a
                  href={`${FRONT_URL}?id=${user?._id}`}
                >{`${FRONT_URL}?id=${user?._id}`}</a>
              </>
            )}
          </Card.Body>
        </Card>
      </Row>
    </React.Fragment>
  );
};

export default QRGenerator;
