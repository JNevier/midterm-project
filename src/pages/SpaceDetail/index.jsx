import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { spacesData } from '../../data/spaces';
import BookingForm from '../../components/BookingForm';
import SpaceImage from '../../components/SpaceImage';
import NotFound from '../NotFound';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import './SpaceDetail.css';

const SpaceDetail = () => {
  const { spaceId } = useParams();

  // Ensure spaceId is properly parsed as integer
  const space = spacesData.find(s => s.id === parseInt(spaceId));
  useDocumentTitle(space ? `${space.name} | StudySpot PH` : 'Page not found | StudySpot PH');

  if (!space) {
    return <NotFound />;
  }

  const isOpen24Hours = space.hours === '24/7';

  return (
    <div className="space-detail container">
      <Link to="/#spaces" className="space-detail__back">
        <FaArrowLeft aria-hidden="true" />
        Back to all spaces
      </Link>

      <div className="space-detail__grid">
        <div className="space-detail__image">
          <SpaceImage
            src={space.main_image}
            alt={`Photo of ${space.name}`}
            name={space.name}
            ratio="16 / 9"
            priority
          />
        </div>

        <div className="space-detail__info">
          <h1 className="space-detail__title">{space.name}</h1>
          <p className="space-detail__location">
            <FaMapMarkerAlt aria-hidden="true" />
            {space.location}
          </p>
          <ul className="space-detail__chips">
            <li className="ss-chip ss-num">₱{space.price}/hour</li>
            {isOpen24Hours ? (
              <li className="ss-chip ss-chip-amber">Open 24/7</li>
            ) : (
              <li className="ss-chip">
                <FaClock aria-hidden="true" />
                {space.hours}
              </li>
            )}
          </ul>
          <p className="space-detail__description">{space.description}</p>
        </div>

        <aside className="space-detail__booking" aria-label="Booking">
          <div className="space-detail__booking-inner">
            <BookingForm
              spaceId={space.id}
              spaceName={space.name}
              price={space.price}
              timeSlots={space.time_slots}
              operatingHours={space.hours}
            />
          </div>
        </aside>

        <section className="space-detail__amenities ss-card" aria-labelledby="amenities-heading">
          <h2 id="amenities-heading" className="h3">Amenities</h2>
          <ul className="space-detail__amenity-list">
            {space.amenities.map((amenity) => (
              <li key={amenity}>
                <FaCheck aria-hidden="true" />
                {amenity}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default SpaceDetail;
