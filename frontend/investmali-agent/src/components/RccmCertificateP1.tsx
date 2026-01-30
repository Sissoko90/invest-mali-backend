import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface RccmCertificateP1Props {
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
  dateDebut: string;
  civilite?: string; // M., Mme, Mlle
  localite?: string;
}

const RccmCertificateP1: React.FC<RccmCertificateP1Props> = ({
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
  registrationDate,
  dateDebut,
  civilite,
  localite
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
    const page1Element = document.getElementById('rccm-certificate-p1-page1');
    const page2Element = document.getElementById('rccm-certificate-p1-page2');
    if (!page1Element || !page2Element) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Générer la première page
      const canvas1 = await html2canvas(page1Element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData1 = canvas1.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight1 = (canvas1.height * imgWidth) / canvas1.width;

      pdf.addImage(imgData1, 'PNG', 0, 0, imgWidth, imgHeight1);

      // Ajouter une nouvelle page
      pdf.addPage();

      // Générer la deuxième page
      const canvas2 = await html2canvas(page2Element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData2 = canvas2.toDataURL('image/png');
      const imgHeight2 = (canvas2.height * imgWidth) / canvas2.width;

      pdf.addImage(imgData2, 'PNG', 0, 0, imgWidth, imgHeight2);

      pdf.save(`certificat-rccm-p1-${rccmNumber || 'document'}.pdf`);
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
<<<<<<< HEAD
          className="bg-sky-600 text-white px-6 py-3 my-5 text-white px-6 py-3 rounded-xl hover:green-700 flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
=======
          className="bg-gradient-to-r from-[#412A5C] to-primary-600 text-white px-6 py-3 rounded-xl hover:from-primary-700 hover:to-[#412A5C] flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Télécharger le certificat RCCM P1</span>
        </button>
      </div>

      {/* Page 1 - Sections 1-14 */}
      <div
        id="rccm-certificate-p1-page1"
        className="bg-white p-8"
        style={{
          minHeight: '1122px',
          width: '794px',
          margin: '0 auto',
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px'
        }}
      >
        {/* En-tête */}
        <div className="flex justify-between items-start mb-3">
          <div className="text-left font-bold" style={{ fontSize: '12px' }}>
            <p>RCCM</p>
            <p>2010 - P₁</p>
          </div>
          <div className="text-center flex-1">
            <p className="font-bold" style={{ fontSize: '14px' }}>FORMULAIRE DE DEMANDE</p>
            <div className="mt-2 text-left ml-8" style={{ fontSize: '10px' }}>
              <p>ou ☐ D'IMMATRICULATION PRINCIPALE D'UNE PERSONNE PHYSIQUE</p>
              <p className="ml-4">☐ D'IMMATRICULATION SECONDAIRE OU D'UNE SUCCURSALE</p>
              <p className="ml-4">☐ DE REPRISE D'ACTIVITE</p>
            </div>
          </div>
        </div>

        {/* Section 1-5: RENSEIGNEMENTS RELATIFS À LA PERSONNE PHYSIQUE ASSUJETTIE */}
        <div className="border-2 border-black mb-2">
          <div className="bg-white p-2 text-center font-bold" style={{ fontSize: '11px' }}>
            RENSEIGNEMENTS RELATIFS À LA PERSONNE PHYSIQUE ASSUJETTIE
          </div>
          <div className="p-3 space-y-2" style={{ fontSize: '9px' }}>
            <div className="flex">
              <span className="w-4 font-bold">1</span>
              <div className="flex-1">
                <span className="font-bold">NOM :</span> {(civilite === 'M.' || civilite === 'M' || civilite === 'MONSIEUR' || civilite === 'Monsieur') ? '☑' : '☐'} M. {(civilite === 'Mme' || civilite === 'MADAME' || civilite === 'Madame') ? '☑' : '☐'} Mme {(civilite === 'Mlle' || civilite === 'MADEMOISELLE' || civilite === 'Mademoiselle') ? '☑' : '☐'} Mlle {nom} <span className="font-bold ml-4">PRENOM(S):</span> {prenom}
               
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
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">4</span>
              <div className="flex-1">
                <span className="font-bold">DOMICILE PERSONNEL</span>
                <br />
                <span className="font-bold ml-4">VILLE :</span> {ville} <span className="font-bold ml-8">QUARTIER :</span> {quartier || '.....................'}
                <br />
                <span className="font-bold ml-4">AUTRES PRECISIONS :</span> {localite || '.....................'}
                <br />
                <span className="font-bold ml-4">COORDONNEES ELECTRONIQUES (s'il y a lieu) :</span> .....................
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">5</span>
              <div className="flex-1">
                <span className="font-bold">SITUATION MATRIMONIALE :</span> {(situationMatrimoniale === 'CELIBATAIRE' || situationMatrimoniale === 'Célibataire') ? '☑' : '☐'} Célibataire, {(situationMatrimoniale === 'MARIE' || situationMatrimoniale === 'MARIEE' || situationMatrimoniale === 'Marié(e)') ? '☑' : '☐'} Marié(e), {(situationMatrimoniale === 'VEUF' || situationMatrimoniale === 'VEUVE' || situationMatrimoniale === 'Veuf(ve)') ? '☑' : '☐'} Veuf(ve), {(situationMatrimoniale === 'DIVORCE' || situationMatrimoniale === 'DIVORCEE' || situationMatrimoniale === 'Divorcé(e)') ? '☑' : '☐'} Divorcé(e)
                <br />
                {/* <span className="debug-info" style={{ fontSize: '8px', color: 'red' }}>
                  DEBUG SITUATION: "{situationMatrimoniale}" | length={situationMatrimoniale?.length} | type={typeof situationMatrimoniale}
                </span> */}
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

        {/* Section 6-12: RENSEIGNEMENTS RELATIFS À L'ETABLISSEMENT ET À L'ACTIVITE */}
        <div className="border-2 border-black mb-2">
          <div className="bg-white p-2 text-center font-bold" style={{ fontSize: '11px' }}>
            RENSEIGNEMENTS RELATIFS À L'ETABLISSEMENT ET À L'ACTIVITE
          </div>
          <div className="p-3 space-y-2" style={{ fontSize: '9px' }}>
            <div className="flex">
              <span className="w-4 font-bold">6</span>
              <div className="flex-1">
                <span className="font-bold">NOM COMMERCIAL (s'il y a lieu) :</span> {nomCommercial || '.....................'}
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">7</span>
              <div className="flex-1">
                <span className="font-bold">SIGLE OU ENSEIGNE (s'il y a lieu) :</span> {sigleEnseigne || '.....................'}
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">12</span>
              <div className="flex-1">
                <span className="font-bold">ACTIVITE(S) EXERCEE(S) (préciser) :</span> {activites}
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">8</span>
              <div className="flex-1">
                <span className="font-bold">DATE DE DEBUT :</span> {dateDebut ? formatDate(dateDebut) : '.....................'} <span className="font-bold ml-4">N°RCCM (s'il y a lieu) :</span> {rccmNumber || '.....................'}
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">9</span>
              <div className="flex-1">
                <span className="font-bold">ADRESSE DE L'ETABLISSEMENT PRINCIPAL (géographique et postale) :</span> {adresseEtablissement || '.....................'}
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">10</span>
              <div className="flex-1">
                <span className="font-bold">ORIGINE :</span> ☐ Création, ☐ Achat, ☐ Prise en location gérance,
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">11</span>
              <div className="flex-1">
                <span className="font-bold">ETABLISSEMENT SECONDAIRE OU SUCCURSALE :</span>
                <br />
                <span className="ml-4">NOM COMMERCIAL (s'il y a lieu) :</span> .....................
                <br />
                <span className="ml-4">SIGLE OU ENSEIGNE (s'il y a lieu) :</span> .....................
              </div>
            </div>
            <div className="flex">
              <span className="w-4 font-bold">12</span>
              <div className="flex-1">
                <span className="font-bold">DATE D'OUVERTURE :</span> .....................
                <br />
                <span className="ml-4 font-bold">ADRESSE (géographique et postale) :</span> .....................
                <br />
                <span className="ml-4 font-bold">ACTIVITE(S) (préciser) :</span> .....................
              </div>
            </div>
          </div>
        </div>

        {/* Section 13: RENSEIGNEMENTS RELATIFS AUX ACTIVITES ANTERIEURES */}
        <div className="border-2 border-black mb-2">
          <div className="bg-white p-2 text-center font-bold" style={{ fontSize: '11px' }}>
            RENSEIGNEMENTS RELATIFS AUX ACTIVITES ANTERIEURES
          </div>
          <div className="p-3 space-y-2" style={{ fontSize: '9px' }}>
            <div className="flex">
              <span className="w-4 font-bold">13</span>
              <div className="flex-1">
                <span className="font-bold">Exercice d'une précédente activité</span> : ☐ NON,
                <br />
                <span className="ml-16">☐ OUI,</span> ☐ commerciale ☐ autre : (préciser) .....................
                <br />
                <span className="ml-4">• Période: de (mois et année) ........................... À ........................... Précédent N° RCCM (s'il ya lieu)...................</span>
                <br />
                <span className="ml-4">• Nature de l'activité: ...................................................................................</span>
                <br />
                <span className="ml-4">• Principal établissement: ...................................................................................</span>
                <br />
                <span className="ml-4">• Etablissement (s) secondaire (s): ......................................................... N°RCCM (s'il y a lieu) ...................</span>
                <br />
                <span className="ml-4">• Adresse (géographique et postale) : ...................................................................................</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 14: AUTRES PERSONNES POUVANT ENGAGER LA PERSONNE PHYSIQUE ASSUJETTIE */}
        <div className="border-2 border-black mb-2">
          <div className="bg-white p-2 text-center font-bold" style={{ fontSize: '11px' }}>
            AUTRES PERSONNES POUVANT ENGAGER LA PERSONNE<br />
            PHYSIQUE ASSUJETTIE
          </div>
          <div className="p-3 space-y-3" style={{ fontSize: '9px' }}>
            <div className="flex">
              <span className="w-4 font-bold">14</span>
              <div className="flex-1 space-y-2">
                <div>
                  <p>•Nom : ................................................................................Prénoms :................................................................................</p>
                  <p>Date, lieu de naissance : .......................................................Nationalité ................................................................................</p>
                  <p>Domicile :................................................................................</p>
                </div>
                <div>
                  <p>•Nom : ................................................................................Prénoms :................................................................................</p>
                  <p>Date, lieu de naissance : .......................................................Nationalité ................................................................................</p>
                  <p>Domicile :................................................................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Page 2 - Sections 15-17 */}
      <div
        id="rccm-certificate-p1-page2"
        className="bg-white p-8 mt-6"
        style={{
          minHeight: '1122px',
          width: '794px',
          margin: '0 auto',
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px'
        }}
      >

        {/* Section 15: Demande */}
        <div className="border-2 border-black p-3 mb-2" style={{ fontSize: '9px' }}>
          <div className="flex justify-between items-start">
            <div className="w-2/3">
              <p className="mb-2">
                <span className="font-bold">15</span> LE SOUSSIGNE (préciser si mandataire).....................
              </p>
              <p className="mb-2">
                Demande à ce que la présente constitue
              </p>
              <p className="mb-2">
                ☐ <span className="font-bold">UNE DEMANDE D'IMMATRICULATION PRINCIPALE AU RCCM</span>
              </p>
              <p className="mb-2">
                ☐ <span className="font-bold">UNE DEMANDE D'IMMATRICULATION SECONDAIRE</span>
              </p>
              <p className="mb-2">
                ☐ <span className="font-bold">UNE DEMANDE D'OUVERTURE D'UNE SUCCURSALE</span>
              </p>
              <p className="mb-2">
                ☐ <span className="font-bold">UNE DEMANDE DE REPRISE D'ACTIVITE</span>
              </p>
            </div>
            <div className="w-1/3 text-center border-2 border-black p-2">
              <p>Fait à : ...................</p>
              <p>Le ......./......./.......</p>
              <p className="mt-4">Signature</p>
            </div>
          </div>
        </div>

        {/* Section 16-17: Greffier */}
        <div className="border-2 border-black p-3" style={{ fontSize: '9px' }}>
          <p className="mb-2">
            <span className="font-bold">16</span> Le greffier ou le responsable de l'organe compétent soussigné a reçu le formulaire sous le numéro d'ordre :................du registre d'arrivée.
          </p>
          <p className="mb-2">
            <span className="font-bold">17</span> La régularité de la demande a été vérifiée en application des articles 44 de l'Acte uniforme portant sur le droit commercial général par le Greffier ou le responsable de l'organe compétent qui a :
          </p>
          <p className="ml-4">
            ☐ <span className="font-bold">Immatriculé au RCCM la personne physique sous le numéro <span className="text-red-600">{rccmNumber}</span></span> et délivré un accusé d'enregistrement,
          </p>
          <p className="ml-4">
            ☐ <span className="font-bold">Rejeté la demande au(x) motif(s) que :</span> .....................
          </p>
          <div className="flex justify-between items-start mt-4">
            <div className="w-2/3">
              <p>Intercalaire (s) complétant la ou les rubrique(s) n°(s)............................... ☐ OUI ☐ NON (si OUI, nombre de pages intercalaires : ...........)</p>
              <p className="mt-2">Fait, à ................... Le ......./......./.......</p>
              <p>Signature du Greffier (Nom, prénoms, titre et juridiction) ou du responsable de l'organe compétent:</p>
            </div>
            <div className="w-1/3 text-center border-2 border-black p-2">
              <p className="mt-8">Signature</p>
            </div>
          </div>
        </div>

        {/* Note de rejet */}
        <div className="border-2 border-black p-2 mt-2" style={{ fontSize: '8px' }}>
          <p>
            (En cas de rejet de la demande par le greffier ou le responsable de l'organe compétent) Le demandeur atteste que le présent formulaire y compris le(s) intercalaire (s) y relatifs (s'il y a lieu) comportant les motifs du rejet de sa demande lui a été remis le ......./......./....... (JJ/MM/AAAA) et reconnaît que cette remise vaut notification de ce rejet. (Signature du Demandeur)
          </p>
        </div>
      </div>
    </div>
  );
};

export default RccmCertificateP1;
























