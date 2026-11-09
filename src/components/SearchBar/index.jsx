import React, { useId, useRef } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import './SearchBar.css';

const SearchBar = ({ searchTerm, onSearchChange }) => {
  const inputId = useId();
  const inputRef = useRef(null);

  const clearSearch = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="search-bar" role="search">
      <label htmlFor={inputId} className="visually-hidden">
        Search study spaces
      </label>
      <FaSearch className="search-bar__icon" aria-hidden="true" />
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        className="form-control search-bar__input"
        placeholder="Search by name or city"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.target.value)}
        autoComplete="off"
      />
      {searchTerm && (
        <button type="button" className="search-bar__clear" aria-label="Clear search" onClick={clearSearch}>
          <FaTimes aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
