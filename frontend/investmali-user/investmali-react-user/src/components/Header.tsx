import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../contexts/AuthContext';
import { getColorClasses, getButtonClasses, getTextClasses } from '../utils/colorUtils';
import apiLogo from '../assets/images/api-logo.png';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const authRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Attendre que le DOM soit complètement chargé
    if (!document.body || !headerRef.current) return;

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    const ctx = gsap.context(() => {
      // Timeline pour l'animation d'entrée du header
      const tl = gsap.timeline();

      // Animation du logo
      if (logoRef.current) {
        tl.fromTo(logoRef.current,
          { opacity: 0, x: -30, scale: 0.8 },
          { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: "back.out(1.7)" }
        );
      }

      // Animation de la navigation
      if (navRef.current && navRef.current.children.length > 0) {
        tl.fromTo(navRef.current.children,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" },
          "-=0.3"
        );
      }

      // Animation des boutons d'authentification
      if (authRef.current && authRef.current.children.length > 0) {
        tl.fromTo(authRef.current.children,
          { opacity: 0, x: 30 },
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" },
          "-=0.2"
        );
      }

      // Animation de scroll pour le header (background change)
      if (headerRef.current && document.body) {
        gsap.to(headerRef.current, {
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          duration: 0.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: document.body,
            start: "top -50px",
            end: "top -51px",
            toggleActions: "play none none reverse"
          }
        });
      }

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header 
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white shadow-lg backdrop-blur-md' 
          : 'bg-white/95 backdrop-blur-md shadow-sm'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-300 flex-shrink-0">
            <div className="w-20 h-20 sm:w-20 sm:h-20 flex items-center justify-center">
              <img 
                src={apiLogo} 
                alt="API Mali Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className={`text-lg sm:text-xl font-bold transition-colors duration-300  ${getTextClasses.heading.primary}`}>
              AKERA
            </span>
          </Link>
          <nav ref={navRef} className="hidden lg:flex space-x-4 xl:space-x-6 2xl:space-x-8">
            <Link to="/demande" className={`${getTextClasses.link.primary} font-medium text-sm xl:text-base whitespace-nowrap`}>Faire une demande</Link>
            <Link to="/autorisation-exercice" className={`${getTextClasses.link.primary} text-sm xl:text-base whitespace-nowrap`}>Autorisation d'Exercice</Link>
            <Link to="/activites-reglementees" className={`${getTextClasses.link.primary} text-sm xl:text-base whitespace-nowrap`}>Activités Réglementées</Link>
            <Link to="/services" className={`${getTextClasses.link.primary} text-sm xl:text-base whitespace-nowrap`}>Services</Link>
            <Link to="/about" className={`${getTextClasses.link.primary} text-sm xl:text-base whitespace-nowrap`}>À propos</Link>
            <Link to="/contact" className={`${getTextClasses.link.primary} text-sm xl:text-base whitespace-nowrap`}>Contact</Link>
          </nav>
          
          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-investmali-neutral-100 transition-colors duration-200 flex-shrink-0"
            aria-label="Toggle mobile menu"
          >
            <div className="flex flex-col space-y-1">
              <span className={`block w-5 h-0.5 sm:w-6 transition-all duration-300 ${getColorClasses.primary.bg} ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
              <span className={`block w-5 h-0.5 sm:w-6 transition-all duration-300 ${getColorClasses.primary.bg} ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block w-5 h-0.5 sm:w-6 transition-all duration-300 ${getColorClasses.primary.bg} ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </div>
          </button>

          {/* Desktop Authentication UI */}
          <div ref={authRef} className="hidden lg:flex items-center space-x-2 xl:space-x-4 flex-shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 xl:space-x-4">
                <Link to="/profile" className="flex items-center space-x-1 xl:space-x-2 hover:bg-gray-400 px-2 xl:px-3 py-1 xl:py-2 rounded-lg transition-colors">
                  <div className="w-6 h-6 xl:w-8 xl:h-8 bg-investmali-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs xl:text-sm font-medium">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <span className="text-investmali-primary font-medium transition-colors duration-300 text-sm xl:text-base hidden xl:inline">
                    {user?.firstName} {user?.lastName}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-investmali-primary/80 hover:text-investmali-secondary transition-colors duration-300 font-medium text-sm xl:text-base"
                >
                  Se déconnecter
                </button>
              </div>
            ) : (
              <>
                <Link to="/auth" className="text-investmali-primary hover:text-investmali-accent transition-colors duration-300 font-medium text-sm xl:text-base whitespace-nowrap">
                  Se connecter
                </Link>
                <Link to="/auth" className="bg-gradient-to-r from-investmali-primary to-investmali-accent/90 text-white px-3 xl:px-6 py-1 xl:py-2 rounded-full hover:from-investmali-accent/90 hover:to-investmali-accent transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl text-sm xl:text-base whitespace-nowrap">
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'max-h-screen opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="px-6 py-4 space-y-4 bg-white border-t border-gray-200">
            {/* Mobile Navigation Links */}
            <nav className="space-y-3">
              <Link 
                to="/demande" 
                className="block py-2 px-3 rounded-lg transition-colors duration-300 font-medium text-investmali-primary hover:bg-investmali-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Faire une demande
              </Link>
              <Link 
                to="/autorisation-exercice" 
                className="block py-2 px-3 rounded-lg transition-colors duration-300 text-investmali-primary hover:bg-investmali-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Autorisation d'Exercice
              </Link>
              <Link 
                to="/activites-reglementees" 
                className="block py-2 px-3 rounded-lg transition-colors duration-300 text-investmali-primary hover:bg-investmali-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Activités Réglementées
              </Link>
              <Link 
                to="/services" 
                className="block py-2 px-3 rounded-lg transition-colors duration-300 text-investmali-primary hover:bg-investmali-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Services
              </Link>
              <Link 
                to="/about" 
                className="block py-2 px-3 rounded-lg transition-colors duration-300 text-investmali-primary hover:bg-investmali-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                À propos
              </Link>
              <Link 
                to="/contact" 
                className="block py-2 px-3 rounded-lg transition-colors duration-300 text-investmali-primary hover:bg-investmali-primary/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>

            {/* Mobile Authentication */}
            <div className="pt-4 border-t border-gray-300/20">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <Link 
                    to="/profile" 
                    className="flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors duration-300 text-investmali-primary hover:bg-investmali-primary/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="w-8 h-8 bg-investmali-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left py-2 px-3 rounded-lg transition-colors duration-300 text-investmali-primary/80 hover:bg-investmali-primary/10"
                  >
                    Se déconnecter
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link 
                    to="/auth" 
                    className="block py-2 px-3 rounded-lg transition-colors duration-300 font-medium text-investmali-primary hover:bg-investmali-primary/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Se connecter
                  </Link>
                  <Link 
                    to="/auth" 
                    className="block bg-gradient-to-r from-investmali-secondary to-investmali-secondary/90 text-white py-2 px-4 rounded-lg hover:from-investmali-secondary/90 hover:to-investmali-secondary transition-all duration-300 text-center font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    S'inscrire
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
