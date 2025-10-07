import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DeclarationData {
  nom: string;
  prenom: string;
  faitA: string;
  date: string;
  signatureDataUrl?: string;
}

const DeclarationHonneur: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const declarationRef = useRef<HTMLDivElement>(null);
  
  // Récupérer les données du participant depuis sessionStorage ou location.state
  const getParticipantData = () => {
    // D'abord essayer sessionStorage (nouvelle fenêtre)
    const storedData = sessionStorage.getItem('declarationParticipantData');
    if (storedData) {
      try {
        return JSON.parse(storedData);
      } catch (e) {
        console.error('Erreur parsing sessionStorage:', e);
      }
    }
    // Fallback vers location.state (ancienne méthode)
    return location.state?.participantData || { nom: '', prenom: '' };
  };
  
  const participantData = getParticipantData();
  
  const [formData, setFormData] = useState<DeclarationData>({
    nom: participantData.nom || '',
    prenom: participantData.prenom || '',
    faitA: 'Bamako', // Valeur par défaut
    date: new Date().toLocaleDateString('fr-FR'), // Date automatique
    signatureDataUrl: participantData.signatureDataUrl || undefined
  });

  const [showPreview, setShowPreview] = useState(false);

  // Nettoyer sessionStorage quand la fenêtre se ferme
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('declarationParticipantData');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Nettoyer aussi au démontage du composant
      sessionStorage.removeItem('declarationParticipantData');
    };
  }, []);

  const handleInputChange = (field: keyof DeclarationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleDownloadPDF = async () => {
    if (!declarationRef.current) return;

    try {
      // Capturer le contenu HTML en canvas
      const canvas = await html2canvas(declarationRef.current, {
        useCORS: true,
        allowTaint: true,
        width: declarationRef.current.scrollWidth,
        height: declarationRef.current.scrollHeight
      });

      // Créer le PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Télécharger le PDF
      pdf.save(`Declaration_Honneur_${formData.nom}_${formData.prenom}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const handleReturnToForm = () => {
    navigate(-1); // Retour à la page précédente
  };


  if (!showPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mali-emerald/10 to-mali-gold/10 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Déclaration sur l'Honneur
              </h1>
              <p className="text-gray-600">
                Remplissez les informations pour générer votre déclaration
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => handleInputChange('nom', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Votre nom de famille"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => handleInputChange('prenom', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Votre prénom"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fait à *
                </label>
                <input
                  type="text"
                  value={formData.faitA}
                  onChange={(e) => handleInputChange('faitA', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mali-emerald focus:border-transparent"
                  placeholder="Ville où la déclaration est faite"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date (générée automatiquement)
                </label>
                <input
                  type="text"
                  value={formData.date}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleReturnToForm}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
              >
                Retour
              </button>
              <button
                onClick={handlePreview}
                disabled={!formData.nom || !formData.prenom || !formData.faitA}
                className="flex-1 bg-mali-emerald hover:bg-mali-emerald/90 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Prévisualiser
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mali-emerald/10 to-mali-gold/10 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Prévisualisation de la Déclaration
            </h1>
            <p className="text-gray-600">
              Vérifiez les informations avant de télécharger
            </p>
          </div>

          {/* Déclaration à imprimer */}
          <div ref={declarationRef} className="bg-white p-12 border border-gray-300 mx-auto max-w-3xl">
            <div className="text-center mb-8">
              <div className="border border-black px-4 py-2 inline-block mb-6">
                <span className="font-bold text-lg">APIEx</span>
              </div>
              
              <h2 className="text-xl font-bold mb-4">
                DÉCLARATION SUR L'HONNEUR
              </h2>
              
              <p className="text-sm mb-6">
                (Art. 45, 47 de l'Acte Uniforme portant sur le Droit Commercial Général OHADA)
              </p>
            </div>

            <div className="space-y-6 text-justify leading-relaxed">
              <p>Je soussigné(e),</p>
              
              <div className="space-y-2">
                <p>Nom : <span className="border-b border-dotted border-black pb-1 inline-block min-w-[300px]">{formData.nom}</span></p>
                <p>Prénom : <span className="border-b border-dotted border-black pb-1 inline-block min-w-[300px]">{formData.prenom}</span></p>
              </div>

              <p className="mt-6">
                Demandant l'immatriculation au Registre du Commerce et du Crédit Mobilier.
              </p>

              <p>
                Déclare sur l'honneur n'avoir jamais fait l'objet d'une condamnation définitive à une peine 
                privative de liberté pour un crime ou un délit de droit commun, ou à une peine d'au moins trois mois 
                d'emprisonnement non assortie de sursis pour un délit contre les biens ou une infraction en 
                matière économique ou financière.
              </p>

              <p>
                Suis informé devoir fournir dans un délai de 75 jours à compter de l'immatriculation au 
                registre du commerce et du crédit mobilier un extrait de casier judiciaire ou tout document 
                qui en tient lieu conformément aux articles 45, 47 de l'Acte Uniforme portant sur le Droit 
                Commercial Général (OHADA).
              </p>

              <div className="mt-12 space-y-4">
                <p>Fait à : <span className="border-b border-dotted border-black pb-1 inline-block min-w-[200px]">{formData.faitA}</span></p>
                <p>Le : <span className="border-b border-dotted border-black pb-1 inline-block min-w-[200px]">{formData.date}</span></p>
              </div>

              <div className="mt-16">
                <p>Signature :</p>
                {formData.signatureDataUrl ? (
                  <div className="mt-4">
                    <img 
                      src={formData.signatureDataUrl} 
                      alt="Signature" 
                      className="max-h-20 border-b border-black"
                      style={{ maxWidth: '300px' }}
                    />
                  </div>
                ) : (
                  <div className="h-20 border-b border-dotted border-black mt-4"></div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setShowPreview(false)}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
            >
              Modifier
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex-1 bg-mali-emerald hover:bg-mali-emerald/90 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
            >
              📄 Télécharger PDF
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  📋 Instructions
                </h4>
                <p className="text-sm text-blue-700">
                  Téléchargez le PDF et uploadez-le dans le formulaire de création d'entreprise dans l'autre fenêtre.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeclarationHonneur;
