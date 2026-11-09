import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import SpaceDetail from './pages/SpaceDetail';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import ScrollToTop from './components/ScrollToTop';

// Moves keyboard focus past the header to the page content
const skipToMain = (event) => {
  event.preventDefault();
  const main = document.getElementById('main');
  main?.focus();
  main?.scrollIntoView();
};

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <Router>
          <ScrollToTop />
          <div className="App">
            <a className="skip-link" href="#main" onClick={skipToMain}>
              Skip to main content
            </a>
            <Header />
            <main id="main" tabIndex={-1}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/space/:spaceId" element={<SpaceDetail />} />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/dashboard/my-bookings" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;