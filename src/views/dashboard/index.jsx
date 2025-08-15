import React from "react";

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
import SocialCard from "../../components/Widgets/Statistic/SocialCard";

import uniqueVisitorChart from "./chart/analytics-unique-visitor-chart";
import customerChart from "./chart/analytics-cuatomer-chart";

// ==============================|| DASHBOARD ANALYTICS ||============================== //

const DashAnalytics = () => {
  return (
    <React.Fragment>
      <Row>
        {/* order cards */}
        <Col md={6} xl={3}>
          <OrderCard
            params={{
              title: "Total Patients",
              class: "bg-c-blue",
              icon: <Users size={24} color="white" />, // Users icon for patients
              primaryText: "486",
              secondaryText: "Completed Orders",
              extraText: "351",
            }}
          />
        </Col>
        <Col md={6} xl={3}>
          <OrderCard
            params={{
              title: "New Cases",
              class: "bg-c-green",
              icon: <UserCheck size={24} color="white" />, // UserCheck for new cases
              primaryText: "1641",
              secondaryText: "This Month",
              extraText: "213",
            }}
          />
        </Col>
        <Col md={6} xl={3}>
          <OrderCard
            params={{
              title: "Today Cases",
              class: "bg-c-yellow",
              icon: <Activity size={24} color="white" />, // Activity for daily cases
              primaryText: "42,562",
              secondaryText: "This Month",
              extraText: "5,032",
            }}
          />
        </Col>
      </Row>
    </React.Fragment>
  );
};

export default DashAnalytics;
