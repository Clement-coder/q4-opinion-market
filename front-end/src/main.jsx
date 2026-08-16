import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider }   from "./context/AuthContext";
import { WalletProvider } from "./context/WalletContext";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WalletProvider>
          <App />
        </WalletProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
