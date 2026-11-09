import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaClock, FaMoneyBillWave } from 'react-icons/fa';

const SpaceCard = ({ space }) => {
  const { id, name, location, description, price, main_image, amenities, hours } = space;

  return (
    <div className="col-md-6 col-lg-4 mb-4">
      <div className="card space-card h-100">
        <img 
          src={main_image} 
          className="card-img-top" 
          alt={name}
          style={{height: '200px', objectFit: 'cover'}}
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/400x200/0F766E/ffffff?text=${encodeURIComponent(name)}`;
          }}
        />
        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{name}</h5>
          <p className="card-text text-muted">
            <FaMapMarkerAlt className="me-1" /> {location}
          </p>
          <p className="card-text flex-grow-1">{description.substring(0, 100)}...</p>
          
          <div className="amenities mb-2">
            {amenities.slice(0, 3).map((amenity, index) => (
              <span key={index} className="badge bg-primary me-1 mb-1">
                {amenity}
              </span>
            ))}
          </div>

          <div className="mt-auto">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-success fw-bold">
                <FaMoneyBillWave className="me-1" />₱{price}/hour
              </span>
              <small className="text-muted">
                <FaClock className="me-1" />{hours}
              </small>
            </div>
            <Link 
              to={`/space/${id}`} 
              className="btn btn-primary w-100"
              state={{ from: 'homepage' }}
            >
              View Details & Book
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceCard;