import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Performance measurement for Task 12.2
const performanceStartTime = performance.now();

// Log initial load time
if (window.performance && window.performance.timing) {
  window.addEventListener('load', () => {
    const loadTime = performance.now() - performanceStartTime;
    console.log(`⚡ Dashboard Initial Load: ${Math.round(loadTime)}ms`);
    
    // Check against target
    const target = 2000; // 2 seconds target
    if (loadTime < target) {
      console.log(`✅ PASS: Dashboard load time within target (<${target}ms)`);
    } else {
      console.log(`⚠️  WARNING: Dashboard load time exceeds target (${Math.round(loadTime)}ms >= ${target}ms)`);
    }
    
    // Store for external access
    (window as any).__dashboardLoadTime = loadTime;
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
