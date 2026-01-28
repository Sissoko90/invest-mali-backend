import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const DemandePage: React.FC = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Création d\'entreprise',
      description: 'Démarrez votre entreprise en toute simplicité',
      path: '/create-business',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Demande de NINA',
      description: 'Obtenez votre autorisation d\'exercice',
      path: '/autorisation-exercice',
      icon: <BadgeIcon sx={{ fontSize: 40 }} />,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Modification NINA',
      description: 'Mettez à jour vos informations de NINA',
      path: '/nina/update',
      icon: <EditNoteIcon sx={{ fontSize: 40 }} />,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Demande de duplicata NINA',
      description: 'Demandez un duplicata de votre NINA',
      path: '/nina/duplicate',
      icon: <ContentCopyIcon sx={{ fontSize: 40 }} />,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 pt-20 sm:pt-24 lg:pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6">
            Faire une demande
          </h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed opacity-90">
            Démarrez votre projet d'investissement au Mali en quelques clics. 
            Choisissez le service qui correspond à vos besoins et laissez-nous vous accompagner dans vos démarches administratives.
          </p>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* Section d'introduction */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
           Plateforme de services en ligne
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
           Soumettez vos informations et obtenez tous les documents officiels requis via une
            plateforme sécurisée.
          </p>
          <div className="flex justify-center">
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(card.path)}
            >
              <div className={`h-2 bg-gradient-to-r ${card.color}`}></div>
              <div className="p-6">
                <div className="mb-4 text-investmali-primary">{card.icon}</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h2>
                <p className="text-gray-600">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Section d'aide */}
        <div className="mt-20">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-12 text-center border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Besoin d'aide pour choisir ?
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Notre équipe d'experts est là pour vous conseiller et vous accompagner 
              dans le choix du service le plus adapté à votre projet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={() => navigate('/contact')}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Contacter un conseiller</span>
              </motion.button>
              <motion.button
                onClick={() => navigate('/activites-reglementees')}
                className="inline-flex items-center px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-105 font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Voir les activités réglementées</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
};

export default DemandePage;
