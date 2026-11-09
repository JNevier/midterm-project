import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { spacesData } from '../../data/spaces';
import { getSpaceStats } from '../../utils/spaceStats';
import SearchBar from '../../components/SearchBar';
import SpaceCard from '../../components/SpaceCard';
import { useAuth } from '../../contexts/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './Home.css';

const PREVIEW_COUNT = 6;

// Real values computed from the listings, never typed in
const spaceStats = getSpaceStats(spacesData);
const stats = [
  { label: 'Study spaces', value: spaceStats.spaceCount },
  { label: 'Cities', value: spaceStats.cityCount },
  { label: 'Lowest hourly rate', value: spaceStats.lowestRate === null ? '—' : `₱${spaceStats.lowestRate}` },
  { label: 'Open 24/7', value: spaceStats.open24HoursCount },
];

const matchesSearch = (space, term) => {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return [space.name, space.location, space.city].some((text) => text.toLowerCase().includes(query));
};

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated } = useAuth();
  useDocumentTitle('StudySpot PH | Book a study space in the Philippines');

  const total = spacesData.length;
  const shownSpaces = useMemo(
    () => (isAuthenticated
      ? spacesData.filter((space) => matchesSearch(space, searchTerm))
      : spacesData.slice(0, PREVIEW_COUNT)),
    [isAuthenticated, searchTerm]
  );

  const countText = isAuthenticated
    ? `${shownSpaces.length} of ${total} spaces`
    : `Showing ${shownSpaces.length} of ${total} spaces`;

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="container">
          <div className="row g-4 g-lg-5 align-items-center">
            <div className="col-lg-6">
              <h1 className="home-hero__title">
                Find Your Perfect <span className="text-primary">Study Spot</span> in the Philippines
              </h1>
              <p className="home-hero__lead">
                Discover co-working spaces, quiet study hubs, and collaborative environments across
                major Philippine cities. Pick a time slot and book it in a few clicks.
              </p>
              <div className="home-hero__actions">
                <a href="#spaces" className="btn btn-primary btn-lg">
                  <FaSearch aria-hidden="true" />
                  Browse spaces
                </a>
                {isAuthenticated ? (
                  <Link to="/dashboard/my-bookings" className="btn btn-outline-primary btn-lg">
                    My bookings
                  </Link>
                ) : (
                  <Link to="/login" className="btn btn-outline-primary btn-lg">
                    Log in to book
                  </Link>
                )}
              </div>
            </div>
            <div className="col-lg-6">
              <img
                src="/space-0.jpg"
                alt="Study space with a long wooden desk, red chairs and a colourful mural"
                className="home-hero__image"
                width="1280"
                height="800"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="home-stats" aria-labelledby="stats-heading">
        <div className="container">
          <h2 id="stats-heading" className="visually-hidden">StudySpot PH at a glance</h2>
          <dl className="home-stats__list ss-card">
            {stats.map((stat) => (
              <div className="home-stats__item" key={stat.label}>
                <dt>{stat.label}</dt>
                <dd className="ss-num">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="spaces" className="home-spaces ss-section" aria-labelledby="spaces-heading">
        <div className="container">
          <div className="home-spaces__header">
            <h2 id="spaces-heading" className="mb-1">Study spaces</h2>
            <p className="home-spaces__count" aria-live="polite">{countText}</p>
          </div>

          {isAuthenticated && (
            <div className="home-spaces__search">
              <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            </div>
          )}

          {shownSpaces.length > 0 ? (
            <div className="row g-4">
              {shownSpaces.map((space) => (
                <div className="col-md-6 col-lg-4 d-flex" key={space.id}>
                  <SpaceCard space={space} />
                </div>
              ))}
            </div>
          ) : (
            <div className="home-empty ss-card">
              <h3>No study spaces found</h3>
              <p className="text-muted">Try a different name or city.</p>
              <button type="button" className="btn btn-primary" onClick={() => setSearchTerm('')}>
                Clear search
              </button>
            </div>
          )}

          {!isAuthenticated && (
            <div className="home-login-prompt ss-card">
              <div>
                <h3>See all {total} study spaces</h3>
                <p className="text-muted mb-0">
                  Log in with any name and email to browse every listing, search by name or city, and
                  book a time slot.
                </p>
              </div>
              <Link to="/login" className="btn btn-primary btn-lg">
                Log in
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
