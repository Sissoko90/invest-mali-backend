<<<<<<< HEAD
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PhoneInput from '../components/PhoneInput';
import { getColorClasses, getButtonClasses, getTextClasses } from '../utils/colorUtils';
import { buildApiUrl, API_ENDPOINTS } from '../config/api.config';
import { 
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  BuildingOfficeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ContactInfo {
  icon: React.ComponentType<any>;
  title: string;
  details: string[];
  color: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

      // Animation du formulaire
      gsap.fromTo(".contact-form",
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: formRef.current,
            start: "top 70%"
          }
        }
      );

      // Animation des informations de contact
      gsap.fromTo(".contact-info-card",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: infoRef.current,
            start: "top 70%"
          }
        }
      );

      // Animation de la carte
      gsap.fromTo(".map-container",
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: mapRef.current,
            start: "top 70%"
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const contactInfo: ContactInfo[] = [
    {
      icon: PhoneIcon,
      title: "Téléphone",
      details: ["+223 20 22 XX XX", "+223 76 XX XX XX"],
      color: "from-investmali-accent to-investmali-accent-600"
    },
    {
      icon: EnvelopeIcon,
      title: "Email",
      details: ["formalisation@apimali.gov.ml", ""],
      color: "from-investmali-primary to-investmali-primary-600"
    },
    {
      icon: MapPinIcon,
      title: "Adresse",
      details: ["Quartier du Fleuve", "Bamako, Mali"],
      color: "from-investmali-secondary to-investmali-secondary-600"
    },
    {
      icon: ClockIcon,
      title: "Horaires",
      details: ["Lun - Jeu: 7h30 - 16h30", "Ven: 7h30 - 17h30"],
      color: "from-investmali-warning to-yellow-600"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Validation du téléphone
    console.log('FormData avant envoi:', formData);
    if (!formData.phone || formData.phone.trim() === '') {
      console.error('Téléphone vide:', formData.phone);
      alert('Veuillez saisir un numéro de téléphone');
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      // Appel à l'API de contact
      const response = await fetch(buildApiUrl(API_ENDPOINTS.CONTACT.SEND), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error(data.message || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
        {/* Hero Section */}
        <div ref={heroRef} className="bg-gradient-to-r from-investmali-primary to-investmali-accent text-white py-20 pt-20 sm:pt-24 lg:pt-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6">
              Contactez-nous
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed opacity-90">
              Notre équipe d'experts est à votre disposition pour répondre à toutes vos questions 
              et vous accompagner dans vos projets d'investissement au Mali.
            </p>
          </div>
        </div>

        {/* Contact Form & Info Section */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Formulaire de contact */}
              <div ref={formRef}>
                <div className="contact-form bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Envoyez-nous un message
                    </h2>
                    <p className="text-gray-600">
                      Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                          Nom complet *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-investmali-accent focus:border-transparent transition-all duration-300"
                          placeholder="Votre nom complet"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                          Email <span className="text-gray-500 text-xs">(optionnel)</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-investmali-accent focus:border-transparent transition-all duration-300"
                          placeholder="votre@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                        Téléphone *
                      </label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                        placeholder="XX XX XX XX"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                        Sujet *
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-00 rounded-xl focus:ring-2 focus:ring-investmali-accent focus:border-transparent transition-all duration-300"
                      >
                        <option value="">Sélectionnez un sujet</option>
                        <option value="creation-entreprise">Création d'entreprise</option>
                        <option value="autorisation-exercice">Autorisation d'exercice</option>
                        <option value="conseil-juridique">Conseil juridique</option>
                        <option value="support-technique">Support technique</option>
                        <option value="partenariat">Partenariat</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-investmali-accent focus:border-transparent transition-all duration-300 resize-none"
                        placeholder="Décrivez votre projet ou votre question en détail..."
                      />
                    </div>

                    {/* Status Messages */}
                    {submitStatus === 'success' && (
                      <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        <p className="text-green-700 font-medium">
                          Votre message a été envoyé avec succès ! Nous vous répondrons bientôt.
                        </p>
                      </div>
                    )}

                    {submitStatus === 'error' && (
                      <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                        <p className="text-red-700 font-medium">
                          Une erreur s'est produite. Veuillez réessayer ou nous contacter directement.
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full flex items-center justify-center space-x-3 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                        isSubmitting 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-investmali-primary to-investmali-accent hover:from-investmali-primary-dark hover:to-investmali-accent-dark'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Envoi en cours...</span>
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-5 w-5" />
                          <span>Envoyer le message</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Informations de contact */}
              <div ref={infoRef} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Nos coordonnées
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Plusieurs moyens de nous joindre pour répondre à tous vos besoins.
                  </p>
                </div>

                <div className="grid gap-6">
                  {contactInfo.map((info, index) => {
                    const IconComponent = info.icon;
                    return (
                      <div key={index} className="contact-info-card bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${info.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{info.title}</h3>
                            {info.details.map((detail, idx) => (
                              <p key={idx} className="text-gray-600">{detail}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-investmali-primary to-investmali-accent rounded-2xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">
                    Besoin d'aide immédiate ?
                  </h3>
                  <p className="mb-6 opacity-90">
                    Notre équipe est disponible pour vous accompagner dans vos démarches.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href="tel:+22320221234"
                      className="inline-flex items-center justify-center px-6 py-3 bg-white text-investmali-primary rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-semibold"
                    >
                      <PhoneIcon className="h-5 w-5 mr-2" />
                      Appeler maintenant
                    </a>
                    <Link
                      to="/demande"
                      className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white rounded-xl hover:bg-white hover:text-investmali-primary transition-all duration-300 transform hover:scale-105 font-semibold"
                    >
                      <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                      Faire une demande
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div ref={mapRef} className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Notre localisation
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Venez nous rendre visite dans nos bureaux au cœur de Bamako.
              </p>
            </div>

            <div className="map-container rounded-3xl overflow-hidden shadow-2xl">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3880.6866991893044!2d-6.250873324915513!3d13.431709686927608!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xe48a9c84b63952f%3A0xa93320d55f9dcd2b!2sAPI%20Mali!5e0!3m2!1sfr!2sml!4v1766053176680!5m2!1sfr!2sml" 
                width="100%" 
                height="450" 
                style={{border: 0}} 
                allowFullScreen={true}
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Localisation InvestMali - API Mali, Quartier du Fleuve, Bamako"
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContactPage;
=======
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getColorClasses, getButtonClasses, getTextClasses } from '../utils/colorUtils';
import { 
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  BuildingOfficeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ContactInfo {
  icon: React.ComponentType<any>;
  title: string;
  details: string[];
  color: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const ContactPage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

      // Animation du formulaire
      gsap.fromTo(".contact-form",
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: formRef.current,
            start: "top 70%"
          }
        }
      );

      // Animation des informations de contact
      gsap.fromTo(".contact-info-card",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: infoRef.current,
            start: "top 70%"
          }
        }
      );

      // Animation de la carte
      gsap.fromTo(".map-container",
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: mapRef.current,
            start: "top 70%"
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const contactInfo: ContactInfo[] = [
    {
      icon: PhoneIcon,
      title: "Téléphone",
      details: ["+223 20 22 XX XX", "+223 76 XX XX XX"],
      color: "from-investmali-accent to-investmali-accent-600"
    },
    {
      icon: EnvelopeIcon,
      title: "Email",
      details: ["contact@investmali.com", "support@investmali.com"],
      color: "from-investmali-primary to-investmali-primary-600"
    },
    {
      icon: MapPinIcon,
      title: "Adresse",
      details: ["Quartier du Fleuve", "Bamako, Mali"],
      color: "from-investmali-secondary to-investmali-secondary-600"
    },
    {
      icon: ClockIcon,
      title: "Horaires",
      details: ["Lun - Ven: 8h00 - 17h00", "Sam: 8h00 - 12h00"],
      color: "from-investmali-warning to-yellow-600"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulation d'envoi - remplacer par votre API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ici, vous pouvez ajouter l'appel à votre API de contact
      console.log('Données du formulaire:', formData);
      
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 overflow-x-hidden">
        {/* Hero Section */}
        <div ref={heroRef} className="bg-gradient-to-r from-investmali-primary to-investmali-accent text-white py-20 pt-20 sm:pt-24 lg:pt-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6">
              Contactez-nous
            </h1>
            <p className="text-xl max-w-3xl mx-auto leading-relaxed opacity-90">
              Notre équipe d'experts est à votre disposition pour répondre à toutes vos questions 
              et vous accompagner dans vos projets d'investissement au Mali.
            </p>
          </div>
        </div>

        {/* Contact Form & Info Section */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Formulaire de contact */}
              <div ref={formRef}>
                <div className="contact-form bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Envoyez-nous un message
                    </h2>
                    <p className="text-gray-600">
                      Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                          Nom complet *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-investmali-primary rounded-xl focus:ring-2 focus:ring-investmali-primary focus:border-transparent transition-all duration-300"
                          placeholder="Votre nom complet"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          placeholder="votre@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          placeholder="+223 XX XX XX XX"
                        />
                      </div>
                      <div>
                        <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                          Sujet *
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        >
                          <option value="">Sélectionnez un sujet</option>
                          <option value="creation-entreprise">Création d'entreprise</option>
                          <option value="autorisation-exercice">Autorisation d'exercice</option>
                          <option value="conseil-juridique">Conseil juridique</option>
                          <option value="support-technique">Support technique</option>
                          <option value="partenariat">Partenariat</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-investmali-primary focus:border-transparent transition-all duration-300 resize-none"
                        placeholder="Décrivez votre projet ou votre question en détail..."
                      />
                    </div>

                    {/* Status Messages */}
                    {submitStatus === 'success' && (
                      <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        <p className="text-green-700 font-medium">
                          Votre message a été envoyé avec succès ! Nous vous répondrons bientôt.
                        </p>
                      </div>
                    )}

                    {submitStatus === 'error' && (
                      <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                        <p className="text-red-700 font-medium">
                          Une erreur s'est produite. Veuillez réessayer ou nous contacter directement.
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full flex items-center justify-center space-x-3 px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                        isSubmitting 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-investmali-primary to-investmali-accent hover:from-investmali-primary-dark hover:to-investmali-accent-dark'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Envoi en cours...</span>
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-5 w-5" />
                          <span>Envoyer le message</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Informations de contact */}
              <div ref={infoRef} className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    Nos coordonnées
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    Plusieurs moyens de nous joindre pour répondre à tous vos besoins.
                  </p>
                </div>

                <div className="grid gap-6">
                  {contactInfo.map((info, index) => {
                    const IconComponent = info.icon;
                    return (
                      <div key={index} className="contact-info-card bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${info.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{info.title}</h3>
                            {info.details.map((detail, idx) => (
                              <p key={idx} className="text-gray-600">{detail}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-investmali-primary to-investmali-accent rounded-2xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">
                    Besoin d'aide immédiate ?
                  </h3>
                  <p className="mb-6 opacity-90">
                    Notre équipe est disponible pour vous accompagner dans vos démarches.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href="tel:+22320221234"
                      className="inline-flex items-center justify-center px-6 py-3 bg-white text-investmali-primary rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 font-semibold"
                    >
                      <PhoneIcon className="h-5 w-5 mr-2" />
                      Appeler maintenant
                    </a>
                    <Link
                      to="/demande"
                      className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white rounded-xl hover:bg-white hover:text-investmali-primary transition-all duration-300 transform hover:scale-105 font-semibold"
                    >
                      <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                      Faire une demande
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div ref={mapRef} className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Notre localisation
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Venez nous rendre visite dans nos bureaux au cœur de Bamako.
              </p>
            </div>

            <div className="map-container rounded-3xl overflow-hidden shadow-2xl">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3880.6866991893044!2d-6.250873324915513!3d13.431709686927608!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xe48a9c84b63952f%3A0xa93320d55f9dcd2b!2sAPI%20Mali!5e0!3m2!1sfr!2sml!4v1766053176680!5m2!1sfr!2sml" 
                width="100%" 
                height="450" 
                style={{border: 0}} 
                allowFullScreen={true}
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Localisation InvestMali - API Mali, Quartier du Fleuve, Bamako"
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContactPage;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
