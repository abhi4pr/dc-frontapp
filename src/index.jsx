import React from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ConfigProvider } from "./contexts/ConfigContext";
import { UserProvider } from "./contexts/UserContext";

const container = document.getElementById("root");
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
  <ConfigProvider>
    <UserProvider>
      <App />
    </UserProvider>
  </ConfigProvider>
);

reportWebVitals();
