<<<<<<< HEAD
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '../styles/swiper-custom.css';
import apiLogo from '../assets/images/api-logo.png';
import aboutVideo from '../assets/images/IMG_4805.MOV';
import { 
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  HeartIcon,
  TrophyIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getColorClasses } from '../utils/colorUtils';

gsap.registerPlugin(ScrollTrigger);

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image?: string;
}

interface Statistic {
  number: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

const AboutPage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const directorRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const [hasAnimatedCounters, setHasAnimatedCounters] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animation du hero
      gsap.fromTo(heroRef.current,
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          ease: "power3.out"
        }
      );

      // Animation de la mission
      gsap.fromTo(missionRef.current,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: missionRef.current,
            start: "top 70%"
          }
        }
      );

      // Animation de la section directeur
      const directorPhoto = document.querySelector(".director-photo");
      if (directorPhoto) {
        gsap.fromTo(directorPhoto,
          { opacity: 0, scale: 0.8, rotation: -5 },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 1,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: directorRef.current,
              start: "top 70%"
            }
          }
        );
      }

      const directorMessage = document.querySelector(".director-message");
      if (directorMessage) {
        gsap.fromTo(directorMessage,
          { opacity: 0, x: 50 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            delay: 0.3,
            ease: "power2.out",
            scrollTrigger: {
              trigger: directorRef.current,
              start: "top 70%"
            }
          }
        );
      }

      // Animation des statistiques avec compteurs
      const statCards = document.querySelectorAll(".stat-card");
      if (statCards.length > 0) {
        gsap.fromTo(statCards,
          { opacity: 0, y: 50, scale: 0.8, rotationY: 45 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationY: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: statsRef.current,
              start: "top 80%",
              onEnter: () => {
                if (!hasAnimatedCounters) {
                  // Délai pour laisser les cartes apparaître avant les compteurs
                  setTimeout(() => {
                    animateCounters();
                    setHasAnimatedCounters(true);
                  }, 500);
                }
              }
            }
          }
        );
      }

      // Animation des icônes avec rotation
      const statIcons = document.querySelectorAll(".stat-icon");
      if (statIcons.length > 0) {
        gsap.fromTo(statIcons,
          { rotation: -180, scale: 0 },
          {
            rotation: 0,
            scale: 1,
            duration: 1,
            stagger: 0.2,
            ease: "elastic.out(1, 0.5)",
            scrollTrigger: {
              trigger: statsRef.current,
              start: "top 70%"
            }
          }
        );
      }

      // Animation des valeurs
      const valueCards = document.querySelectorAll(".value-card");
      if (valueCards.length > 0) {
        gsap.fromTo(valueCards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: valuesRef.current,
              start: "top 70%"
            }
          }
        );
      }

      // Animation du slider d'équipe
      const teamSlider = document.querySelector(".team-slider");
      if (teamSlider) {
        gsap.fromTo(teamSlider,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: teamRef.current,
              start: "top 70%"
            }
          }
        );
      }

      // Animation des boutons de navigation
      const swiperButtons = document.querySelectorAll(".swiper-button-prev-custom, .swiper-button-next-custom");
      if (swiperButtons.length > 0) {
        gsap.fromTo(swiperButtons,
          { opacity: 0, scale: 0.5 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            delay: 0.3,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: teamRef.current,
              start: "top 70%"
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, [hasAnimatedCounters]);

  const animateCounters = () => {
    statistics.forEach((stat, index) => {
      const element = document.querySelector(`[data-counter="${index}"]`);
      if (element) {
        const numericValue = parseInt(stat.number.replace(/[^0-9]/g, ''));
        
        // Initialize counter to 0
        element.textContent = '0';
        
        const obj = { value: 0 };
        gsap.to(obj, {
          value: numericValue,
          duration: 2.5,
          delay: index * 0.3,
          ease: "power2.out",
          onUpdate: () => {
            const currentValue = Math.round(obj.value);
            let displayValue = currentValue.toString();
            
            // Add suffix based on original format
            if (stat.number.includes('+')) displayValue += '+';
            if (stat.number.includes('%')) displayValue += '%';
            if (stat.number.includes('h')) displayValue += 'h';
            
            element.textContent = displayValue;
          },
          onComplete: () => {
            // Ensure final value is correct
            let finalValue = numericValue.toString();
            if (stat.number.includes('+')) finalValue += '+';
            if (stat.number.includes('%')) finalValue += '%';
            if (stat.number.includes('h')) finalValue += 'h';
            element.textContent = finalValue;
          }
        });
      }
    });
  };

  const statistics: Statistic[] = [
    {
      number: "500+",
      label: "Entreprises créées",
      icon: BuildingOfficeIcon,
      color: "from-investmali-primary to-investmali-primary-600"
    },
    {
      number: "1200+",
      label: "Clients satisfaits",
      icon: UsersIcon,
      color: "from-investmali-accent to-investmali-accent-600"
    },
    {
      number: "95%",
      label: "Taux de réussite",
      icon: ChartBarIcon,
      color: "from-investmali-accent to-investmali-accent"
    },
    {
      number: "24h",
      label: "Délai moyen",
      icon: GlobeAltIcon,
      color: "from-investmali-warning to-investmali-warning"
    }
  ];

  const values = [
    {
      title: "Excellence",
      description: "Nous nous engageons à fournir des services de la plus haute qualité avec une attention méticuleuse aux détails.",
      icon: TrophyIcon,
      color: "from-investmali-primary to-investmali-accent"
    },
    {
      title: "Innovation",
      description: "Nous utilisons les dernières technologies pour simplifier et accélérer vos démarches administratives.",
      icon: LightBulbIcon,
      color: "from-investmali-primary to-investmali-accent"
    },
    {
      title: "Intégrité",
      description: "Transparence, honnêteté et respect des réglementations sont au cœur de notre approche professionnelle.",
      icon: ShieldCheckIcon,
      color: "from-investmali-primary to-investmali-accent"
    },
    {
      title: "Engagement",
      description: "Nous nous investissons pleinement dans le succès de vos projets avec un accompagnement personnalisé.",
      icon: HeartIcon,
      color: "from-investmali-primary to-investmali-accent"
    }
  ];

  const team: TeamMember[] = [
    {
      name: "M. Ibrahim Ahamadou TOURE",
      role: "Fondateur & CEO",
      description: "Expert en droit des affaires avec plus de 10 ans d'expérience dans l'accompagnement des entreprises au Mali."
    },
    {
      name: "Aminata KEITA",
      role: "Directrice Juridique",
      description: "Spécialiste en réglementation malienne et procédures administratives, diplômée de l'Université de Bamako."
    },
    {
      name: "Ibrahim SANGARE",
      role: "Responsable Technique",
      description: "Ingénieur logiciel passionné par la digitalisation des services publics et l'innovation technologique."
    },
    {
      name: "Fatoumata DIALLO",
      role: "Responsable Client",
      description: "Experte en relation client avec une approche centrée sur la satisfaction et l'accompagnement personnalisé."
    },
    {
      name: "Moussa COULIBALY",
      role: "Directeur Financier",
      description: "Expert-comptable certifié avec une expertise approfondie en gestion financière et fiscalité des entreprises."
    },
    {
      name: "Aïssata TOURE",
      role: "Responsable Marketing",
      description: "Spécialiste en marketing digital et communication, diplômée en sciences de gestion avec 8 ans d'expérience."
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-investmali-primary/10 overflow-x-hidden">
      {/* Hero Section */}
      <div ref={heroRef} className="bg-gradient-to-r from-investmali-primary to-investmali-accent text-white py-20 pt-20 sm:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6">
              À propos de l' API tMali
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed opacity-90">
              Votre partenaire de confiance pour simplifier et accélérer vos démarches d'investissement au Mali. 
              Nous transformons la complexité administrative en opportunités de croissance.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div ref={missionRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Notre Mission
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Démocratiser l'accès à l'entrepreneuriat au Mali en simplifiant les démarches administratives 
                grâce à une plateforme digitale innovante et un accompagnement expert.
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Nous croyons que chaque entrepreneur mérite un accès facile et transparent aux services 
                administratifs nécessaires pour concrétiser ses projets d'investissement.
              </p>
              <Link
                to="/services"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-investmali-primary to-investmali-accent text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <span>Découvrir nos services</span>
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-investmali-primary/10 to-investmali-accent/10 rounded-3xl p-8 shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
                    <BuildingOfficeIcon className="h-12 w-12 text-investmali-primary mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900">Création d'entreprise</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
                    <ShieldCheckIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900">Autorisations</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
                    <UsersIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900">Accompagnement</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
                    <GlobeAltIcon className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900">Digital</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message du Directeur */}
      <div ref={directorRef} className="bg-gradient-to-r from-investmali-primary/5 to-investmali-accent/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Vidéo de présentation */}
            <div className="relative director-photo">
              <div className="relative z-10">
                <div className="w-full mx-auto lg:mx-0 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-investmali-primary/20 to-investmali-accent/20">
                  <video 
                    controls autoPlay muted loop
                    className="w-full h-auto"
                    poster={apiLogo}
                  >
                    <source src={aboutVideo} type="video/quicktime" />
                    <source src={aboutVideo} type="video/mp4" />
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                </div>
              </div>
              {/* Éléments décoratifs */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-investmali-accent to-investmali-primary rounded-full opacity-15 animate-pulse delay-1000"></div>
            </div>

            {/* Message */}
            <div className="space-y-6 director-message">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Mot du Directeur
                </h2>
                <div className="w-20 h-1 bg-gradient-to-r from-investmali-primary to-investmali-accent rounded-full mb-8"></div>
              </div>
              
              <blockquote className="text-lg text-gray-700 leading-relaxed italic relative">
                <div className="absolute -top-4 -left-4 text-6xl text-blue-200 font-serif">"</div>
                <p className="mb-6 relative z-10">
                  Chez API Mali, nous croyons fermement que chaque entrepreneur mérite un accès simplifié 
                  aux services administratifs. Notre mission est de transformer la complexité bureaucratique 
                  en opportunités de croissance pour les entreprises maliennes.
                </p>
                <p className="mb-6 relative z-10">
                  Grâce à notre plateforme digitale innovante et à l'expertise de notre équipe, nous avons 
                  déjà accompagné plus de 500 entreprises dans leurs démarches. Nous continuons d'innover 
                  pour offrir des solutions toujours plus efficaces et accessibles.
                </p>
                <p className="relative z-10">
                  Ensemble, construisons l'écosystème entrepreneurial malien de demain.
                </p>
                <div className="absolute -bottom-2 -right-4 text-6xl text-blue-200 font-serif">"</div>
              </blockquote>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">M. Ibrahim Ahamadou TOURE</h4>
                    <p className="text-blue-600 font-semibold">Directeur Général</p>
                    {/* <p className="text-gray-600 text-sm">Expert en droit des affaires • 10+ ans d'expérience</p> */}
                  </div>
                </div>
              </div>

              {/* Signature stylisée */}
              {/* <div className="pt-4">
                <div className="w-48 h-16 bg-gradient-to-r from-investmali-primary to-investmali-accent rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl italic">A. Traoré</span>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div ref={statsRef} className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-investmali-primary mb-6">
              Nos Résultats en Chiffres
            </h2>
            <p className="text-xl text-investmali-neutral-600 max-w-3xl mx-auto">
              Des chiffres qui témoignent de notre engagement et de la confiance de nos clients.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {statistics.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="stat-card text-center bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:rotate-1 group">
                  <div className={`stat-icon w-20 h-20 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300`}>
                    <IconComponent className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-investmali-neutral-900 mb-2 group-hover:text-investmali-primary transition-colors duration-300">
                    <span data-counter={index}>0</span>
                  </div>
                  <div className="text-lg text-investmali-neutral-600 font-medium group-hover:text-investmali-neutral-700 transition-colors duration-300">{stat.label}</div>
                  
                  {/* Effet de particules au hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute top-4 right-4 w-2 h-2 bg-investmali-accent rounded-full animate-ping"></div>
                    <div className="absolute bottom-6 left-6 w-1 h-1 bg-investmali-secondary rounded-full animate-pulse delay-300"></div>
                    <div className="absolute top-1/2 left-4 w-1.5 h-1.5 bg-investmali-warning rounded-full animate-bounce delay-500"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div ref={valuesRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Nos Valeurs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Les principes qui guident notre action quotidienne et notre relation avec nos clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="value-card bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className={`w-16 h-16 bg-gradient-to-r ${value.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-investmali-primary to-investmali-accent rounded-3xl shadow-2xl p-12 text-white text-center">
            <h3 className="text-3xl font-bold mb-6">
              Rejoignez les entrepreneurs qui nous font confiance
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Commencez votre projet d'investissement au Mali avec l'accompagnement d'experts dédiés à votre réussite.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/demande"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
              >
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                Créer mon entreprise
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <ArrowRightIcon className="h-5 w-5 mr-2" />
                Voir nos services
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutPage;
=======
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '../styles/swiper-custom.css';
import { 
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  HeartIcon,
  TrophyIcon,
  ArrowRightIcon
} from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getColorClasses } from '../utils/colorUtils';

gsap.registerPlugin(ScrollTrigger);

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image?: string;
}

interface Statistic {
  number: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
}

const AboutPage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const directorRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const [hasAnimatedCounters, setHasAnimatedCounters] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animation du hero
      gsap.fromTo(heroRef.current,
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          ease: "power3.out"
        }
      );

      // Animation de la mission
      gsap.fromTo(missionRef.current,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: missionRef.current,
            start: "top 70%"
          }
        }
      );

      // Animation de la section directeur
      gsap.fromTo(".director-photo",
        { opacity: 0, scale: 0.8, rotation: -5 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: directorRef.current,
            start: "top 70%"
          }
        }
      );

      gsap.fromTo(".director-message",
        { opacity: 0, x: 50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          delay: 0.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: directorRef.current,
            start: "top 70%"
          }
        }
      );

      // Animation des statistiques avec compteurs
      gsap.fromTo(".stat-card",
        { opacity: 0, y: 50, scale: 0.8, rotationY: 45 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationY: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 80%",
            onEnter: () => {
              if (!hasAnimatedCounters) {
                // Délai pour laisser les cartes apparaître avant les compteurs
                setTimeout(() => {
                  animateCounters();
                  setHasAnimatedCounters(true);
                }, 500);
              }
            }
          }
        }
      );

      // Animation des icônes avec rotation
      gsap.fromTo(".stat-icon",
        { rotation: -180, scale: 0 },
        {
          rotation: 0,
          scale: 1,
          duration: 1,
          stagger: 0.2,
          ease: "elastic.out(1, 0.5)",
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 70%"
          }
        }
      );

      // Animation des valeurs
      gsap.fromTo(".value-card",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: valuesRef.current,
            start: "top 70%"
          }
        }
      );

      // Animation du slider d'équipe
      gsap.fromTo(".team-slider",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: teamRef.current,
            start: "top 70%"
          }
        }
      );

      // Animation des boutons de navigation
      gsap.fromTo(".swiper-button-prev-custom, .swiper-button-next-custom",
        { opacity: 0, scale: 0.5 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          delay: 0.3,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: teamRef.current,
            start: "top 70%"
          }
        }
      );
    });

    return () => ctx.revert();
  }, [hasAnimatedCounters]);

  const animateCounters = () => {
    statistics.forEach((stat, index) => {
      const element = document.querySelector(`[data-counter="${index}"]`);
      if (element) {
        const numericValue = parseInt(stat.number.replace(/[^0-9]/g, ''));
        
        // Initialize counter to 0
        element.textContent = '0';
        
        const obj = { value: 0 };
        gsap.to(obj, {
          value: numericValue,
          duration: 2.5,
          delay: index * 0.3,
          ease: "power2.out",
          onUpdate: () => {
            const currentValue = Math.round(obj.value);
            let displayValue = currentValue.toString();
            
            // Add suffix based on original format
            if (stat.number.includes('+')) displayValue += '+';
            if (stat.number.includes('%')) displayValue += '%';
            if (stat.number.includes('h')) displayValue += 'h';
            
            element.textContent = displayValue;
          },
          onComplete: () => {
            // Ensure final value is correct
            let finalValue = numericValue.toString();
            if (stat.number.includes('+')) finalValue += '+';
            if (stat.number.includes('%')) finalValue += '%';
            if (stat.number.includes('h')) finalValue += 'h';
            element.textContent = finalValue;
          }
        });
      }
    });
  };

  const statistics: Statistic[] = [
    {
      number: "500+",
      label: "Entreprises créées",
      icon: BuildingOfficeIcon,
      color: "from-investmali-primary to-investmali-primary-600"
    },
    {
      number: "1200+",
      label: "Clients satisfaits",
      icon: UsersIcon,
      color: "from-investmali-accent to-investmali-accent-600"
    },
    {
      number: "95%",
      label: "Taux de réussite",
      icon: ChartBarIcon,
      color: "from-investmali-secondary to-investmali-secondary-600"
    },
    {
      number: "24h",
      label: "Délai moyen",
      icon: GlobeAltIcon,
      color: "from-investmali-warning to-yellow-600"
    }
  ];

  const values = [
    {
      title: "Excellence",
      description: "Nous nous engageons à fournir des services de la plus haute qualité avec une attention méticuleuse aux détails.",
      icon: TrophyIcon,
      color: "from-yellow-500 to-yellow-600"
    },
    {
      title: "Innovation",
      description: "Nous utilisons les dernières technologies pour simplifier et accélérer vos démarches administratives.",
      icon: LightBulbIcon,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Intégrité",
      description: "Transparence, honnêteté et respect des réglementations sont au cœur de notre approche professionnelle.",
      icon: ShieldCheckIcon,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Engagement",
      description: "Nous nous investissons pleinement dans le succès de vos projets avec un accompagnement personnalisé.",
      icon: HeartIcon,
      color: "from-red-500 to-red-600"
    }
  ];

  const team: TeamMember[] = [
    {
      name: "Abdoul TRAORE",
      role: "Fondateur & CEO",
      description: "Expert en droit des affaires avec plus de 10 ans d'expérience dans l'accompagnement des entreprises au Mali."
    },
    {
      name: "Aminata KEITA",
      role: "Directrice Juridique",
      description: "Spécialiste en réglementation malienne et procédures administratives, diplômée de l'Université de Bamako."
    },
    {
      name: "Ibrahim SANGARE",
      role: "Responsable Technique",
      description: "Ingénieur logiciel passionné par la digitalisation des services publics et l'innovation technologique."
    },
    {
      name: "Fatoumata DIALLO",
      role: "Responsable Client",
      description: "Experte en relation client avec une approche centrée sur la satisfaction et l'accompagnement personnalisé."
    },
    {
      name: "Moussa COULIBALY",
      role: "Directeur Financier",
      description: "Expert-comptable certifié avec une expertise approfondie en gestion financière et fiscalité des entreprises."
    },
    {
      name: "Aïssata TOURE",
      role: "Responsable Marketing",
      description: "Spécialiste en marketing digital et communication, diplômée en sciences de gestion avec 8 ans d'expérience."
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-x-hidden">
      {/* Hero Section */}
      <div ref={heroRef} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 pt-20 sm:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6">
              À propos d'InvestMali
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed opacity-90">
              Votre partenaire de confiance pour simplifier et accélérer vos démarches d'investissement au Mali. 
              Nous transformons la complexité administrative en opportunités de croissance.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div ref={missionRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Notre Mission
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Démocratiser l'accès à l'entrepreneuriat au Mali en simplifiant les démarches administratives 
                grâce à une plateforme digitale innovante et un accompagnement expert.
              </p>
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Nous croyons que chaque entrepreneur mérite un accès facile et transparent aux services 
                administratifs nécessaires pour concrétiser ses projets d'investissement.
              </p>
              <Link
                to="/services"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <span>Découvrir nos services</span>
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl p-8 shadow-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
                    <BuildingOfficeIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900">Création d'entreprise</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
                    <ShieldCheckIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900">Autorisations</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
                    <UsersIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900">Accompagnement</h3>
                  </div>
                  <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
                    <GlobeAltIcon className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-900">Digital</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message du Directeur */}
      <div ref={directorRef} className="bg-gradient-to-r from-blue-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Photo du directeur */}
            <div className="relative director-photo">
              <div className="relative z-10">
                <div className="w-80 h-80 mx-auto lg:mx-0 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  {/* Placeholder pour la photo - remplacer par une vraie image */}
                  {/* 
                  Pour utiliser une vraie photo, décommentez cette ligne et ajoutez l'image dans public/images/ :
                  <img 
                    src="/images/director.jpg" 
                    alt="Abdoul TRAORE - Directeur Général"
                    className="w-full h-full object-cover"
                  />
                  */}
                  <div className="w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-white font-bold text-6xl">AT</span>
                  </div>
                </div>
              </div>
              {/* Éléments décoratifs */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-15 animate-pulse delay-1000"></div>
            </div>

            {/* Message */}
            <div className="space-y-6 director-message">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Mot du Directeur
                </h2>
                <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-8"></div>
              </div>
              
              <blockquote className="text-lg text-gray-700 leading-relaxed italic relative">
                <div className="absolute -top-4 -left-4 text-6xl text-blue-200 font-serif">"</div>
                <p className="mb-6 relative z-10">
                  Chez InvestMali, nous croyons fermement que chaque entrepreneur mérite un accès simplifié 
                  aux services administratifs. Notre mission est de transformer la complexité bureaucratique 
                  en opportunités de croissance pour les entreprises maliennes.
                </p>
                <p className="mb-6 relative z-10">
                  Grâce à notre plateforme digitale innovante et à l'expertise de notre équipe, nous avons 
                  déjà accompagné plus de 500 entreprises dans leurs démarches. Nous continuons d'innover 
                  pour offrir des solutions toujours plus efficaces et accessibles.
                </p>
                <p className="relative z-10">
                  Ensemble, construisons l'écosystème entrepreneurial malien de demain.
                </p>
                <div className="absolute -bottom-2 -right-4 text-6xl text-blue-200 font-serif">"</div>
              </blockquote>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Abdoul TRAORE</h4>
                    <p className="text-blue-600 font-semibold">Fondateur & Directeur Général</p>
                    <p className="text-gray-600 text-sm">Expert en droit des affaires • 10+ ans d'expérience</p>
                  </div>
                </div>
              </div>

              {/* Signature stylisée */}
              <div className="pt-4">
                <div className="w-48 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl italic">A. Traoré</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div ref={statsRef} className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-investmali-primary mb-6">
              Nos Résultats en Chiffres
            </h2>
            <p className="text-xl text-investmali-neutral-600 max-w-3xl mx-auto">
              Des chiffres qui témoignent de notre engagement et de la confiance de nos clients.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {statistics.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="stat-card text-center bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:rotate-1 group">
                  <div className={`stat-icon w-20 h-20 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300`}>
                    <IconComponent className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-investmali-neutral-900 mb-2 group-hover:text-investmali-primary transition-colors duration-300">
                    <span data-counter={index}>0</span>
                  </div>
                  <div className="text-lg text-investmali-neutral-600 font-medium group-hover:text-investmali-neutral-700 transition-colors duration-300">{stat.label}</div>
                  
                  {/* Effet de particules au hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute top-4 right-4 w-2 h-2 bg-investmali-accent rounded-full animate-ping"></div>
                    <div className="absolute bottom-6 left-6 w-1 h-1 bg-investmali-secondary rounded-full animate-pulse delay-300"></div>
                    <div className="absolute top-1/2 left-4 w-1.5 h-1.5 bg-investmali-warning rounded-full animate-bounce delay-500"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div ref={valuesRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Nos Valeurs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Les principes qui guident notre action quotidienne et notre relation avec nos clients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="value-card bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className={`w-16 h-16 bg-gradient-to-r ${value.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div ref={teamRef} className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Notre Équipe
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des experts passionnés et dévoués à votre succès, combinant expertise technique et connaissance du marché malien.
            </p>
          </div>

          <div className="relative">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={30}
              slidesPerView={1}
              navigation={{
                nextEl: '.swiper-button-next-custom',
                prevEl: '.swiper-button-prev-custom',
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                },
                768: {
                  slidesPerView: 2,
                },
                1024: {
                  slidesPerView: 3,
                },
                1280: {
                  slidesPerView: 4,
                }
              }}
              className="team-slider"
            >
              {team.map((member, index) => (
                <SwiperSlide key={index}>
                  <div className="team-card bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <span className="text-white font-bold text-2xl">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{member.name}</h3>
                    <p className="text-blue-600 font-semibold mb-4 text-center">{member.role}</p>
                    <p className="text-gray-600 text-sm leading-relaxed text-center">{member.description}</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Boutons de navigation personnalisés */}
            <div className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-all duration-300 group">
              <svg className="w-6 h-6 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <div className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-all duration-300 group">
              <svg className="w-6 h-6 text-blue-600 group-hover:text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-12 text-white text-center">
            <h3 className="text-3xl font-bold mb-6">
              Rejoignez les entrepreneurs qui nous font confiance
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Commencez votre projet d'investissement au Mali avec l'accompagnement d'experts dédiés à votre réussite.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/demande"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
              >
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                Créer mon entreprise
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <ArrowRightIcon className="h-5 w-5 mr-2" />
                Voir nos services
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
};

export default AboutPage;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
