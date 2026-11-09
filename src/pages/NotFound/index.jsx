import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './NotFound.css';

const NotFound = () => {
  useDocumentTitle('Page not found | StudySpot PH');

  return (
    <div className="not-found container">
      <div className="not-found__icon" aria-hidden="true">
        <FaMapMarkerAlt />
      </div>
      <h1 className="not-found__title">Page not found</h1>
      <p className="not-found__text">
        The page you are looking for does not exist or has moved.
      </p>
      <Link to="/" className="btn btn-primary btn-lg">
        Back to home
      </Link>
    </div>
  );
};

export default NotFound;
