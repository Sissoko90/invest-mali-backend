import React from 'react';

interface AnimatedBackgroundProps {
  variant?: 'default' | 'subtle' | 'minimal';
  className?: string;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  variant = 'default', 
  className = '' 
}) => {
  const getOpacity = () => {
    switch (variant) {
      case 'subtle': return '0.1';
      case 'minimal': return '0.05';
      default: return '0.2';
    }
  };

  const getShapeSize = () => {
    switch (variant) {
      case 'subtle': return { large: 'w-24 h-24', medium: 'w-16 h-16', small: 'w-12 h-12' };
      case 'minimal': return { large: 'w-20 h-20', medium: 'w-14 h-14', small: 'w-10 h-10' };
      default: return { large: 'w-32 h-32', medium: 'w-24 h-24', small: 'w-16 h-16' };
    }
  };

  const sizes = getShapeSize();
  const opacity = getOpacity();

  return (
    <div className={`absolute top-0 left-0 w-full h-full pointer-events-none select-none overflow-hidden ${className}`}>
      {/* Formes géométriques animées */}
      <div className={`absolute top-20 left-10 ${sizes.large} bg-mali-gold/${opacity.replace('0.', '')}0 rounded-full animate-pulse`}></div>
      <div 
        className={`absolute top-40 right-20 ${sizes.medium} bg-mali-emerald/${opacity.replace('0.', '')}0 rounded-full animate-bounce`} 
        style={{animationDelay: '1s'}}
      ></div>
      <div 
        className={`absolute bottom-20 left-1/4 ${sizes.small} bg-mali-purple/${opacity.replace('0.', '')}0 rounded-full animate-ping`} 
        style={{animationDelay: '2s'}}
      ></div>
      
      {/* Formes supplémentaires pour plus de dynamisme */}
      <div 
        className={`absolute top-1/3 right-1/3 w-20 h-20 bg-mali-emerald/${opacity.replace('0.', '')}0 rounded-full animate-pulse`}
        style={{animationDelay: '0.5s'}}
      ></div>
      <div 
        className={`absolute bottom-1/3 right-10 w-14 h-14 bg-mali-gold/${opacity.replace('0.', '')}0 rounded-full animate-bounce`}
        style={{animationDelay: '1.5s'}}
      ></div>
      <div 
        className={`absolute top-1/2 left-20 w-8 h-8 bg-mali-purple/${opacity.replace('0.', '')}0 rounded-full animate-ping`}
        style={{animationDelay: '3s'}}
      ></div>

      {/* Vague SVG en bas */}
      <svg 
        className={`absolute bottom-0 left-0 w-full h-64 opacity-${Math.floor(parseFloat(opacity) * 100)}`} 
        viewBox="0 0 1440 320"
      >
        <path 
          fill="#176B5C" 
          fillOpacity={opacity}
          d="M0,160L60,186.7C120,213,240,267,360,261.3C480,256,600,192,720,186.7C840,181,960,235,1080,229.3C1200,224,1320,160,1380,128L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
        />
      </svg>

      {/* Particules flottantes */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-mali-emerald/${opacity.replace('0.', '')}0 rounded-full animate-bounce`}
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + i * 0.5}s`
            }}
          ></div>
        ))}
      </div>

      {/* Lignes ondulées */}
      <svg 
        className={`absolute top-1/4 left-0 w-full h-32 opacity-${Math.floor(parseFloat(opacity) * 50)}`}
        viewBox="0 0 1440 100"
      >
        <path 
          fill="none" 
          stroke="#22C55E" 
          strokeWidth="2" 
          strokeOpacity={opacity}
          d="M0,50 Q360,10 720,50 T1440,50"
        />
      </svg>
      
      <svg 
        className={`absolute top-3/4 left-0 w-full h-32 opacity-${Math.floor(parseFloat(opacity) * 50)}`}
        viewBox="0 0 1440 100"
      >
        <path 
          fill="none" 
          stroke="#F59E0B" 
          strokeWidth="2" 
          strokeOpacity={opacity}
          d="M0,30 Q360,70 720,30 T1440,30"
        />
      </svg>
    </div>
  );
};

export default AnimatedBackground;
