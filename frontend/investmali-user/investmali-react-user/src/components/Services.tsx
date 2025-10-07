import React, { useEffect, useRef } from 'react';
import { FaBuilding, FaShieldAlt } from 'react-icons/fa';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
  price: string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, title, description, delay, price }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 services-card-anim">
      <div className="w-16 h-16 bg-gradient-to-br from-investmali-primary to-investmali-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 text-investmali-primary">{title}</h3>
      <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
      <div className="flex items-center justify-between text-investmali-primary font-medium">
        <span>Délai : {delay}</span>
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </div>
      <div className="mt-4 text-investmali-secondary font-bold text-xl">{price}</div>
    </div>
  );
};

const Services: React.FC = () => {
  const servicesRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animation du titre et sous-titre avec ScrollTrigger
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );

      gsap.fromTo(subtitleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          delay: 0.2,
          scrollTrigger: {
            trigger: subtitleRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Animation des cartes de service avec stagger
      gsap.fromTo(cardsRef.current?.children || [],
        { 
          opacity: 0, 
          y: 60,
          scale: 0.9
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          stagger: 0.2,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Animation de hover pour les cartes
      const cards = cardsRef.current?.children;
      if (cards) {
        Array.from(cards).forEach((card) => {
          const cardElement = card as HTMLElement;
          
          cardElement.addEventListener('mouseenter', () => {
            gsap.to(cardElement, {
              y: -10,
              scale: 1.05,
              duration: 0.3,
              ease: "power2.out"
            });
          });

          cardElement.addEventListener('mouseleave', () => {
            gsap.to(cardElement, {
              y: 0,
              scale: 1,
              duration: 0.3,
              ease: "power2.out"
            });
          });
        });
      }

    }, servicesRef);

    return () => ctx.revert();
  }, []);

  const ServiceIcon = ({ IconComponent }: { IconComponent: any }) => (
    <IconComponent className="w-8 h-8 text-white" />
  );

  const services = [
    {
      icon: <ServiceIcon IconComponent={FaBuilding} />,
      title: "Création d'entreprise",
      description: "Créez votre entreprise en ligne avec tous les documents officiels. Processus 100% digitalisé avec suivi en temps réel et accompagnement personnalisé.",
      delay: "24h à 7 jours",
      price: "À partir de 40 000 FCFA"
    },
    {
      icon: <ServiceIcon IconComponent={FaShieldAlt} />,
      title: "Autorisation d'exercice",
      description: "Obtenez toutes vos autorisations d'exercice : enregistrement sectoriel, décisions administratives et agréments spécialisés pour votre domaine d'activité.",
      delay: "5 à 30 jours",
      price: "À partir de 75 000 FCFA"
    }
  ];

  return (
    <section ref={servicesRef} className="py-20 bg-white" style={{ marginTop: '-20rem' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 ref={titleRef} className="text-4xl font-extrabold text-mali-dark mb-4">
            Nos Services
          </h2>
          <p ref={subtitleRef} className="text-xl text-gray-600 max-w-3xl mx-auto">
            Une gamme complète de services pour accompagner votre projet d'investissement au Mali
          </p>
        </div>
        
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 gap-x-16 justify-center">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
              delay={service.delay}
              price={service.price}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
