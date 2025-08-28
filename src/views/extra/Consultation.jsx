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

const Consultation = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 10;

  useEffect(() => {
    setFilterData(
      data.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, data]);

  return (
    <React.Fragment>
      <Row className="justify-content-center">
        <Card>
          <Card.Body>
            <Row style={{ marginBottom: 20 }}>
              <div>
                <h4 className="fw-bold">Coming soon</h4>
                <p className="text-muted">Coming soon</p>
              </div>
            </Row>
          </Card.Body>
        </Card>
      </Row>
    </React.Fragment>
  );
};

export default Consultation;
