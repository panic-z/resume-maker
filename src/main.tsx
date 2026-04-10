import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Analytics
      scriptSrc="https://www.cybershiba.cn/_vercel/insights/script.js"
      endpoint="https://www.cybershiba.cn/_vercel/insights"
    />
    <SpeedInsights />
  </StrictMode>
);
