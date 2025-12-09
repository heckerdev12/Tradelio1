import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Remove the placeholder as soon as JS loads
document.getElementById("startup")?.remove();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
