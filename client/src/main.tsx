import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// The theme is already initialized by the script in index.html

createRoot(document.getElementById("root")!).render(
  <App />
);
