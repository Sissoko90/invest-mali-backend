<<<<<<< HEAD
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import { useAuth } from '../contexts/AuthContext';
import { getColorClasses, getButtonClasses, getTextClasses } from '../utils/colorUtils';
import apiLogo from '../assets/images/api-logo.png';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const authRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Fonction pour vérifier si un lien est actif
  const isActiveLink = (path: string) => location.pathname === path;

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
            <span className={`text-lg sm:text-xl font-bold transition-colors duration-300 px-4  ${getTextClasses.heading.primary}`}>
              AKERA
            </span>
          </Link>
          <nav ref={navRef} className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            <Link 
              to="/demande" 
              className={`relative px-3 xl:px-4 py-2 rounded-lg text-sm xl:text-base font-medium transition-all duration-300 whitespace-nowrap ${
                isActiveLink('/demande') 
                  ? 'text-investmali-primary bg-investmali-primary/10' 
                  : 'text-gray-700 hover:text-investmali-primary hover:bg-gray-100'
              }`}
            >
              Faire une demande
              {isActiveLink('/demande') && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-investmali-primary rounded-full"></span>
              )}
            </Link>
            <Link 
              to="/autorisation-exercice" 
              className={`relative px-3 xl:px-4 py-2 rounded-lg text-sm xl:text-base font-medium transition-all duration-300 whitespace-nowrap ${
                isActiveLink('/autorisation-exercice') 
                  ? 'text-investmali-primary bg-investmali-primary/10' 
                  : 'text-gray-700 hover:text-investmali-primary hover:bg-gray-100'
              }`}
            >
              Autorisation d'Exercice
              {isActiveLink('/autorisation-exercice') && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-investmali-primary rounded-full"></span>
              )}
            </Link>
            <Link 
              to="/activites-reglementees" 
              className={`relative px-3 xl:px-4 py-2 rounded-lg text-sm xl:text-base font-medium transition-all duration-300 whitespace-nowrap ${
                isActiveLink('/activites-reglementees') 
                  ? 'text-investmali-primary bg-investmali-primary/10' 
                  : 'text-gray-700 hover:text-investmali-primary hover:bg-gray-100'
              }`}
            >
              Activités Réglementées
              {isActiveLink('/activites-reglementees') && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-investmali-primary rounded-full"></span>
              )}
            </Link>
            <Link 
              to="/services" 
              className={`relative px-3 xl:px-4 py-2 rounded-lg text-sm xl:text-base font-medium transition-all duration-300 whitespace-nowrap ${
                isActiveLink('/services') 
                  ? 'text-investmali-primary bg-investmali-primary/10' 
                  : 'text-gray-700 hover:text-investmali-primary hover:bg-gray-100'
              }`}
            >
              Services
              {isActiveLink('/services') && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-investmali-primary rounded-full"></span>
              )}
            </Link>
            <Link 
              to="/about" 
              className={`relative px-3 xl:px-4 py-2 rounded-lg text-sm xl:text-base font-medium transition-all duration-300 whitespace-nowrap ${
                isActiveLink('/about') 
                  ? 'text-investmali-primary bg-investmali-primary/10' 
                  : 'text-gray-700 hover:text-investmali-primary hover:bg-gray-100'
              }`}
            >
              À propos
              {isActiveLink('/about') && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-investmali-primary rounded-full"></span>
              )}
            </Link>
            <Link 
              to="/contact" 
              className={`relative px-3 xl:px-4 py-2 rounded-lg text-sm xl:text-base font-medium transition-all duration-300 whitespace-nowrap ${
                isActiveLink('/contact') 
                  ? 'text-investmali-primary bg-investmali-primary/10' 
                  : 'text-gray-700 hover:text-investmali-primary hover:bg-gray-100'
              }`}
            >
              Contact
              {isActiveLink('/contact') && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-investmali-primary rounded-full"></span>
              )}
            </Link>
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
          <div ref={authRef} className="hidden lg:flex items-center space-x-3 flex-shrink-0">
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-200"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-investmali-primary to-investmali-accent rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-semibold">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="hidden xl:flex flex-col items-start">
                    <span className="text-gray-800 font-semibold text-sm leading-tight">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-gray-500 text-xs">Mon compte</span>
                  </div>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Menu déroulant du profil */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link 
                      to="/profile" 
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Mon profil</span>
                    </Link>
                    <Link 
                      to="/profile?tab=applications" 
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Mes demandes</span>
                    </Link>
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Se déconnecter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/auth" 
                  className="px-4 py-2 text-gray-700 hover:text-investmali-primary font-medium text-sm transition-colors duration-300 whitespace-nowrap"
                >
                  Se connecter
                </Link>
                {/* <Link 
                  to="/auth" 
                  className="px-5 py-2.5 bg-gradient-to-r from-investmali-primary to-investmali-accent text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-investmali-primary/25 transition-all duration-300 transform hover:-translate-y-0.5 text-sm whitespace-nowrap"
                >
                  Commencer
                </Link> */}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen 
            ? 'max-h-screen opacity-100' 
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="px-4 py-4 space-y-4 bg-white border-t border-gray-100">
            {/* Mobile Navigation Links */}
            <nav className="space-y-1">
              <Link 
                to="/demande" 
                className={`flex items-center py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                  isActiveLink('/demande')
                    ? 'bg-investmali-primary/10 text-investmali-primary border-l-4 border-investmali-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Faire une demande
              </Link>
              <Link 
                to="/autorisation-exercice" 
                className={`flex items-center py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                  isActiveLink('/autorisation-exercice')
                    ? 'bg-investmali-primary/10 text-investmali-primary border-l-4 border-investmali-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Autorisation d'Exercice
              </Link>
              <Link 
                to="/activites-reglementees" 
                className={`flex items-center py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                  isActiveLink('/activites-reglementees')
                    ? 'bg-investmali-primary/10 text-investmali-primary border-l-4 border-investmali-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Activités Réglementées
              </Link>
              <Link 
                to="/services" 
                className={`flex items-center py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                  isActiveLink('/services')
                    ? 'bg-investmali-primary/10 text-investmali-primary border-l-4 border-investmali-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Services
              </Link>
              <Link 
                to="/about" 
                className={`flex items-center py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                  isActiveLink('/about')
                    ? 'bg-investmali-primary/10 text-investmali-primary border-l-4 border-investmali-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                À propos
              </Link>
              <Link 
                to="/contact" 
                className={`flex items-center py-3 px-4 rounded-xl transition-all duration-300 font-medium ${
                  isActiveLink('/contact')
                    ? 'bg-investmali-primary/10 text-investmali-primary border-l-4 border-investmali-primary'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
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
=======
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
            <span className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${getTextClasses.heading.primary}`}>
              A kera
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
                <Link to="/auth" className="bg-gradient-to-r from-investmali-secondary to-investmali-secondary/90 text-white px-3 xl:px-6 py-1 xl:py-2 rounded-full hover:from-investmali-secondary/90 hover:to-investmali-secondary transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl text-sm xl:text-base whitespace-nowrap">
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
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
