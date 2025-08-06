import React, { useState, useEffect } from "react";
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

const QRGenerator = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get(
          `${API_URL}/diets?page=${currentPage}&perPage=${perPage}`
        );
        setData(response.data.diets);
        setTotalPages(response.data.totalPages);
        setFilterData(response.data.diets);
      } catch (error) {
        console.error("Error fetching data", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [currentPage]);

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

            {loading ? <Loader /> : <></>}
          </Card.Body>
        </Card>
      </Row>
    </React.Fragment>
  );
};

export default QRGenerator;
