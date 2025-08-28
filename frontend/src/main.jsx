import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import './index.css'
import App from './App.jsx'
import App2 from './App2.jsx'
import App3 from './App3.jsx';
import App4 from './App4.jsx';
import App5 from './App5.jsx';
import About from './About.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/about" element={<About />} />
                <Route path="/alt" element={<App2 />} />
                <Route path="/account" element={<App3 />} />
                <Route path="/alt_pay" element={<App4 />} />
                <Route path="/edit" element={<App5 />} />
            </Routes>
        </BrowserRouter>
  </StrictMode>,
)
