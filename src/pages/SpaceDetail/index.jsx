import React from 'react';
import { useParams } from 'react-router-dom';
import { spacesData } from '../../data/spaces';
import BookingForm from '../../components/BookingForm';
import NotFound from '../NotFound';
import SpaceImage from '../../components/SpaceImage';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { FaMapMarkerAlt, FaClock, FaMoneyBillWave, FaStar } from 'react-icons/fa';

const SpaceDetail = () => {
  const { spaceId } = useParams();
  
  // Ensure spaceId is properly parsed as integer
  const space = spacesData.find(s => s.id === parseInt(spaceId));
  useDocumentTitle(space ? `${space.name} | StudySpot PH` : 'Page not found | StudySpot PH');

  if (!space) {
    return <NotFound />;
  }

  return (
    <div className="space-detail-page">
      <div className="container">
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-4">
              <SpaceImage src={space.main_image} alt={`Photo of ${space.name}`} name={space.name} ratio="16 / 9" priority />
            </div>
            
            <div className="card mb-4">
              <div className="card-body">
                <h1 className="card-title">{space.name}</h1>
                <p className="text-muted lead">
                  <FaMapMarkerAlt className="me-2" />{space.location}
                </p>
                <p className="card-text">{space.description}</p>
                
                <div className="row text-center mt-4">
                  <div className="col-md-4">
                    <div className="border rounded p-3">
                      <FaMoneyBillWave size={24} className="text-success mb-2" />
                      <h5>₱{space.price}/hour</h5>
                      <small className="text-muted">Starting Price</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border rounded p-3">
                      <FaClock size={24} className="text-primary mb-2" />
                      <h5>{space.hours}</h5>
                      <small className="text-muted">Operating Hours</small>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border rounded p-3">
                      <FaStar size={24} className="text-warning mb-2" />
                      <h5>{space.amenities.length}+</h5>
                      <small className="text-muted">Amenities</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <h4>Amenities</h4>
                <div className="row">
                  {space.amenities.map((amenity, index) => (
                    <div key={index} className="col-md-6 mb-2">
                      <span className="badge bg-success me-2">✓</span>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {space.time_slots && space.time_slots.length > 0 && (
              <div className="card">
                <div className="card-body">
                  <h4>Recommended Time Slots</h4>
                  <div className="d-flex flex-wrap gap-2">
                    {space.time_slots.map((slot, index) => (
                      <span key={index} className="badge bg-primary p-2">
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-4">
            <div className="sticky-top" style={{top: '20px'}}>
              <BookingForm 
                spaceId={space.id} 
                spaceName={space.name} 
                price={space.price}
                timeSlots={space.time_slots}
                operatingHours={space.hours}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceDetail;