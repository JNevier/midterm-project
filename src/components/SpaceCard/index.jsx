import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import SpaceImage from '../SpaceImage';
import './SpaceCard.css';

const MAX_AMENITY_CHIPS = 3;

const SpaceCard = ({ space }) => {
  const { id, name, location, description, price, main_image, amenities, hours } = space;
  const shownAmenities = amenities.slice(0, MAX_AMENITY_CHIPS);
  const moreAmenities = amenities.length - shownAmenities.length;

  return (
    <article className="space-card ss-card">
      {/* The title next to the photo already names the space, so the photo is decorative */}
      <SpaceImage src={main_image} name={name} ratio="16 / 10" className="space-card__image" />

      <div className="space-card__body">
        <h3 className="ss-card-title space-card__title">
          <Link to={`/space/${id}`} className="stretched-link">
            {name}
          </Link>
        </h3>
        <p className="space-card__location">
          <FaMapMarkerAlt aria-hidden="true" />
          {location}
        </p>
        <p className="space-card__description">{description}</p>

        <ul className="space-card__chips">
          {hours === '24/7' && <li className="ss-chip ss-chip-amber">Open 24/7</li>}
          {shownAmenities.map((amenity) => (
            <li key={amenity} className="ss-chip">{amenity}</li>
          ))}
          {moreAmenities > 0 && (
            <li className="ss-chip">
              +{moreAmenities}
              <span className="visually-hidden"> more amenities</span>
            </li>
          )}
        </ul>

        <div className="space-card__footer">
          <p className="space-card__price ss-num">
            <strong>₱{price}</strong>
            <span>/hour</span>
          </p>
          <p className="space-card__hours">
            <FaClock aria-hidden="true" />
            {hours}
          </p>
          <span className="space-card__cta" aria-hidden="true">
            View and book
            <FaArrowRight />
          </span>
        </div>
      </div>
    </article>
  );
};

export default SpaceCard;
