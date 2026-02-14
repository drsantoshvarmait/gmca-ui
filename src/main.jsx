import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "./index.css"
import App from "./App.jsx"
import { ErrorProvider } from "./context/ErrorContext"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorProvider>
        <App />
      </ErrorProvider>
    </BrowserRouter>
  </StrictMode>
)
