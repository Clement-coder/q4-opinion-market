import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider }      from "./context/AuthContext";
import { DemoModeProvider }  from "./context/DemoModeContext";
import { WalletProvider }    from "./context/WalletContext";
import { PWAPrompts }        from "./components/PWAPrompts";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DemoModeProvider>
          <WalletProvider>
            <App />
            {/* PWA: offline banner, update toast, install prompt */}
            <PWAPrompts />
          </WalletProvider>
        </DemoModeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
