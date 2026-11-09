import React from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const NotFound = () => {
  useDocumentTitle('Page not found | StudySpot PH');

  return (
    <div className="not-found-page">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 text-center py-5">
            <h1 className="display-5 fw-bold mb-3">Page not found</h1>
            <p className="lead text-muted mb-4">
              The page you are looking for does not exist or has moved.
            </p>
            <Link to="/" className="btn btn-primary btn-lg">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
