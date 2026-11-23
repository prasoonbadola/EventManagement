import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./shared/styles/global.css";
import "./shared/styles/modal.css";
import "./shared/styles/calendar.css";
import App from "./app/App";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
