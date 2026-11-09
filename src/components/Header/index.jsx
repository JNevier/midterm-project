import React, { startTransition, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../Logo';
import './Header.css';

const Header = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef(null);

  // Close the small-screen menu whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Escape closes the menu and returns focus to the menu button
  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  // React Router applies navigation as a transition. Logging out in the same
  // transition makes both land together, so a protected page (My bookings)
  // goes to Home instead of redirecting to /login first.
  const handleLogout = () => {
    closeMenu();
    startTransition(() => {
      navigate('/');
      logout();
    });
  };

  return (
    <header className="site-header">
      <div className="container site-header__bar">
        <Link className="site-brand" to="/" onClick={closeMenu}>
          <Logo />
          <span>StudySpot PH</span>
        </Link>

        <nav className="site-nav" aria-label="Main">
          <button
            ref={toggleRef}
            type="button"
            className="site-nav__toggle"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label="Menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
          </button>

          <ul id="site-menu" className={`site-nav__list${menuOpen ? ' is-open' : ''}`}>
            {isAuthenticated ? (
              <>
                <li>
                  <NavLink className="site-nav__link" to="/dashboard/my-bookings" onClick={closeMenu}>
                    My bookings
                  </NavLink>
                </li>
                <li>
                  <button type="button" className="btn btn-outline-primary site-nav__button" onClick={handleLogout}>
                    Log out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link className="btn btn-primary site-nav__button" to="/login" onClick={closeMenu}>
                  Log in
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
