import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';

function App() {
    return (
        <AuthProvider>
            <Router>
                <ScrollToTop />
                <FloatingWhatsApp />
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/admin" element={<AdminPage />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
