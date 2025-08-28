// MenuWithGlass.jsx
import React, { useState, useEffect, useMemo } from "react";

/*
  Updated menuItems with more appropriate and varied icons for each functionality
*/
const menuItems = {
  items: [
    {
      id: "navigation",
      title: "",
      type: "group",
      icon: "icon-navigation",
      children: [
        {
          id: "dashboard",
          title: "Dashboard",
          type: "item",
          icon: "feather icon-home", // Keep home icon for dashboard
          url: "/app/dashboard",
        },
        {
          id: "remedy-suggestion",
          title: "Remedy Suggestion",
          type: "item",
          url: "/remedy-suggestion",
          classes: "nav-item",
          icon: "feather icon-search", // Note: if pill icon doesn't exist, use "feather icon-target"
        },
        {
          id: "caseintakes",
          title: "Case Intakes",
          type: "item",
          url: "/case-intakes",
          classes: "nav-item",
          icon: "feather icon-user-plus", // User plus for new case intakes
        },
        {
          id: "patientcases",
          title: "Patient Cases",
          type: "item",
          url: "/patient-cases",
          classes: "nav-item",
          icon: "feather icon-users", // Users icon for patient cases
        },
        {
          id: "repertory",
          title: "Repertory",
          type: "item",
          url: "/repertory",
          classes: "nav-item",
          icon: "feather icon-book", // Book for repertory reference
        },
        {
          id: "materia-medica",
          title: "Materia Medica",
          type: "item",
          url: "/meteria-medica",
          classes: "nav-item",
          icon: "feather icon-box", // Archive for materia medica database
        },
        {
          id: "expert-system",
          title: "Expert System",
          type: "item",
          url: "/expert-system",
          classes: "nav-item",
          icon: "feather icon-cpu", // CPU for expert system/AI
        },
        // {
        //   id: "aidiagnosis",
        //   title: "AI Diagnosis",
        //   type: "item",
        //   url: "/ai-diagnosis",
        //   classes: "nav-item",
        //   icon: "feather icon-zap",
        // },
        {
          id: "labreports",
          title: "Lab Reports",
          type: "item",
          url: "/lab-reports",
          classes: "nav-item",
          icon: "feather icon-clipboard", // Clipboard for lab reports
        },

        // {
        //   id: "consultation",
        //   title: "Consultation",
        //   type: "item",
        //   url: "/consultation",
        //   classes: "nav-item",
        //   icon: "feather icon-message-circle",
        // },
        {
          id: "linkgenerator",
          title: "Link Generator",
          type: "item",
          url: "/qr-generator",
          classes: "nav-item",
          icon: "feather icon-grid", // Grid pattern for QR code
        },
      ],
    },
  ],
};

/* Default export remains exactly the original dataset as you required */
export default menuItems;
