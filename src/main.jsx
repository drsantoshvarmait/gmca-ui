import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"

import App from "./App.jsx"
import { ErrorProvider } from "./context/ErrorContext"
import { LanguageProvider } from "./context/LanguageContext"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ErrorProvider>
    </BrowserRouter>
  </StrictMode>
)