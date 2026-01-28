import React, { useState, useEffect } from 'react';

const ImageSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const images = [
    {
      src: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=800&q=80",
      alt: "Création d'entreprise - Entrepreneur au travail",
      title: "Démarrez votre entreprise",
      description: "Processus simplifié en 24h"
    },
    {
      src: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80",
      alt: "Équipe d'entrepreneurs - Collaboration",
      title: "Équipe dynamique",
      description: "Accompagnement personnalisé"
    },
    {
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      alt: "Entrepreneur avec ordinateur - Innovation",
      title: "Innovation digitale",
      description: "Solutions technologiques avancées"
    },
    {
      src: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=80",
      alt: "Réunion d'affaires - Investissement",
      title: "Investissement sécurisé",
      description: "Partenaires de confiance"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="rounded-3xl shadow-2xl overflow-hidden relative group">
      <div className="relative h-80 md:h-96">
        {images.map((image, index) => (
          <div key={index} className={`absolute inset-0 transition-all duration-700 transform ${
            index === currentSlide 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-105'
          }`}>
            <img 
              src={image.src} 
              alt={image.alt} 
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Text overlay */}
            <div className={`absolute bottom-6 left-6 text-white transform transition-all duration-700 delay-300 ${
              index === currentSlide 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-4 opacity-0'
            }`}>
              <h3 className="text-2xl font-bold mb-2">{image.title}</h3>
              <p className="text-lg opacity-90">{image.description}</p>
            </div>
          </div>
        ))}
        
        {/* Navigation arrows */}
        <button 
          onClick={() => setCurrentSlide((prev) => (prev - 1 + images.length) % images.length)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 opacity-0 group-hover:opacity-100"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          onClick={() => setCurrentSlide((prev) => (prev + 1) % images.length)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 opacity-0 group-hover:opacity-100"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Enhanced pagination dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-3">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide 
                ? 'w-8 h-3 bg-white shadow-lg' 
                : 'w-3 h-3 bg-white/60 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
