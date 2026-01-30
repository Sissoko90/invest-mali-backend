<<<<<<< HEAD
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Service {
  id: string;
  title: string;
  description: string;
  features: string[];
  price: string;
  duration: string;
  icon: React.ComponentType<any>;
  color: string;
}

const ServicesPage: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animation du header
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 80%"
          }
        }
      );

      // Animation des cartes de services
      gsap.fromTo(".service-card",
        { opacity: 0, y: 30, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: servicesRef.current,
            start: "top 70%"
          }
        }
      );

      // Animation du CTA
      gsap.fromTo(ctaRef.current,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%"
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const services: Service[] = [
    {
      id: 'creation-entreprise',
      title: 'Création d\'entreprise',
      description: 'Créez votre entreprise en ligne avec tous les documents officiels. Processus 100% digitalisé avec suivi en temps réel.',
      features: [
        'Rédaction des statuts personnalisés',
        'Enregistrement au RCCM',
        'Obtention du NIF',
        'Déclaration fiscale initiale',
        'Suivi en temps réel',
        'Support client dédié'
      ],
      price: 'À partir de 40 000 FCFA',
      duration: '24h à 7 jours',
      icon: BuildingOfficeIcon,
      color: 'from-investmali-primary to-investmali-accent'
    },
    {
      id: 'autorisation-exercice',
      title: 'Autorisation d\'exercice',
      description: 'Obtenez toutes vos autorisations d\'exercice pour votre domaine d\'activité spécialisé.',
      features: [
        'Enregistrement sectoriel',
        'Décisions administratives',
        'Agréments spécialisés',
        'Conformité réglementaire',
        'Accompagnement personnalisé',
        'Renouvellement automatique'
      ],
      price: 'À partir de 75 000 FCFA',
      duration: '5 à 30 jours',
      icon: DocumentTextIcon,
      color: 'from-green-500 to-green-700'
    },
    {
      id: 'conseil-juridique',
      title: 'Conseil juridique et réglementaire',
      description: 'Nous accompagnons les dirigeants, promoteurs et investisseurs dans les démarches juridiques et réglementaires liées à la création et au développement de leurs entreprises, conformément aux textes en vigueur au Mali.',
      features: [
        'Information et orientation juridique pour la création d’entreprise',
        'Vérification de la conformité des dossiers (statuts, pièces administratives)',
        'Assistance à la formalisation des entreprises',
        'Information sur la réglementation applicable aux investissements',
        'Appui à la compréhension des obligations légales et fiscales',
        'Veille sur les évolutions réglementaires liées à l’investissement'
      ],
      price: 'À partir de 25 000 FCFA',
      duration: '1 à 5 jours',
      icon: CheckCircleIcon,
      color: 'from-investmali-primary to-investmali-accent'
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-investmali-primary/10 overflow-x-hidden">
      {/* Header */}
      <div ref={headerRef} className="bg-gradient-to-r from-investmali-primary to-investmali-accent text-white py-20 pt-20 sm:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6">
            Nos Services
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed opacity-90">
           Tous les services nécessaires pour accompagner votre projet d’investissement au Mali.
            De la création d'entreprise aux autorisations spécialisées, nous simplifions vos démarches administratives.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div ref={servicesRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {services.map((service) => {
              const IconComponent = service.icon;
              return (
                <div key={service.id} className="service-card bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                  {/* Header de la carte */}
                  <div className={`bg-gradient-to-r ${service.color} p-8 text-white`}>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{service.title}</h3>
                      </div>
                    </div>
                    <p className="text-white/90 leading-relaxed">{service.description}</p>
                  </div>

                  {/* Contenu de la carte */}
                  <div className="p-8">
                    {/* Fonctionnalités */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Nos interventions couvrent notamment :</h4>
                      <ul className="space-y-3">
                        {service.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prix et durée */}
                    <div className="border-t border-gray-100 pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">Prix</span>
                        </div>
                        <span className="font-bold text-green-600">{service.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-5 w-5 text-blue-600" />
                          <span className="text-sm text-gray-600">Délai</span>
                        </div>
                        <span className="font-bold text-blue-600">{service.duration}</span>
                      </div>
                    </div>

                    {/* Bouton d'action */}
                    <div className="mt-8">
                      <Link
                        to="/demande"
                        className={`w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r ${service.color} text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold`}
                      >
                        <span>Commencer maintenant</span>
                        <ArrowRightIcon className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section Avantages */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Pourquoi choisir InvestMali ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nous simplifions vos démarches administratives avec une approche moderne et efficace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-investmali-primary to-investmali-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rapidité</h3>
              <p className="text-gray-600">
                Processus digitalisé pour des démarches 3x plus rapides que les méthodes traditionnelles.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 from-investmali-primary to-investmali-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Fiabilité</h3>
              <p className="text-gray-600">
                Expertise juridique et conformité garantie avec les réglementations maliennes en vigueur.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-investmali-primary to-investmali-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
                <PhoneIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Support</h3>
              <p className="text-gray-600">
                Accompagnement personnalisé à chaque étape avec notre équipe d'experts dédiés.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div ref={ctaRef} className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-investmali-primary to-investmali-accent rounded-3xl shadow-2xl p-12 text-white text-center">
            <h3 className="text-3xl font-bold mb-6">
              Prêt à démarrer votre projet ?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Contactez-nous dès aujourd'hui pour une consultation gratuite et personnalisée.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/demande"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Faire une demande
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <PhoneIcon className="h-5 w-5 mr-2" />
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
};

export default ServicesPage;
=======
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  BuildingOfficeIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Service {
  id: string;
  title: string;
  description: string;
  features: string[];
  price: string;
  duration: string;
  icon: React.ComponentType<any>;
  color: string;
}

const ServicesPage: React.FC = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animation du header
      gsap.fromTo(headerRef.current,
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 80%"
          }
        }
      );

      // Animation des cartes de services
      gsap.fromTo(".service-card",
        { opacity: 0, y: 30, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: servicesRef.current,
            start: "top 70%"
          }
        }
      );

      // Animation du CTA
      gsap.fromTo(ctaRef.current,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 80%"
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const services: Service[] = [
    {
      id: 'creation-entreprise',
      title: 'Création d\'entreprise',
      description: 'Créez votre entreprise en ligne avec tous les documents officiels. Processus 100% digitalisé avec suivi en temps réel.',
      features: [
        'Rédaction des statuts personnalisés',
        'Enregistrement au RCCM',
        'Obtention du NIF',
        'Déclaration fiscale initiale',
        'Suivi en temps réel',
        'Support client dédié'
      ],
      price: 'À partir de 40 000 FCFA',
      duration: '24h à 7 jours',
      icon: BuildingOfficeIcon,
      color: 'from-blue-500 to-blue-700'
    },
    {
      id: 'autorisation-exercice',
      title: 'Autorisation d\'exercice',
      description: 'Obtenez toutes vos autorisations d\'exercice pour votre domaine d\'activité spécialisé.',
      features: [
        'Enregistrement sectoriel',
        'Décisions administratives',
        'Agréments spécialisés',
        'Conformité réglementaire',
        'Accompagnement personnalisé',
        'Renouvellement automatique'
      ],
      price: 'À partir de 75 000 FCFA',
      duration: '5 à 30 jours',
      icon: DocumentTextIcon,
      color: 'from-green-500 to-green-700'
    },
    {
      id: 'conseil-juridique',
      title: 'Conseil juridique et réglementaire',
      description: 'Nous accompagnons les dirigeants, promoteurs et investisseurs dans les démarches juridiques et réglementaires liées à la création et au développement de leurs entreprises, conformément aux textes en vigueur au Mali.',
      features: [
        'Information et orientation juridique pour la création d’entreprise',
        'Vérification de la conformité des dossiers (statuts, pièces administratives)',
        'Assistance à la formalisation des entreprises',
        'Information sur la réglementation applicable aux investissements',
        'Appui à la compréhension des obligations légales et fiscales',
        'Veille sur les évolutions réglementaires liées à l’investissement'
      ],
      price: 'À partir de 25 000 FCFA',
      duration: '1 à 5 jours',
      icon: CheckCircleIcon,
      color: 'from-purple-500 to-purple-700'
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-x-hidden">
      {/* Header */}
      <div ref={headerRef} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 pt-20 sm:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6">
            Nos Services
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed opacity-90">
           Tous les services nécessaires pour accompagner votre projet d’investissement au Mali.
            De la création d'entreprise aux autorisations spécialisées, nous simplifions vos démarches administratives.
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div ref={servicesRef} className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {services.map((service) => {
              const IconComponent = service.icon;
              return (
                <div key={service.id} className="service-card bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                  {/* Header de la carte */}
                  <div className={`bg-gradient-to-r ${service.color} p-8 text-white`}>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{service.title}</h3>
                      </div>
                    </div>
                    <p className="text-white/90 leading-relaxed">{service.description}</p>
                  </div>

                  {/* Contenu de la carte */}
                  <div className="p-8">
                    {/* Fonctionnalités */}
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Nos interventions couvrent notamment :</h4>
                      <ul className="space-y-3">
                        {service.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prix et durée */}
                    <div className="border-t border-gray-100 pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-600">Prix</span>
                        </div>
                        <span className="font-bold text-green-600">{service.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-5 w-5 text-blue-600" />
                          <span className="text-sm text-gray-600">Délai</span>
                        </div>
                        <span className="font-bold text-blue-600">{service.duration}</span>
                      </div>
                    </div>

                    {/* Bouton d'action */}
                    <div className="mt-8">
                      <Link
                        to="/demande"
                        className={`w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r ${service.color} text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 font-semibold`}
                      >
                        <span>Commencer maintenant</span>
                        <ArrowRightIcon className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section Avantages */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Pourquoi choisir InvestMali ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nous simplifions vos démarches administratives avec une approche moderne et efficace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rapidité</h3>
              <p className="text-gray-600">
                Processus digitalisé pour des démarches 3x plus rapides que les méthodes traditionnelles.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Fiabilité</h3>
              <p className="text-gray-600">
                Expertise juridique et conformité garantie avec les réglementations maliennes en vigueur.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <PhoneIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Support</h3>
              <p className="text-gray-600">
                Accompagnement personnalisé à chaque étape avec notre équipe d'experts dédiés.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div ref={ctaRef} className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-12 text-white text-center">
            <h3 className="text-3xl font-bold mb-6">
              Prêt à démarrer votre projet ?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Contactez-nous dès aujourd'hui pour une consultation gratuite et personnalisée.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/demande"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg"
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Faire une demande
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105 font-semibold"
              >
                <PhoneIcon className="h-5 w-5 mr-2" />
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
};

export default ServicesPage;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
