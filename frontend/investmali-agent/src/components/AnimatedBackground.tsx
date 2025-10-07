import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating geometric shapes */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-mali-emerald/10 to-mali-gold/10 rounded-full animate-float-slow"></div>
      <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-gradient-to-br from-mali-gold/10 to-mali-emerald/10 rounded-full animate-float-medium"></div>
      <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-gradient-to-br from-mali-emerald/5 to-mali-gold/5 rounded-full animate-float-fast"></div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/50 to-transparent"></div>
    </div>
  );
};

export default AnimatedBackground;
