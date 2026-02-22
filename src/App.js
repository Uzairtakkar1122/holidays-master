import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Hotels from './pages/Hotels';
import Destinations from './pages/Destinations';
import Experiences from './pages/Experiences';
import SearchResults from './components/SearchResults/SearchResults';
import Footer from './components/Footer';
import './index.css';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/experiences" element={<Experiences />} />
          <Route path="/search" element={<SearchResults />} />
          {/* Placeholder routes for future expansion */}
          <Route path="/flights" element={<div className="container" style={{ padding: '2rem' }}>Flights page coming soon...</div>} />
          <Route path="/deals" element={<div className="container" style={{ padding: '2rem' }}>Deals page coming soon...</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
