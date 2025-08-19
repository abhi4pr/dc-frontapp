import React, { useEffect, useContext, useState } from "react";

// react-bootstrap
import { Row, Col, Card, Table, ListGroup } from "react-bootstrap";

// third party
import Chart from "react-apexcharts";

// lucide react icons
import {
  Users,
  Activity,
  Calendar,
  Heart,
  UserCheck,
  TrendingUp,
} from "lucide-react";

// project import
import OrderCard from "../../components/Widgets/Statistic/OrderCard";
import { UserContext } from "../../contexts/UserContext";
import api from "../../utility/api";
import { API_URL } from "../../constants";

const DashAnalytics = () => {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0)
  const [data, setData] = useState({})

  const fetchData = async () => {
    setLoading(true);

    try {
      const response = await api.get(
        `${API_URL}/cases/get_user_posts/${user?._id}`
      );
      setData(response.data?.posts || []);
    } catch (err) {
      console.error("Error fetching data", err);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?._id]);

  return (
    <React.Fragment>
      <Row>
        {/* order cards */}
        {loading ? 'Loading please wait...' : (
          <Col md={6} xl={3}>
            <OrderCard
              params={{
                title: "Total Patients",
                class: "bg-c-blue",
                icon: <Users size={24} color="white" />,
                primaryText: `${data?.length}`,
                secondaryText: "All Time",
                extraText: "",
              }}
            />
          </Col>
        )}
      </Row>
    </React.Fragment>
  );
};

export default DashAnalytics;
