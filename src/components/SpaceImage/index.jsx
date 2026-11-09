import React, { useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import './SpaceImage.css';

// A space photo with a fixed aspect ratio. Lazy by default; pass `priority`
// for an image at the top of the page. If the file fails to load, a neutral
// block with a pin is shown instead of a broken image icon.
const SpaceImage = ({ src, alt = '', name, ratio = '16 / 10', priority = false, className = '' }) => {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = failedSrc === src;
  const style = { aspectRatio: ratio };

  if (failed) {
    return (
      <div
        className={`space-image space-image--fallback ${className}`}
        style={style}
        role="img"
        aria-label={`Photo of ${name} not available`}
      >
        <FaMapMarkerAlt aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`space-image ${className}`}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      onError={() => setFailedSrc(src)}
    />
  );
};

export default SpaceImage;
