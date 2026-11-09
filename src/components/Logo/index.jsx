import React from 'react';

// The StudySpot PH mark: a map pin on a teal tile. Decorative, so hidden from screen readers.
const Logo = ({ size = 32 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    width={size}
    height={size}
    aria-hidden="true"
    focusable="false"
  >
    <rect width="32" height="32" rx="8" fill="#0F766E" />
    <path
      d="M16 6.5c-4.14 0-7.5 3.26-7.5 7.3 0 5.1 6.1 10.9 6.77 11.52a1.07 1.07 0 0 0 1.46 0C17.4 24.7 23.5 18.9 23.5 13.8c0-4.04-3.36-7.3-7.5-7.3Z"
      fill="#fff"
    />
    <circle cx="16" cy="13.8" r="2.9" fill="#0F766E" />
  </svg>
);

export default Logo;
