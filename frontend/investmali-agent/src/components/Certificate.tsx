import React, { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./Certificate.css";
import armoiriesMali from "../assets/logos/armoiries-mali.png";
import QRCodeGenerator from "./QRCodeGenerator";

interface CertificateProps {
  nina: string;
  sigle?: string;
  nomResponsable: string;
  prenomResponsable: string;
  rccmDate: string;
  rccmNumber: string;
  region: string;
  cercle: string;
  commune: string;
  localite: string;
  formeJuridique: string;
  activitePrincipale: string;
  detailsActivite: string;
  adresseSiege: string;
  telephone1?: string;
  telephone2?: string;
  dateDemande: string;
  dateSignature: string;
  showPdfButton?: boolean; // Optionnel pour afficher le bouton PDF
  onPdfGenerated?: (blob: Blob) => void; // Callback pour récupérer le PDF généré
  signatureFile?: File | null; // Fichier de signature uploadé
  signaturePreview?: string | null; // Aperçu de la signature
}

export default function Certificate({
  nina,
  sigle = "",
  nomResponsable,
  prenomResponsable,
  rccmDate,
  rccmNumber,
  region,
  cercle,
  commune,
  localite,
  formeJuridique,
  activitePrincipale,
  detailsActivite,
  adresseSiege,
  telephone1 = "",
  telephone2 = "",
  dateDemande,
  dateSignature,
  showPdfButton = false,
  signatureFile = null,
  signaturePreview = null,
  onPdfGenerated
}: CertificateProps) {
  
  const certificateRef = useRef<HTMLDivElement>(null);

  // Fonction pour convertir les codes d'activité en libellés lisibles (basée sur DomaineActiviteNr.java)
  const getActivityLabel = (activityCode: string): string => {
    const activityLabels: Record<string, string> = {
      'AGRICULTURE_ELEVAGE_PECHE': 'Agriculture, Élevage et Pêche',
      'MINES_ET_MINERAIS': 'Mines et Minéraux',
      'ENERGIE_ET_RESSOURCES_NATURELLES': 'Énergie et Ressources Naturelles',
      'INDUSTRIE_ET_TRANSFORMATION': 'Industrie et Transformation',
      'COMMERCE_ET_DISTRIBUTION': 'Commerce et Distribution',
      'TRANSPORTS_ET_LOGISTIQUE': 'Transports et Logistique',
      'TELECOMS_ET_TIC': 'Télécommunications et TIC',
      'TOURISME_CULTURE_ET_ARTISANAT': 'Tourisme, Culture et Artisanat',
      'SANTE_ET_PHARMACEUTIQUE': 'Santé et Pharmaceutique',
      'EDUCATION_ET_FORMATION': 'Éducation et Formation',
      'SERVICES_FINANCIERS_ET_ASSURANCES': 'Services Financiers et Assurances',
      'IMMOBILIER_ET_CONSTRUCTION': 'Immobilier et Construction (BTP)',
      'ADMINISTRATION_ET_SERVICES_PUBLICS': 'Administration et Services Publics',
      'ENVIRONNEMENT_ET_ECOLOGIE': 'Environnement et Écologie',
      'RECHERCHE_ET_INNOVATION': 'Recherche et Innovation',
      'INGENIERIE_ET_ETUDES': 'Ingénierie et Études',
      'URBANISME_ET_AMENAGEMENT': 'Urbanisme et Aménagement'
    };
    
    return activityLabels[activityCode] || activityCode;
  };


  const exportPDF = async (): Promise<Blob> => {
    console.log('📄 Génération PDF directe sans html2canvas...');

    try {
      console.log('🎯 Début génération PDF avec jsPDF...');
      console.log('📋 Props reçues par Certificate:', {
        nina,
        nomResponsable,
        prenomResponsable,
        activitePrincipale,
        detailsActivite
      });
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10; // Réduction des marges
      let currentY = margin;

      // Configuration des polices et tailles
      pdf.setFont("Arial", "normal");

      // HEADER - Deux colonnes (avec espacement initial)
      currentY += 10; // Espacement initial pour faire descendre les colonnes
      pdf.setFontSize(11); // Augmentation de la taille
      pdf.setFont("Arial", "bold");
      
      // Colonne gauche - centrée dans sa zone
      const leftColWidth = (pageWidth / 2) - margin - 10; // Réduction de 10mm pour espacement
      let leftText1 = "MINISTERE EN CHARGE DE LA STATISTIQUE";
      let leftText2 = "INSTITUT NATIONAL DE LA STATISTIQUE";
      let leftText3 = "(INSTAT)";
      let leftText4 = "CELLULE DE GESTION DU NINA";
      
      pdf.text(leftText1, margin + (leftColWidth - pdf.getTextWidth(leftText1)) / 2, currentY);
      currentY += 10; // Padding bottom pour leftText1
      pdf.text(leftText2, margin + (leftColWidth - pdf.getTextWidth(leftText2)) / 2, currentY);
      currentY += 4;
      pdf.text(leftText3, margin + (leftColWidth - pdf.getTextWidth(leftText3)) / 2, currentY);
      currentY += 10; // Padding top pour leftText4
      pdf.text(leftText4, margin + (leftColWidth - pdf.getTextWidth(leftText4)) / 2, currentY);
      
      // Colonne droite - centrée dans sa zone (repositionnement avec le même Y que la gauche)
      let rightCurrentY = currentY - 25; // Repositionner au début de la colonne gauche
      const rightColStart = pageWidth / 2 + 10; // Décalage de 10mm pour espacement
      const rightColWidth = (pageWidth / 2) - margin - 10; // Réduction de 10mm pour espacement
      let rightText1 = "REPUBLIQUE DU MALI";
      let rightText2 = "UN PEUPLE - UN BUT - UNE FOI";
      let rightText3 = "AGENCE POUR LA PROMOTION DES";
      let rightText4 = "INVESTISSEMENTS AU MALI (API-MALI)";
      let rightText5 = "GUICHET UNIQUE DE CREATION";
      let rightText6 = "D'ENTREPRISES";
      
      pdf.text(rightText1, rightColStart + (rightColWidth - pdf.getTextWidth(rightText1)) / 2, rightCurrentY);
      rightCurrentY += 4;
      pdf.text(rightText2, rightColStart + (rightColWidth - pdf.getTextWidth(rightText2)) / 2, rightCurrentY);
      rightCurrentY += 10; // Padding bottom pour rightText2
      pdf.text(rightText3, rightColStart + (rightColWidth - pdf.getTextWidth(rightText3)) / 2, rightCurrentY);
      rightCurrentY += 4;
      pdf.text(rightText4, rightColStart + (rightColWidth - pdf.getTextWidth(rightText4)) / 2, rightCurrentY);
      rightCurrentY += 10; // Padding top pour rightText5
      pdf.text(rightText5, rightColStart + (rightColWidth - pdf.getTextWidth(rightText5)) / 2, rightCurrentY);
      rightCurrentY += 4;
      pdf.text(rightText6, rightColStart + (rightColWidth - pdf.getTextWidth(rightText6)) / 2, rightCurrentY);
      
      currentY += 15; // Réduction de l'espacement

      // LOGO + TITRE (côte à côte)
      try {
        // Ajouter le logo des armoiries du Mali
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          logoImg.src = armoiriesMali;
        });
        
        // Convertir l'image en base64 pour l'ajouter au PDF
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = logoImg.width;
        canvas.height = logoImg.height;
        ctx?.drawImage(logoImg, 0, 0);
        const logoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Ajouter le logo au PDF (côté gauche) - même ligne que le titre
        pdf.addImage(logoDataUrl, 'JPEG', margin + 10, currentY, 25, 25);
        
      } catch (error) {
        console.warn('⚠️ Impossible de charger le logo:', error);
      }

      // TITRE - centré dans l'espace disponible après le logo
      pdf.setFontSize(18);
      pdf.setFont("Arial", "bold");
      const titleText = "CERTIFICAT D'IMMATRICULATION";
      const titleWidth = pdf.getTextWidth(titleText);
      
      // Calculer l'espace disponible après le logo (logo: margin + 10 + 25 + espacement)
      const logoEndX = margin + 5 + 10 + 5; // Position fin du logo + espacement
      const availableWidth = pageWidth - logoEndX - margin; // Largeur disponible pour le titre
      const titleX = logoEndX + (availableWidth - titleWidth) / 2; // Centré dans l'espace disponible
      const titleY = currentY + 15; // Position verticale
      
      // Cadre autour du titre avec padding
      pdf.setLineWidth(0.6);
      const paddingHorizontal = 10; // Padding à gauche et à droite
      pdf.rect(titleX - paddingHorizontal, currentY + 5, titleWidth + (paddingHorizontal * 2), 20);
      pdf.text(titleText, titleX, titleY);
      
      currentY += 33; // Espacement après la section logo + titre

      // TEXTE D'INTRODUCTION
      pdf.setFontSize(12); // Augmentation de la taille
      pdf.setFont("Arial", "normal");
      pdf.text("Je soussigné, le Directeur Général de l'Institut National de la Statistique, atteste que le", margin, currentY);
      currentY += 5; // Réduction de l'espacement
      // pdf.text("", margin, currentY);
      
      currentY += 8; // Réduction de l'espacement

      // NUMÉRO NINA
      pdf.setFontSize(16); // Augmentation de la taille
      pdf.setFont("Arial", "bold");
      const ninaText = `Numéro d'Immatriculation National (NINA) : ${nina}`;
      const ninaWidth = pdf.getTextWidth(ninaText);
      pdf.text(ninaText, (pageWidth - ninaWidth) / 2, currentY);
      
      currentY += 8; // Réduction de l'espacement

      // TABLEAU DES INFORMATIONS
      pdf.setFontSize(10);
      pdf.setFont("Arial", "normal");
      
      const tableData = [
        ["A été attribué à :", ""],
        ["Sigle :", sigle || ""],
        ["Nom du responsable :", nomResponsable || ""],
        ["Prénom du responsable :", prenomResponsable || ""],
        [`Immatriculé au RCCM le :`, `${rccmDate || ""} Sous le Numéro ${rccmNumber || ""}`],
        ["Dans la région de :", region || ""],
        ["Cercle de :", cercle || ""],
        ["Commune de :", commune || ""],
        ["Localité de :", localite || ""],
        ["Forme juridique :", formeJuridique === "E_I" ? "Entreprise Individuelle" : (formeJuridique || "")],
        ["Activité principale :", getActivityLabel(activitePrincipale) || ""],
        ["Détails de l'activité :", detailsActivite || ""],
        ["Adresse du Siège :", adresseSiege || ""],
        ["BP :", "                    RUE :                    PORTE :"],
        ["Téléphone n°1 :", `${telephone1 || ""}                    Téléphone n°2 : ${telephone2 || ""}`],
        ["Date de la demande :", dateDemande || ""]
      ];

      // Dessiner le tableau - optimisé pour l'espace
      const rowHeight = 6; // Réduction de la hauteur des lignes
      const col1Width = 50; // Réduction de la largeur de la première colonne
      const col2Width = pageWidth - margin * 2 - col1Width;

      tableData.forEach((row, index) => {
        const y = currentY + (index * rowHeight);
        
        // Pas de bordures pour le tableau
        
        // Texte du tableau
        pdf.setFontSize(10); // Augmentation de la taille du texte du tableau
        pdf.setFont("Arial", "normal");
        pdf.text(row[0], margin + 1, y + 3);
        pdf.setFont("Arial", "bold");
        pdf.text(row[1], margin + col1Width + 1, y + 3);
      });

      currentY += (tableData.length * rowHeight) + 5; // Réduction supplémentaire de l'espacement

      // TEXTE DE CONCLUSION
      pdf.setFontSize(11); // Augmentation de la taille
      pdf.setFont("Arial", "normal");
      pdf.text("Le présent certificat lui est délivré pour servir et valoir ce que de droit.", margin, currentY);
      
      currentY += 15; // Réduction de l'espacement

      // FOOTER - QR Code et Signature
      try {
        // Générer le vrai QR Code
        const QRCode = (await import('qrcode')).default;
        const qrValue = `NINA: ${nina} | Entreprise: ${nomResponsable} ${prenomResponsable} | Date: ${dateDemande} | Authentification: API-MALI-INSTAT`;
        const qrDataUrl = await QRCode.toDataURL(qrValue, {
          width: 100,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        // Ajouter le QR code au PDF - taille réduite
        pdf.addImage(qrDataUrl, 'PNG', margin, currentY, 25, 25);
        
      } catch (error) {
        console.warn('⚠️ Impossible de générer le QR code:', error);
        // Fallback : carré avec texte
        pdf.rect(margin, currentY, 25, 25);
        pdf.setFontSize(7);
        pdf.text("QR CODE", margin + 6, currentY + 15);
      }
      
      // pdf.setFontSize(7);
      // pdf.text("Authentification", margin + 1, currentY + 28);

      // Signature - centrée dans la partie droite
      pdf.setFontSize(9);
      
      // Signature - centrée dans la moitié droite de la page
      const dateText = `Bamako, le ${dateSignature || new Date().toLocaleDateString('fr-FR')}`;
      const directionText = "La Direction du Guichet Unique";
      const poText = "P/O";
      
      const dateWidth = pdf.getTextWidth(dateText);
      const directionWidth = pdf.getTextWidth(directionText);
      const poWidth = pdf.getTextWidth(poText);
      
      // Calculer la zone droite (moitié droite de la page)
      const rightAreaStart = pageWidth / 2;
      const rightAreaWidth = (pageWidth / 2) - margin;
      
      // Centrer chaque ligne dans la moitié droite (position remontée)
      pdf.text(dateText, rightAreaStart + (rightAreaWidth - dateWidth) / 2, currentY - 10);
      pdf.text(directionText, rightAreaStart + (rightAreaWidth - directionWidth) / 2, currentY - 3);
      pdf.text(poText, rightAreaStart + (rightAreaWidth - poWidth) / 2, currentY + 4);

        // Signature électronique - en dessous du texte P/O (position remontée)
        try {
          const signatureY = currentY + 5;
          
          // Si une signature a été uploadée, l'utiliser
          if (signatureFile && signaturePreview) {
            // Ajouter l'image de signature uploadée (largeur réduite pour éviter l'aspect rectangulaire)
            const signatureImageWidth = (rightAreaWidth - 60) * 1.5;// 60% de la largeur disponible
            const signatureImageX = rightAreaStart + (rightAreaWidth - signatureImageWidth) / 2; // Centrer l'image
            pdf.addImage(signaturePreview, 'PNG', signatureImageX, signatureY, signatureImageWidth, 35);
            
            // Ajouter un petit texte d'authentification en dessous
            pdf.setFontSize(6);
            pdf.setFont("Arial", "italic");
            // const authText = `Signature numérique - ${new Date().toLocaleDateString('fr-FR')}`;
            // pdf.text(authText, rightAreaStart + (rightAreaWidth - pdf.getTextWidth(authText)) / 2, signatureY + 25);
          } else {
            // Signature électronique par défaut (texte stylisé)
            const signatureText = "SIGNATURE";
            const signatureSubText = "ÉLECTRONIQUE";
            const orgText = "API-MALI";
            const timestampText = `${new Date().toLocaleDateString('fr-FR')}`;
            
            // Cadre de signature (forme plus carrée mais plus grande)
            const signatureBoxSize = 50; // Taille carrée plus grande
            const signatureBoxX = rightAreaStart + (rightAreaWidth - signatureBoxSize) / 2; // Centrer le cadre
            pdf.setLineWidth(0.5);
            pdf.rect(signatureBoxX, signatureY, signatureBoxSize, signatureBoxSize);
            
            // Texte de signature centré dans le cadre carré
            pdf.setFontSize(7);
            pdf.setFont("Arial", "bold");
            pdf.text(signatureText, signatureBoxX + (signatureBoxSize - pdf.getTextWidth(signatureText)) / 2, signatureY + 12);
            
            pdf.setFontSize(6);
            pdf.setFont("Arial", "bold");
            pdf.text(signatureSubText, signatureBoxX + (signatureBoxSize - pdf.getTextWidth(signatureSubText)) / 2, signatureY + 20);
            
            pdf.setFontSize(6);
            pdf.setFont("Arial", "normal");
            pdf.text(orgText, signatureBoxX + (signatureBoxSize - pdf.getTextWidth(orgText)) / 2, signatureY + 28);
            
            pdf.setFontSize(5);
            pdf.setFont("Arial", "italic");
            pdf.text(timestampText, signatureBoxX + (signatureBoxSize - pdf.getTextWidth(timestampText)) / 2, signatureY + 36);
          }
          
        } catch (error) {
          console.warn('⚠️ Impossible de générer la signature électronique:', error);
        }

      currentY += 42; // Espacement augmenté pour faire descendre la note finale

      // Vérifier si on a assez d'espace pour la note finale
      console.log('📏 Position currentY avant note finale:', currentY, 'Hauteur page:', pageHeight);
      
      // Si pas assez d'espace, ajouter une nouvelle page
      if (currentY > pageHeight - 20) {
        console.log('📄 Ajout d\'une nouvelle page pour la note finale');
        pdf.addPage();
        currentY = 30; // Position un peu plus basse sur la nouvelle page
      }

      // NOTE FINALE - taille réduite et espacement optimisé
      pdf.setFontSize(8); // Réduction de la taille
      pdf.setFont("helvetica", "italic");
      const noteText = "L'API Mali introduit un nouveau format électronique de certificat NINA.";
      const noteText2 = "L'authenticité peut être vérifiée avec un lecteur de QR code. Contactez le Guichet Unique pour toute information complémentaire."; 
      
      console.log('📝 Ajout de la note finale à la position Y:', currentY);
      pdf.text(noteText, (pageWidth - pdf.getTextWidth(noteText)) / 2, currentY);
      pdf.text(noteText2, (pageWidth - pdf.getTextWidth(noteText2)) / 2, currentY + 4);

      // Générer le blob
      const pdfBlob = pdf.output('blob');
      console.log('✅ PDF généré avec succès (méthode directe):', {
        taille: pdfBlob.size,
        pages: pdf.getNumberOfPages()
      });

      // Si un callback est fourni, l'appeler avec le blob
      if (onPdfGenerated) {
        onPdfGenerated(pdfBlob);
      } else {
        // Sinon, télécharger directement
        pdf.save(`certificat_nina_${nina}.pdf`);
      }

      return pdfBlob;

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      throw error;
    }
  };

  // Fonction pour attendre le chargement du contenu
  const waitForContent = async (element: HTMLElement): Promise<void> => {
    console.log('⏳ Attente du chargement du contenu...');
    
    // Attendre que toutes les images soient chargées
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) {
        return Promise.resolve();
      }
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continuer même si l'image échoue
        setTimeout(() => resolve(null), 5000); // Timeout de 5 secondes
      });
    });

    // Attendre que les canvas (QR code) soient rendus
    const canvases = element.querySelectorAll('canvas');
    const canvasPromises = Array.from(canvases).map(() => {
      return new Promise(resolve => {
        setTimeout(resolve, 1000); // Attendre 1 seconde pour le QR code
      });
    });

    try {
      await Promise.all([...imagePromises, ...canvasPromises]);
      console.log('✅ Contenu chargé');
    } catch (error) {
      console.warn('⚠️ Erreur lors du chargement:', error);
    }
  };

  // Écouter l'événement personnalisé pour déclencher l'export PDF
  React.useEffect(() => {
    const handleExportEvent = () => {
      exportPDF()
        .then((blob) => {
          // Utiliser les callbacks globaux si disponibles
          const callbacks = (window as any).pdfCallbacks;
          if (callbacks && callbacks.resolve) {
            callbacks.resolve(blob);
            delete (window as any).pdfCallbacks;
          }
        })
        .catch((error) => {
          // Utiliser les callbacks globaux si disponibles
          const callbacks = (window as any).pdfCallbacks;
          if (callbacks && callbacks.reject) {
            callbacks.reject(error);
            delete (window as any).pdfCallbacks;
          } else {
            console.error(error);
          }
        });
    };

    const element = certificateRef.current;
    if (element) {
      element.addEventListener('exportPDF', handleExportEvent);
      
      return () => {
        element.removeEventListener('exportPDF', handleExportEvent);
      };
    }
  }, []);

  return (
    <>

      {/* Bouton PDF optionnel */}
      {showPdfButton && (
        <button 
          onClick={exportPDF} 
          style={{ 
            margin: "20px", 
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Télécharger en PDF
        </button>
      )}

      <div ref={certificateRef} className="certificate-container">

      {/* HEADER */}
      <div className="header">
        <div className="col">
          <p className="PL-1">MINISTERE EN CHARGE DE LA STATISTIQUE</p>
          <p className="PL-2">INSTITUT NATIONAL DE LA STATISTIQUE (INSTAT)</p>
          <p className="PL-3">CELLULE DE GESTION DU NINA</p>
        </div>

        <div className="col">
          <p className="PR-1">REPUBLIQUE DU MALI</p>
          <p className="PR-2">UN PEUPLE - UN BUT - UNE FOI</p>
          <p className="PR-3">AGENCE POUR LA PROMOTION DES INVESTISSEMENTS AU MALI (API-MALI)</p>
          <p className="PR-4">GUICHET UNIQUE DE CREATION D'ENTREPRISES</p>
        </div>
      </div>

      {/* LOGO + TITLE */}
      <div className="title-section">
        <img src={armoiriesMali} className="logo" alt="Armoiries du Mali" />
        <h2>CERTIFICAT D'IMMATRICULATION</h2>
      </div>

      {/* BODY */}
      <div className="content">

        <p className="line">
          Je soussigné, le Directeur Général de l'Institut National de la Statistique,
          atteste que le
        </p>

        <p className="nina-number">
          Numéro d'Immatriculation National (NINA) : <strong>{nina}</strong>
        </p>

        {/* TABLE */}
        <table className="info-table">
          <tbody>

            <tr>
              <td>A été attribué à :</td>
              <td></td>
            </tr>

            <tr>
              <td>Sigle :</td>
              <td>{sigle}</td>
            </tr>

            <tr>
              <td>Nom du responsable :</td>
              <td>{nomResponsable}</td>
            </tr>

            <tr>
              <td>Prénom du responsable :</td>
              <td>{prenomResponsable}</td>
            </tr>

            <tr>
              <td>Immatriculé au RCCM le :</td>
              <td>{rccmDate} Sous le Numéro {rccmNumber}</td>
            </tr>

            <tr>
              <td>Dans la région de :</td>
              <td>{region}</td>
            </tr>

            <tr>
              <td>Cercle de :</td>
              <td>{cercle}</td>
            </tr>

            <tr>
              <td>Commune de :</td>
              <td>{commune}</td>
            </tr>

            <tr>
              <td>Localité de :</td>
              <td>{localite}</td>
            </tr>

            <tr>
              <td>Forme juridique :</td>
              <td>{formeJuridique}</td>
            </tr>

            <tr>
              <td>Activité principale :</td>
              <td>{activitePrincipale}</td>
            </tr>

            <tr>
              <td>Détails de l'activité :</td>
              <td>{detailsActivite}</td>
            </tr>

            <tr>
              <td>Adresse du Siège :</td>
              <td>{adresseSiege}</td>
            </tr>

            {/* BP, RUE, PORTE sur une ligne */}
            <tr>
              <td>BP :</td>
              <td style={{ display: 'flex', gap: '20px' }}>
                
                <span>RUE :</span>
                
                <span>PORTE :</span>
                
              </td>
            </tr>

            <tr>
              <td>Téléphone n°1 :</td>
              <td style={{ display: 'flex', gap: '20px' }}>
                <span style={{ width: '150px' }}>{telephone1}</span>
                <span>Téléphone n°2 :</span>
                <span style={{ width: '150px' }}>{telephone2}</span>
              </td>
            </tr>

            <tr>
              <td>Date de la demande :</td>
              <td>{dateDemande}</td>
            </tr>

          </tbody>
        </table>

        <p className="line-1">
          Le présent certificat lui est délivré pour servir et valoir ce que de droit.
        </p>

        {/* FOOTER */}
        <div className="footer">
          <div className="qr">
            <QRCodeGenerator 
              value={`NINA: ${nina} | Entreprise: ${nomResponsable} ${prenomResponsable} | Date: ${dateDemande} | Authentification: API-MALI-INSTAT`}
              size={100}
              className="qr-code-canvas"
            />
            <p style={{ fontSize: '10px', marginTop: '5px', textAlign: 'center' }}>
              Authentification
            </p>
          </div>

          <div className="signature">
            <p>Bamako, le {dateSignature}</p>
            <p>La Direction du Guichet Unique</p>
            <p>P/O</p>
          </div>
        </div>

        <p className="note">
          L'API Mali introduit un nouveau format électronique de certificat NINA.
          L'authenticité peut être vérifiée avec un lecteur de QR code.
          Contactez le Guichet Unique pour toute information complémentaire.
        </p>

      </div>
    </div>
    </>
  );
}
























