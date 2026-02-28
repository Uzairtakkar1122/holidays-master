import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Hotels from './pages/Hotels';
import Destinations from './pages/Destinations';
import Experiences from './pages/Experiences';
import SearchResults from './components/SearchResults/SearchResults';
import NearbyHotelsPage from './pages/NearbyHotelsPage';
import HotelDetailPage from './pages/HotelDetailPage';
import ConfirmBookingPage from './pages/ConfirmBookingPage';
import Footer from './components/Footer';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// To enable Google Sign-In, create a .env file in the project root and add:
// REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <AuthProvider>
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/nearby" element={<NearbyHotelsPage />} />
          <Route path="/hotel-detail-data" element={<HotelDetailPage />} />
          <Route path="/confirm-booking" element={<ConfirmBookingPage />} />
          {/* Placeholder routes for future expansion */}
          <Route path="/flights" element={<div className="container" style={{ padding: '2rem' }}>Flights page coming soon...</div>} />
          <Route path="/deals" element={<div className="container" style={{ padding: '2rem' }}>Deals page coming soon...</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
