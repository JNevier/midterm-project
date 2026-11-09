import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { spacesData } from '../../data/spaces';
import { getSpaceStats } from '../../utils/spaceStats';
import SearchBar from '../../components/SearchBar';
import SpaceCard from '../../components/SpaceCard';
import { useAuth } from '../../contexts/AuthContext';
import { FaSearch, FaCalendarCheck, FaMoneyBillWave, FaBolt, FaArrowRight, FaLock } from 'react-icons/fa';
import './Home.css';

// Real values computed from the listings, never typed in
const spaceStats = getSpaceStats(spacesData);
const stats = [
  { label: 'Study Spaces', value: spaceStats.spaceCount },
  { label: 'Cities', value: spaceStats.cityCount },
  { label: 'Lowest Hourly Rate', value: spaceStats.lowestRate === null ? '—' : `₱${spaceStats.lowestRate}` },
  { label: 'Open 24/7', value: spaceStats.open24HoursCount },
];

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated } = useAuth();

  const filteredSpaces = useMemo(() => {
    return spacesData.filter(space =>
      space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const featuredSpaces = spacesData.slice(0, 6); // Show first 6 as featured

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center min-vh-75">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Find Your Perfect Study Spot in the Philippines
              </h1>
              <p className="lead mb-4">
                Discover premium co-working spaces, quiet study hubs, and collaborative environments 
                across major Philippine cities. Book instantly, study productively.
              </p>
              <div className="d-flex gap-3 mb-4">
                <a href="#featured-spaces" className="btn btn-light btn-lg">
                  <FaSearch className="me-2" />
                  Browse Spaces
                </a>
                {isAuthenticated ? (
                  <Link to="/dashboard/my-bookings" className="btn btn-outline-light btn-lg">
                    My Bookings
                  </Link>
                ) : (
                  <Link to="/login" className="btn btn-outline-light btn-lg">
                    Log in to book
                  </Link>
                )}
              </div>
            </div>
            <div className="col-lg-6">
              <img 
                src="/space-0.jpg" 
                alt="Study Space" 
                className="img-fluid rounded shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Credibility Section */}
      <section className="credibility-section py-5 bg-light">
        <div className="container">
          <div className="row text-center">
            <div className="col-12 mb-4">
              <h3 className="text-muted">StudySpot PH at a glance</h3>
            </div>
          </div>
          <div className="row text-center">
            {stats.map(stat => (
              <div className="col-md-3 mb-3" key={stat.label}>
                <div className="stat-card">
                  <p className="display-6 fw-bold text-primary mb-2">{stat.value}</p>
                  <p className="text-muted">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works / Benefits Section */}
      <section className="benefits-section py-5">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="display-5 fw-bold">Why StudySpot PH?</h2>
              <p className="lead text-muted">Everything you need to pick and book a space</p>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="text-center">
                <div className="feature-icon bg-primary text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{width: '80px', height: '80px'}}>
                  <FaMoneyBillWave size={32} />
                </div>
                <h3 className="h4">See the price first</h3>
                <p className="text-muted">
                  Every space shows its hourly rate, and the booking form updates the total as you pick your time.
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="text-center">
                <div className="feature-icon bg-success text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{width: '80px', height: '80px'}}>
                  <FaBolt size={32} />
                </div>
                <h3 className="h4">Quick time slots</h3>
                <p className="text-muted">
                  Pick a recommended slot to fill in the start and end time for you.
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="text-center">
                <div className="feature-icon bg-warning text-dark rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{width: '80px', height: '80px'}}>
                  <FaCalendarCheck size={32} />
                </div>
                <h3 className="h4">Manage your bookings</h3>
                <p className="text-muted">
                  See all your bookings in one place and cancel the ones you no longer need.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Content / Discovery Section */}
      <section id="featured-spaces" className="featured-spaces-section py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="display-5 fw-bold">Featured Study Spaces</h2>
              <p className="lead text-muted">Browse a selection of study spaces</p>
            </div>
          </div>
          <div className="row">
            {featuredSpaces.map(space => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
          <div className="text-center mt-4">
            {isAuthenticated ? (
              <button 
                className="btn btn-primary btn-lg"
                onClick={() => document.getElementById('all-spaces').scrollIntoView({behavior: 'smooth'})}
              >
                View All Spaces <FaArrowRight className="ms-2" />
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary btn-lg">
                <FaLock className="me-2" />
                Sign In to View All Spaces
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* All Spaces Section - Only show if authenticated */}
      {isAuthenticated && (
        <section id="all-spaces" className="all-spaces-section py-5">
          <div className="container">
            <div className="row">
              <div className="col-12 mb-4">
                <h2 className="display-6 fw-bold">All Study Spaces</h2>
                <p className="text-muted">Find the perfect space for your needs</p>
              </div>
            </div>
            
            <div className="search-section mb-5">
              <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            </div>

            <div className="spaces-section">
              <div className="row">
                {filteredSpaces.length > 0 ? (
                  filteredSpaces.map(space => (
                    <SpaceCard key={space.id} space={space} />
                  ))
                ) : (
                  <div className="col-12 text-center py-5">
                    <h4>No study spaces found</h4>
                    <p className="text-muted">Try adjusting your search terms or browse all available spaces.</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Final Call-to-Action */}
      <section className="cta-section bg-primary text-white py-5">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center">
              <h2 className="display-6 fw-bold mb-4">Ready to Find Your Perfect Study Spot?</h2>
              <p className="lead mb-4">
                Log in with any name and email to try the booking demo.
              </p>
              <div className="d-flex justify-content-center gap-3">
                {isAuthenticated ? (
                  <>
                    <a href="#featured-spaces" className="btn btn-light btn-lg">
                      Browse All Spaces
                    </a>
                    <Link to="/dashboard/my-bookings" className="btn btn-outline-light btn-lg">
                      My Bookings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-light btn-lg">
                      Get Started Now
                    </Link>
                    <a href="#featured-spaces" className="btn btn-outline-light btn-lg">
                      Browse Featured Spaces
                    </a>
                  </>
                )}
              </div>
              <div className="mt-4">
                <small>Demo project: sample listings and simulated login. Photos and information credited to their owners.</small>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;