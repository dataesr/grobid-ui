import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
// import { App2 } from './App2.tsx'
import App3 from './App3.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App3 />
  </StrictMode>,
)

// biome-ignore lint/style/noNonNullAssertion: Root element must be there
// const container = document.getElementById("root")!;
// const root = createRoot(container);
// root.render(<App2 />);