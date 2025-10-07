import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      title: 'Demande NINA',
      description: 'Obtenez votre numéro d\'identification nationale',
      path: '/nina/request',
      icon: <BadgeIcon sx={{ fontSize: 40 }} />,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Modification NINA',
      description: 'Mettez à jour vos informations NINA',
      path: '/nina/update',
      icon: <EditNoteIcon sx={{ fontSize: 40 }} />,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Duplicata NINA',
      description: 'Demandez un duplicata de votre carte NINA',
      path: '/nina/duplicate',
      icon: <ContentCopyIcon sx={{ fontSize: 40 }} />,
      color: 'from-purple-500 to-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Faire une demande
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Sélectionnez le type de demande que vous souhaitez effectuer
          </p>
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
      </div>
    </div>
  );
};

export default DemandePage;
