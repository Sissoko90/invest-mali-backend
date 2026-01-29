import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface RccmCertificateProps {
  rccmNumber: string;
  companyName: string;
  legalForm: string;
  capital?: string;
  managerName: string;
  registrationDate: string;
  city: string;
  mainActivity: string;
  managerFirstName?: string;
  managerLastName?: string;
  managerBirthDate?: string;
  managerBirthPlace?: string;
  address?: string;
}

const RccmCertificate: React.FC<RccmCertificateProps> = ({
  rccmNumber,
  companyName,
  legalForm,
  capital,
  managerName,
  registrationDate,
  city,
  mainActivity,
  managerFirstName,
  managerLastName,
  managerBirthDate,
  managerBirthPlace,
  address
}) => {
  const generatePDF = async () => {
    const certificateElement = document.getElementById('rccm-certificate');
    if (!certificateElement) return;

    try {
      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`RCCM_${rccmNumber.replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatActivity = (activity: string) => {
    if (!activity) return activity;
    // Remplacer les underscores par des espaces et mettre en majuscules avec la première lettre de chaque mot
    return activity
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Bouton de téléchargement */}
      <div className="flex justify-end">
        <button
          onClick={generatePDF}
          className="bg-gradient-to-r from-[#412A5C] to-primary-600 text-white px-6 py-3 rounded-xl hover:from-primary-700 hover:to-[#412A5C] flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Télécharger le certificat RCCM</span>
        </button>
      </div>

      {/* Certificat RCCM */}
      <div
        id="rccm-certificate"
        className="bg-white p-8"
        style={{
          minHeight: '1122px',
          width: '794px',
          margin: '0 auto',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          border: '2px solid black'
        }}
      >
        {/* En-tête */}
        <div className="flex justify-between items-start mb-3">
            <div className="text-left" style={{ fontSize: '20px' }}>
              <p className="font-bold text-center">Cour d'appel de Bamako</p>
              <p className="font-bold text-center">Tribunal de commerce de Bamako</p>
            </div>
            <div className="text-right" style={{ fontSize: '20px' }}>
              <p className="font-bold text-center">République du Mali</p>
              <p className="font-bold text-center" style={{ fontSize: '20px' }}>Un Peuple -Un But -Une Foi</p>
            </div>
          </div>
        <div className="border-2 border-black mb-2 p-3">
          {/* Ligne 1: Mo + DÉCLARATION */}
          <div className="flex justify-between items-start mb-1">
            <p className="text-lg font-bold" style={{ width: '5%' }}>Mo</p>
            <p className="font-bold text-sm flex-1 text-center">DÉCLARATION [x] DE CONSTITUTION DE PERSONNE MORALE</p>
          </div>
          
          {/* Ligne 2: -OU (centré) */}
          <div className="mb-1">
            <p className="font-bold text-sm text-center">-OU □ D'OUVERTURE D'UN ÉTABLISSEMENT SECONDAIRE</p>
          </div>
          
          {/* Ligne 3: A.P. Porto Novo + -OU */}
          <div className="flex justify-between items-center">
            <p className="text-xs" style={{ width: '40%', fontSize: '8px' }}>A.P. Porto Novo 23/24 juin 1999</p>
            <p className="font-bold text-sm flex-1 text-right whitespace-nowrap">-OU □ D'OUVERTURE D'UNE SUCCURSALE D'UNE PERSONNE MORALE ÉTRANGÈRE</p>
          </div>
        </div>

        {/* Section 1: RENSEIGNEMENTS RELATIFS À LA PERSONNE MORALE */}
        <div className="border-2 border-black mb-2">
          <div className="bg-gray-100 p-2 text-center font-bold text-xs">
            RENSEIGNEMENTS RELATIFS À LA PERSONNE MORALE
          </div>
          <div className="p-3 space-y-2" style={{ fontSize: '10px' }}>
            <div className="flex">
              <span className="w-4">1</span>
              <div className="flex-1">
                <span className="font-bold">DÉNOMINATION: « {companyName} »</span>
              </div>
            </div>
            <div className="flex">
              <span className="w-4">2</span>
              <div className="flex-1">
                <span className="font-bold">NOM COMMERCIAL:</span> {companyName}
              </div>
            </div>
            <div className="flex">
              <span className="w-4">3</span>
              <div className="flex-1">
                <span className="font-bold">ADRESSE DU SIÈGE OU DE L'ÉTABLISSEMENT CRÉÉ:</span>
                <br />
                {city} (République du Mali), {address || 'Adresse à compléter'}
              </div>
            </div>
            <div className="flex">
              <span className="w-4">4</span>
              <div className="flex-1">
                <span className="font-bold">FORME JURIDIQUE:</span> {legalForm}
                <span className="ml-8 font-bold">N° R.C.C.M. DU SIÈGE:</span> 
              </div>
            </div>
            <div className="flex">
              <span className="w-4">5</span>
              <div className="flex-1">
                <span className="font-bold">CAPITAL SOCIAL:</span> {capital ? `${parseInt(capital).toLocaleString('fr-FR')} FCFA` : '1.000.000 FCFA'}
                <span className="ml-8 font-bold">DONT NUMÉRAIRE:</span> Totalité
                <br />
                <span className="font-bold">DURÉE:</span> 99 ans
              </div>
            </div>
          </div>
        </div>

        {/* Section 6-7-8: ACTIVITÉ ET ÉTABLISSEMENTS */}
        <div className="border-2 border-black mb-2">
          <div className="bg-gray-100 p-2 text-center font-bold text-xs">
            RENSEIGNEMENTS RELATIFS À L'ACTIVITÉ ET AUX ÉTABLISSEMENTS
          </div>
          <div className="p-3" style={{ fontSize: '10px' }}>
            <div className="flex mb-2">
              <span className="w-4">6</span>
              <div className="flex-1">
                <span className="font-bold">ACTIVITÉ:</span> ACTIVITÉ PRINCIPALE (préciser): {formatActivity(mainActivity)}
              </div>
            </div>
            <div className="flex mb-2">
              <span className="w-4">7</span>
              <div className="flex-1">
                <span className="font-bold">ACTIVITÉ SECONDAIRE:</span>
              </div>
            </div>
            <div className="flex">
              <span className="w-4">8</span>
              <div className="flex-1">
                <span className="font-bold">Date de début:</span> Immédiatement
                <span className="ml-8 font-bold">Nombre de salariés (*):</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 16: DIRIGEANTS */}
        <div className="border-2 border-black mb-2">
          <div className="bg-gray-100 p-2 text-center font-bold text-xs">
            RENSEIGNEMENTS RELATIFS AUX DIRIGEANTS (*) (**)
          </div>
          <div className="p-2" style={{ fontSize: '9px' }}>
            <p className="mb-2">(*) Concerne les Gérants, Administrateurs, Directeurs généraux ou toute autre personne chargée d'engager la personne morale</p>
            <p className="mb-2">(**) Les renseignements ne pouvant figurer ci-dessous doivent IMPÉRATIVEMENT être reportés sur le formulaire M.o bis annexé</p>
            
            <table className="w-full border-collapse border border-black mt-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 text-left">NOM</th>
                  <th className="border border-black p-1 text-left">PRÉNOM</th>
                  <th className="border border-black p-1 text-left">DATE ET LIEU DE NAISSANCE</th>
                  <th className="border border-black p-1 text-left">ADRESSE</th>
                  <th className="border border-black p-1 text-left">FONCTION<br />(***)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1 font-bold">{managerLastName || managerName.split(' ').pop()}</td>
                  <td className="border border-black p-1">{managerFirstName || managerName.split(' ')[0]}</td>
                  <td className="border border-black p-1">le {managerBirthDate ? formatDate(managerBirthDate) : ''} à {managerBirthPlace || city}</td>
                  <td className="border border-black p-1">Demeurant à {city}</td>
                  <td className="border border-black p-1">Gérant<br />(***)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 17: COMMISSAIRE AUX COMPTES */}
        <div className="border-2 border-black mb-2">
          <div className="bg-gray-100 p-2 text-center font-bold text-xs">
            COMMISSAIRE AUX COMPTES
          </div>
          <table className="w-full" style={{ fontSize: '9px' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 text-left">NOM</th>
                <th className="border border-black p-1 text-left">PRÉNOM</th>
                <th className="border border-black p-1 text-left">DATE ET LIEU DE NAISSANCE</th>
                <th className="border border-black p-1 text-left">ADRESSE</th>
                <th className="border border-black p-1 text-left">FONCTION<br />TITULAIRE<br />SUPPLÉANT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1 h-8"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 18: Certification */}
        <div className="border-2 border-black p-3" style={{ fontSize: '9px' }}>
          <div className="flex justify-between items-start">
            <div className="w-2/3">
              <p className="mb-2">
                <span className="">Le (La) SOUSSIGNE(E) (preciser si mandaitaire). Maitre .........................., Noataire, agissant en sa qualité de mandataire demande à ce que la presente constitut X <span className="mt-4 font-bold"> DEMANDE D'IMMATRICULATION AU RCCM </span> </span><br />
                <span className="font-bold">18</span> La conformité de la déclaration avec les pièces justificatives produites en application de l'Acte Uniforme sur le Droit
                commercial général ayant été vérifiée par le Greffier en Chef soussigné qui a procédé à l'inscription
              </p>
              <p className="mt-4 font-bold">le <span className="text-red-600">{formatDate(new Date().toISOString())}</span> sous le NUMÉRO <span className="text-red-600">{rccmNumber}</span></p>
            </div>
            <div className="w-1/3 text-center">
              
                <p className="mt-2">Bamako, le ....../....../......</p>
              <p className="font-bold mt-4">Fait, à {city}</p>
              <p>Le {formatDate(new Date().toISOString())}</p>
              <p className="mt-2">Signature :</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RccmCertificate;
























