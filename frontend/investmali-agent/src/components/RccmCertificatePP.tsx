import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface RccmCertificatePPProps {
  rccmNumber: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  nationalite: string;
  adressePostale: string;
  ville: string;
  quartier: string;
  situationMatrimoniale: string;
  activites: string;
  sigleEnseigne: string;
  nomCommercial: string;
  adresseEtablissement: string;
  registrationDate: string;
}

const RccmCertificatePP: React.FC<RccmCertificatePPProps> = ({
  rccmNumber,
  nom,
  prenom,
  dateNaissance,
  lieuNaissance,
  nationalite,
  adressePostale,
  ville,
  quartier,
  situationMatrimoniale,
  activites,
  sigleEnseigne,
  nomCommercial,
  adresseEtablissement,
  registrationDate
}) => {
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

  const generatePDF = async () => {
    const certificateElement = document.getElementById('rccm-certificate-pp');
    if (!certificateElement) return;

    try {
      const canvas = await html2canvas(certificateElement, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`certificat-rccm-pp-${rccmNumber || 'document'}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
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
          <span>Télécharger le certificat RCCM (Personne Physique)</span>
        </button>
      </div>

      {/* Certificat RCCM Personne Physique */}
      <div
        id="rccm-certificate-pp"
        className="bg-white p-8"
        style={{
          minHeight: '1122px',
          width: '794px',
          margin: '0 auto',
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          border: '2px solid black'
        }}
      >
        {/* En-tête */}
        <div className="flex justify-between items-start mb-3">
          <div className="text-left font-bold" style={{ fontSize: '12px' }}>
            <p>RCCM</p>
            <p>2010 - P₂</p>
          </div>
          <div className="text-center flex-1">
            <p className="font-bold" style={{ fontSize: '14px' }}>FORMULAIRE DE MODIFICATION</p>
            <div className="mt-2" style={{ fontSize: '10px' }}>
              <p>☐ Relative à LA PERSONNE PHYSIQUE et/ou à SON ETABLISSEMENT PRINCIPAL</p>
              <p>☐ Relative à UN ETABLISSEMENT SECONDAIRE ou à UNE SUCCURSALE</p>
            </div>
          </div>
        </div>

        <div className="border-2 border-black p-2 mb-2" style={{ fontSize: '9px' }}>
          <p>☐ Identification ☐ Activité(s) ☐ Transfert ☐ Autre(s) personne(s) pouvant engager la personne physique assujettie</p>
          <p>Numéro RCCM : {rccmNumber}</p>
        </div>

        {/* Section 1: RENSEIGNEMENTS RELATIFS À LA PERSONNE PHYSIQUE ASSUJETTIE */}
        <div className="border-2 border-black mb-2">
          <div className="bg-white p-2 text-center font-bold" style={{ fontSize: '11px' }}>
            RENSEIGNEMENTS RELATIFS À LA PERSONNE PHYSIQUE ASSUJETTIE
          </div>
          <div className="p-3 space-y-2" style={{ fontSize: '9px' }}>
            <div className="flex">
              <span className="w-4 font-bold">1</span>
              <div className="flex-1">
                <span className="font-bold">NOM :</span> ☐ M. ☐ Mme ☐ Mlle {nom} <span className="font-bold ml-4">PRENOM(S):</span> {prenom}
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">2</span>
              <div className="flex-1">
                <span className="font-bold">DATE ET LIEU DE NAISSANCE :</span> {dateNaissance ? formatDate(dateNaissance) : '.....................'} <span className="font-bold ml-4">NATIONALITE:</span> {nationalite || 'Malienne'}
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">3</span>
              <div className="flex-1">
                <span className="font-bold">ADRESSE POSTALE :</span> {adressePostale || '.....................'}
                <br />
                <span className="font-bold">DOMICILE PERSONNEL</span>
                <br />
                <span className="font-bold ml-4">VILLE :</span> {ville} <span className="font-bold ml-8">QUARTIER :</span> {quartier || '.....................'}
                <br />
                <span className="font-bold ml-4">AUTRES PRECISIONS</span>
                <br />
                <span className="font-bold ml-4">COORDONNEES ELECTRONIQUES (s'il y a lieu) :</span> .....................
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">4</span>
              <div className="flex-1">
                <span className="font-bold">SITUATION MATRIMONIALE :</span> ☐ Célibataire, ☐ Marié(e), ☐ Veuf(ve), ☐ Divorcé(e)
              </div>
            </div>

            {/* Tableau des conjoints */}
            <table className="w-full border-collapse border border-black mt-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 text-left">Conjoint(s)</th>
                  <th className="border border-black p-1 text-left">Nom - Prénoms</th>
                  <th className="border border-black p-1 text-left">Date et lieu du mariage</th>
                  <th className="border border-black p-1 text-left">Option matrimoniale</th>
                  <th className="border border-black p-1 text-left">Régime matrimoniale</th>
                  <th className="border border-black p-1 text-left">Clauses restrictives</th>
                  <th className="border border-black p-1 text-left">Demande en séparation de biens</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-1 h-8"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5-8: Activités */}
        <div className="border-2 border-black mb-2 p-3" style={{ fontSize: '9px' }}>
          <div className="flex mb-1">
            <span className="w-4 font-bold">5</span>
            <div className="flex-1">
              <span className="font-bold">ACTIVITES :</span> {activites}
            </div>
          </div>
          <div className="flex mb-1">
            <span className="w-4 font-bold">6</span>
            <div className="flex-1">
              <span className="font-bold">SIGLE OU ENSEIGNE :</span> {sigleEnseigne || '.....................'}
            </div>
          </div>
          <div className="flex mb-1">
            <span className="w-4 font-bold">7</span>
            <div className="flex-1">
              <span className="font-bold">NOM COMMERCIAL :</span> {nomCommercial || '.....................'}
            </div>
          </div>
          <div className="flex">
            <span className="w-4 font-bold">8</span>
            <div className="flex-1">
              <span className="font-bold">MODIFICATIONS RELATIVES A LA PERSONNE PHYSIQUE (Préciser la nature, la date des modifications) :</span>
              <br />
              .....................
            </div>
          </div>
        </div>

        {/* Section 9-14: Modifications relatives à l'établissement */}
        <div className="border-2 border-black mb-2">
          <div className="bg-white p-2 text-center font-bold" style={{ fontSize: '11px' }}>
            MODIFICATIONS RELATIVES A L'ETABLISSEMENT ET A L'ACTIVITE
          </div>
          <div className="p-3 space-y-2" style={{ fontSize: '9px' }}>
            <div className="flex">
              <span className="w-4 font-bold">9</span>
              <div className="flex-1">
                <span className="font-bold">N°RCCM :</span> {rccmNumber}
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">10</span>
              <div className="flex-1">
                <span className="font-bold">NOM COMMERCIAL (s'il y a lieu) :</span> {nomCommercial || '.....................'}
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">11</span>
              <div className="flex-1">
                <span className="font-bold">SIGLE OU ENSEIGNE (s'il y a lieu) :</span> {sigleEnseigne || '.....................'}
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">12</span>
              <div className="flex-1">
                <span className="font-bold">ACTIVITE (S) (s'il y a lieu):</span>
                <br />
                ☐ Activité(s) supprimée(s): (préciser) : .....................
                <br />
                ☐ Activité(s) ajoutée(s): (préciser) : .....................
                <br />
                ☐ Activité(s) actualisée(s) : .....................
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">13</span>
              <div className="flex-1">
                <span className="font-bold">ADRESSE DE L'ETABLISSEMENT PRINCIPAL (s'il y a lieu) :</span>
                <br />
                Ancienne adresse (géographique et postale): {adresseEtablissement || '.....................'}
                <br />
                Nouvelle adresse (géographique et postale) : .....................
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">14</span>
              <div className="flex-1">
                ☐ <span className="font-bold">AUTRE (préciser) :</span> .....................
              </div>
            </div>
          </div>
        </div>

        {/* Section 15-20: Modifications relatives à l'établissement secondaire ou à la succursale */}
        <div className="border-2 border-black mb-2">
          <div className="bg-white p-2 text-center font-bold" style={{ fontSize: '11px' }}>
            MODIFICATIONS RELATIVES A L'ETABLISSEMENT SECONDAIRE<br />
            OU A LA SUCCURSALE
          </div>
          <div className="p-3 space-y-2" style={{ fontSize: '9px' }}>
            <div className="flex">
              <span className="w-4 font-bold">15</span>
              <div className="flex-1">
                <span className="font-bold">N°RCCM :</span> .....................
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">16</span>
              <div className="flex-1">
                <span className="font-bold">NOM COMMERCIAL (s'il y a lieu) :</span> .....................
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">17</span>
              <div className="flex-1">
                <span className="font-bold">SIGLE OU ENSEIGNE (s'il y a lieu) :</span> .....................
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">18</span>
              <div className="flex-1">
                <span className="font-bold">ADRESSE (s'il y a lieu) :</span>
                <br />
                Ancienne adresse (géographique et postale): .....................
                <br />
                Nouvelle adresse (géographique et postale) : .....................
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">19</span>
              <div className="flex-1">
                <span className="font-bold">ACTIVITE (S) (s'il y a lieu):</span>
                <br />
                ☐ Activité(s) supprimée(s): (préciser) : .....................
                <br />
                ☐ Activité(s) ajoutée(s): (préciser) : .....................
                <br />
                ☐ Activité(s) actualisée(s) : .....................
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">20</span>
              <div className="flex-1">
                ☐ <span className="font-bold">AUTRE (préciser) :</span> .....................
              </div>
            </div>
          </div>
        </div>

        {/* Section 21: Modifications relatives aux personnes pouvant engager la personne physique */}
        <div className="border-2 border-black mb-2">
          <div className="bg-white p-2 text-center font-bold" style={{ fontSize: '11px' }}>
            MODIFICATION RELATIVES AUX PERSONNES POUVANT<br />
            ENGAGER LA PERSONNE PHYSIQUE ASSUJETTIE
          </div>
          <div className="p-3" style={{ fontSize: '9px' }}>
            <p className="mb-2">
              <span className="font-bold">21</span> Les personnes ayant le pouvoir d'engager la personne physique assujettie ont été modifiées comme suit:
            </p>
            <div className="space-y-2">
              <div>
                <p className="font-bold">1 - Nom, Prénoms : ...................................................................................</p>
                <p>Date, lieu de naissance : ......................................................... Nationalité ....................................................</p>
                <p>Domicile personnel :............................................. (Préciser) : ☐ Partante ☐ Nouvelle, ☐ En place</p>
                <p>Préciser l'objet de la modification : ...................................................................................</p>
                <p>Préciser la date de modification : ...................................................................................</p>
              </div>
              <div>
                <p className="font-bold">2 - Nom, Prénoms : ...................................................................................</p>
                <p>Date, lieu de naissance : ......................................................... Nationalité ....................................................</p>
                <p>Domicile personnel :............................................. (Préciser) : ☐ Partante ☐ Nouvelle, ☐ En place</p>
                <p>Préciser l'objet de la modification : ...................................................................................</p>
                <p>Préciser la date de modification : ...................................................................................</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 22: Certification */}
        <div className="border-2 border-black p-3" style={{ fontSize: '9px' }}>
          <div className="flex justify-between items-start">
            <div className="w-2/3">
              <p className="mb-2">
                <span className="font-bold">22</span> LE SOUSSIGNE (préciser si mandataire).....................
              </p>
              <p className="mb-2">
                Demande à ce que la présente constitue
              </p>
              <p className="mb-2">
                ☐ UNE DEMANDE DE MODIFICATION DE LA PERSONNE PHYSIQUE ET/OU DE SON ETABLISSEMENT PRINCIPAL
              </p>
              <p className="mb-2">
                ☐ UNE DEMANDE DE MODIFICATION D'UN ETABLISSEMENT SECONDAIRE OU D'UNE SUCCURSALE
              </p>
            </div>
            <div className="w-1/3 text-center border-2 border-black p-2">
              <p>Fait à : ...................</p>
              <p>Le ......./......./....... (JJ/MM/AAAA)</p>
              <p className="mt-4">Signature</p>
            </div>
          </div>
        </div>

        {/* Section 23-24: Greffier */}
        <div className="border-2 border-black p-3 mt-2" style={{ fontSize: '9px' }}>
          <p className="mb-2">
            <span className="font-bold">23</span> Le greffier ou le responsable de l'organe compétent soussigné a reçu le formulaire sous le numéro d'ordre :................du registre d'arrivée.
          </p>
          <p className="mb-2">
            <span className="font-bold">24</span> La régularité de la demande a été vérifiée en application des articles 52 et suivants de l'Acte uniforme portant sur le droit commercial général par le Greffier ou le responsable de l'organe compétent qui a :
          </p>
          <p className="ml-4">
            ☐ Modifié sous le numéro RCCM <span className="text-red-600 font-bold">{rccmNumber}</span> ................... et délivré un accusé d'enregistrement,
          </p>
          <p className="ml-4">
            ☐ Rejeté la demande au(x) motif(s) que : .....................
          </p>
          <div className="flex justify-between items-start mt-4">
            <div className="w-2/3">
              <p>Intercalaire (s) complétant la ou les rubrique(s) n°(s)............................... ☐ OUI ☐ NON (si OUI, nombre de pages intercalaires : ...........)</p>
              <p className="mt-2">Fait, à ................... Le ......./......./....... (JJ/MM/AAAA)</p>
              <p>Signature du Greffier (Nom, prénoms, titre et juridiction) ou du responsable de l'organe compétent:</p>
            </div>
            <div className="w-1/3 text-center border-2 border-black p-2">
              <p className="mt-8">Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RccmCertificatePP;
























