import { createContext, useContext, useState } from "react"

const ErrorContext = createContext()

export function ErrorProvider({ children }) {
  const [errors, setErrors] = useState([])

  function addError(error) {
    const entry = {
      id: Date.now(),
      message: error?.message || "Unknown error",
      code: error?.code || null,
      details: error?.details || null,
      time: new Date().toLocaleTimeString()
    }

    setErrors(prev => [entry, ...prev.slice(0, 19)]) // keep last 20
  }

  function clearErrors() {
    setErrors([])
  }

  return (
    <ErrorContext.Provider value={{ errors, addError, clearErrors }}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useError() {
  return useContext(ErrorContext)
}
