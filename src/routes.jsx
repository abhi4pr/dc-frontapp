import React, { Suspense, Fragment, lazy } from "react";
import { Routes, Navigate, Route, useLocation } from "react-router-dom";
import Loader from "./components/Loader/Loader";
import AdminLayout from "./layouts/AdminLayout";
import { BASE_URL } from "./config/constant";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AuthGuard = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token && location.pathname !== "/auth/login") {
    return <Navigate to="/auth/login" />;
  }
  return children;
};

const renderRoutes = (routes = []) => (
  <Suspense fallback={<Loader />}>
    <ToastContainer />
    <Routes>
      {routes.map((route, i) => {
        const Guard = route.guard || Fragment;
        const Layout = route.layout || Fragment;
        const Element = route.element;

        return (
          <Route
            key={i}
            path={route.path}
            exact={route.exact}
            element={
              <Guard>
                <Layout>
                  {route.routes ? (
                    renderRoutes(route.routes)
                  ) : (
                    <Element props={true} />
                  )}
                </Layout>
              </Guard>
            }
          />
        );
      })}
    </Routes>
  </Suspense>
);

export const routes = [
  {
    exact: "true",
    path: "/",
    element: lazy(() => import("./views/extra/Welcome")),
  },
  {
    exact: "true",
    path: "/about-us",
    element: lazy(() => import("./views/extra/About")),
  },
  {
    exact: "true",
    path: "/contact-us",
    element: lazy(() => import("./views/extra/Contact")),
  },
  {
    exact: "true",
    path: "/privacy-policy",
    element: lazy(() => import("./views/extra/Privacy")),
  },
  {
    exact: "true",
    path: "/refund-policy",
    element: lazy(() => import("./views/extra/Refund")),
  },
  {
    exact: "true",
    path: "/user-form/:id",
    element: lazy(() => import("./views/extra/UserForm")),
  },
  {
    exact: "true",
    path: "/auth/forget-password",
    element: lazy(() => import("./views/auth/signup/ForgetPassword")),
  },
  {
    exact: "true",
    path: "/auth/reset-password",
    element: lazy(() => import("./views/auth/signup/ResetPassword")),
  },
  {
    exact: "true",
    path: "/auth/login",
    element: lazy(() => import("./views/auth/signup/Login")),
  },
  {
    exact: "true",
    path: "/auth/verify-email",
    element: lazy(() => import("./views/auth/signup/VerifyEmail")),
  },
  {
    exact: "true",
    path: "/auth/register",
    element: lazy(() => import("./views/auth/signup/Register")),
  },
  {
    path: "*",
    layout: AdminLayout,
    guard: AuthGuard, // Apply AuthGuard to protect routes
    routes: [
      {
        exact: "true",
        path: "/app/dashboard",
        element: lazy(() => import("./views/dashboard")),
      },
      {
        exact: "true",
        path: "/case-details/:id",
        element: lazy(() => import("./views/extra/Details")),
      },
      {
        exact: "true",
        path: "/case-intakes",
        element: lazy(() => import("./views/extra/CaseIntakes")),
      },
      {
        exact: "true",
        path: "/patient-cases",
        element: lazy(() => import("./views/extra/PatientCases")),
      },
      {
        exact: "true",
        path: "/repertory",
        element: lazy(() => import("./views/extra/Repertory")),
      },
      {
        exact: "true",
        path: "/meteria-medica",
        element: lazy(() => import("./views/extra/MeteriaMedica")),
      },
      {
        exact: "true",
        path: "/expert-system",
        element: lazy(() => import("./views/extra/ExpertSystem")),
      },
      // {
      //   exact: 'true',
      //   path: '/question/:questionId',
      //   element: lazy(() => import('./views/extra/Question'))
      // },

      {
        exact: "true",
        path: "/ai-diagnosis",
        element: lazy(() => import("./views/extra/AIDiagnosis")),
      },
      {
        exact: "true",
        path: "/lab-reports",
        element: lazy(() => import("./views/extra/LabReports")),
      },
      {
        exact: "true",
        path: "/remedy-suggestion",
        element: lazy(() => import("./views/extra/RemedySuggestion")),
      },
      {
        exact: "true",
        path: "/consultation",
        element: lazy(() => import("./views/extra/Consultation")),
      },
      {
        exact: "true",
        path: "/qr-generator",
        element: lazy(() => import("./views/extra/QRGenerator")),
      },
      {
        exact: "true",
        path: "/profile",
        element: lazy(() => import("./views/extra/Profile")),
      },
      {
        exact: "true",
        path: "/plans",
        element: lazy(() => import("./views/extra/Plans")),
      },
      {
        path: "*",
        exact: "true",
        element: () => <Navigate to={BASE_URL} />,
      },
    ],
  },
];

export default renderRoutes;
