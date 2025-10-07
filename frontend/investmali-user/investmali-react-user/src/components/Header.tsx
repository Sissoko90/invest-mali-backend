import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const authRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    const ctx = gsap.context(() => {
      // Timeline pour l'animation d'entrée du header
      const tl = gsap.timeline();

      // Animation du logo
      tl.fromTo(logoRef.current,
        { opacity: 0, x: -30, scale: 0.8 },
        { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
      );

      // Animation de la navigation
      tl.fromTo(navRef.current?.children || [],
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" },
        "-=0.3"
      );

      // Animation des boutons d'authentification
      tl.fromTo(authRef.current?.children || [],
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" },
        "-=0.2"
      );

      // Animation de scroll pour le header (background change)
      gsap.to(headerRef.current, {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        duration: 0.3,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "body",
          start: "top -50px",
          end: "top -51px",
          toggleActions: "play none none reverse"
        }
      });

    }, headerRef);

    return () => {
      ctx.revert();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header 
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-lg backdrop-blur-md' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-investmali-primary to-investmali-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">IM</span>
            </div>
            <span className={`text-xl font-bold transition-colors duration-300 ${
              isScrolled ? 'text-investmali-primary' : 'text-white'
            }`}>
              InvestMali
            </span>
          </div>
          <nav ref={navRef} className="hidden md:flex space-x-8">
            <Link to="/" className={`${isScrolled ? 'text-investmali-primary' : 'text-white'} hover:text-investmali-accent transition-colors duration-300`}>Accueil</Link>
            <Link to="/demande" className={`${isScrolled ? 'text-investmali-primary' : 'text-white'} hover:text-investmali-secondary transition-colors duration-300 font-medium`}>Faire une demande</Link>
            <a href="#services" className={`${isScrolled ? 'text-investmali-primary' : 'text-white'} hover:text-investmali-accent transition-colors duration-300`}>Services</a>
            <a href="#about" className={`${isScrolled ? 'text-investmali-primary' : 'text-white'} hover:text-investmali-accent transition-colors duration-300`}>À propos</a>
            <a href="#contact" className={`${isScrolled ? 'text-investmali-primary' : 'text-white'} hover:text-investmali-accent transition-colors duration-300`}>Contact</a>
          </nav>
          
          {/* Authentication UI */}
          <div ref={authRef} className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-2 hover:bg-gray-400 px-3 py-2 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-investmali-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <span className={`${isScrolled ? 'text-investmali-primary' : 'text-white'} font-medium transition-colors duration-300`}>
                    {user?.firstName} {user?.lastName}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className={`${isScrolled ? 'text-investmali-primary/80' : 'text-white/80'} hover:text-investmali-secondary transition-colors duration-300 font-medium`}
                >
                  Se déconnecter
                </button>
              </div>
            ) : (
              <>
                <Link to="/auth" className={`${isScrolled ? 'text-investmali-primary' : 'text-white'} hover:text-investmali-accent transition-colors duration-300 font-medium`}>
                  Se connecter
                </Link>
                <Link to="/auth" className="bg-gradient-to-r from-investmali-secondary to-investmali-secondary/90 text-white px-6 py-2 rounded-full hover:from-investmali-secondary/90 hover:to-investmali-secondary transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl">
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
