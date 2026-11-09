import React from 'react';
import './Footer.css';

const Footer = () => (
  <footer className="site-footer">
    <div className="container site-footer__inner">
      <p className="mb-0">
        Demo project: sample listings and simulated login. Photos and information credited to their owners.
      </p>
      <a
        href="https://github.com/JNevier/midterm-project"
        target="_blank"
        rel="noopener noreferrer"
      >
        Source code on GitHub
      </a>
    </div>
  </footer>
);

export default Footer;
