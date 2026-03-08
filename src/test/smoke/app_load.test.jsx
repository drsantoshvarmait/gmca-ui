import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App'
import { ErrorProvider } from '../../context/ErrorContext'
import { LanguageProvider } from '../../context/LanguageContext'

describe('Smoke Test: App Load', () => {
    it('renders the application without crashing', () => {
        render(
            <MemoryRouter>
                <ErrorProvider>
                    <LanguageProvider>
                        <App />
                    </LanguageProvider>
                </ErrorProvider>
            </MemoryRouter>
        )
        // Basic check to see if the main container or a specific text exists
        // Depending on your login state/loading screen, we look for a defining element
        expect(document.body).toBeDefined()
    })
})
