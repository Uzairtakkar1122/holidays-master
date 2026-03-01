import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Layout/Navbar';
import Home from './pages/Home/Home';
import Hotels from './pages/Hotels/Hotels';
import Destinations from './pages/Destinations/Destinations';
import Experiences from './pages/Experiences/Experiences';
import SearchResults from './components/Search/SearchResults/SearchResults';
import NearbyHotelsPage from './pages/NearbyHotelsPage/NearbyHotelsPage';
import HotelDetailPage from './pages/HotelDetailPage/HotelDetailPage';
import ConfirmBookingPage from './pages/ConfirmBookingPage/ConfirmBookingPage';
import PrivatePage from './pages/Private/PrivatePage';
import PrivateRoute from './components/Common/PrivateRoute';
import About from './pages/About/About';
import VisitorPopup from './components/Common/VisitorPopup';
import Footer from './components/Layout/Footer';
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
          <VisitorPopup />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/hotels" element={<Hotels />} />
              <Route path="/about" element={<About />} />
              <Route path="/destinations" element={<Destinations />} />
              <Route path="/experiences" element={<Experiences />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/nearby" element={<NearbyHotelsPage />} />
              <Route path="/hotel-detail-data" element={<HotelDetailPage />} />
              <Route path="/confirm-booking" element={<ConfirmBookingPage />} />
              {/* Placeholder routes for future expansion */}
              <Route path="/private" element={<PrivateRoute pageName="Private Dashboard"><PrivatePage /></PrivateRoute>} />
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
