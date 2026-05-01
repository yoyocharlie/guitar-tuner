import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./style.css";

const container = document.querySelector("#app");

if (!container) {
  throw new Error("App root not found");
}

createRoot(container).render(
  <>
    <App />
  </>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  });
}
