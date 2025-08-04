import React, { useState, useEffect } from "react";
import { Card, Row, Button, Col } from "react-bootstrap";
import "react-confirm-alert/src/react-confirm-alert.css";
import { toast } from "react-toastify";
import Loader from "./Loader";
import api from "../../utility/api";
import { useNavigate } from "react-router-dom"; // ✅ import

const AIDiagnosis = () => {
  const [search, setSearch] = useState("");
  const [data, setData] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/patient-cases");
  }, []);

  return <React.Fragment></React.Fragment>;
};

export default AIDiagnosis;
