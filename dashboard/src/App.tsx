import { useState, lazy, Suspense } from 'react'
import { LandingPage } from './components/LandingPage'
import { IconTest } from './components/IconTest'
import './App.css'

// Lazy load Dashboard to prevent import errors from blocking the app
const Dashboard = lazy(() => import('./Dashboard'))

type View = 'landing' | 'dashboard' | 'icon-test';

function App() {
  const [currentView, setCurrentView] = useState<View>('landing');

  return (
    <div>
      {/* View Switcher - Development only */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setCurrentView('landing')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            currentView === 'landing'
              ? 'bg-brand-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Landing
        </button>
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            currentView === 'dashboard'
              ? 'bg-brand-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setCurrentView('icon-test')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            currentView === 'icon-test'
              ? 'bg-brand-primary text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Icon Test
        </button>
      </div>

      {/* Render current view */}
      {currentView === 'landing' && <LandingPage />}
      {currentView === 'dashboard' && (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading Dashboard...</div>}>
          <Dashboard />
        </Suspense>
      )}
      {currentView === 'icon-test' && <IconTest />}
    </div>
  );
}

export default App
