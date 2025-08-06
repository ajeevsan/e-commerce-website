// LoadingComponents.jsx
import React from 'react';

// Option 1: Skeleton Loading (matches your category cards exactly)
export const SkeletonLoader = () => {
  const skeletonCards = Array(6).fill(null);
  
  return (
    <div className="loading-container">
      {skeletonCards.map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-icon"></div>
          <div className="skeleton-text"></div>
        </div>
      ))}
    </div>
  );
};

// Option 2: Gradient Spinner
export const GradientSpinner = () => {
  return (
    <div className="loading-container">
      <div className="gradient-spinner">
        <div className="spinner"></div>
        <div className="loading-text">Loading Categories...</div>
      </div>
    </div>
  );
};

// Option 3: Dots Loader
export const DotsLoader = () => {
  return (
    <div className="loading-container">
      <div className="gradient-spinner">
        <div className="dots-loader">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <div className="loading-text">Preparing your categories...</div>
      </div>
    </div>
  );
};

// Option 4: Minimal text loader
export const SimpleLoader = () => {
  return (
    <div className="loading-container">
      <div className="gradient-spinner">
        <div className="loading-text">✨ Loading Categories...</div>
      </div>
    </div>
  );
};