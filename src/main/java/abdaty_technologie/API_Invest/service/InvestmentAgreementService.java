package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.InvestmentAgreement;
import abdaty_technologie.API_Invest.Entity.InvestmentAgreementDocument;
import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import abdaty_technologie.API_Invest.dto.InvestmentAgreementRequest;
import abdaty_technologie.API_Invest.dto.InvestmentAgreementDocumentDto;
import abdaty_technologie.API_Invest.repository.InvestmentAgreementRepository;
import abdaty_technologie.API_Invest.repository.InvestmentAgreementDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class InvestmentAgreementService {

    private final InvestmentAgreementRepository investmentAgreementRepository;
    private final InvestmentAgreementDocumentRepository documentRepository;
    private final FileStorageService fileStorageService;

    /**
     * Créer une nouvelle demande d'agrément d'investissement avec documents
     */
    public InvestmentAgreement createInvestmentAgreement(InvestmentAgreementRequest request, String userId, 
                                                        List<MultipartFile> documents) {
        // Validation des données
        validateInvestmentAgreementRequest(request);
        
        InvestmentAgreement agreement = new InvestmentAgreement();
        agreement.setId(UUID.randomUUID().toString());
        agreement.setReferenceNumber(generateReferenceNumber());
        agreement.setUserId(userId);
        agreement.setStatut(StatutCreation.EN_COURS);
        agreement.setDateCreation(LocalDateTime.now());
        agreement.setDateModification(LocalDateTime.now());
        
        // Mapper les données du promoteur
        InvestmentAgreement.PromoteurInfo promoteur = new InvestmentAgreement.PromoteurInfo();
        promoteur.setNom(request.getPromoteur().getNom());
        promoteur.setNationalite(request.getPromoteur().getNationalite());
        promoteur.setAdresse(request.getPromoteur().getAdresse());
        agreement.setPromoteur(promoteur);
        
        // Mapper l'identification du projet
        InvestmentAgreement.ProjectIdentification identification = new InvestmentAgreement.ProjectIdentification();
        identification.setNomRaisonSociale(request.getIdentification().getNomRaisonSociale());
        identification.setActivite(request.getIdentification().getActivite());
        identification.setFormeJuridique(request.getIdentification().getFormeJuridique());
        identification.setLocalisation(request.getIdentification().getLocalisation());
        identification.setAdresse(request.getIdentification().getAdresse());
        agreement.setIdentification(identification);
        
        // Mapper les caractéristiques du projet
        InvestmentAgreement.ProjectCharacteristics caracteristiques = new InvestmentAgreement.ProjectCharacteristics();
        
        // Investissements
        InvestmentAgreement.ProjectCharacteristics.InvestmentDetails investissements = 
            new InvestmentAgreement.ProjectCharacteristics.InvestmentDetails();
        investissements.setTotal(request.getCaracteristiques().getInvestissements().getTotal());
        investissements.setImmobilisations(request.getCaracteristiques().getInvestissements().getImmobilisations());
        investissements.setFondsRoulement(request.getCaracteristiques().getInvestissements().getFondsRoulement());
        caracteristiques.setInvestissements(investissements);
        
        // Plan de financement
        InvestmentAgreement.ProjectCharacteristics.FinancingPlan planFinancement = 
            new InvestmentAgreement.ProjectCharacteristics.FinancingPlan();
        planFinancement.setFondsPropres(request.getCaracteristiques().getPlanFinancement().getFondsPropres());
        planFinancement.setCredits(request.getCaracteristiques().getPlanFinancement().getCredits());
        planFinancement.setAutres(request.getCaracteristiques().getPlanFinancement().getAutres());
        caracteristiques.setPlanFinancement(planFinancement);
        
        // Participation
        InvestmentAgreement.ProjectCharacteristics.ParticipationRates participation = 
            new InvestmentAgreement.ProjectCharacteristics.ParticipationRates();
        participation.setTauxNationaux(request.getCaracteristiques().getParticipation().getTauxNationaux());
        participation.setTauxExpatries(request.getCaracteristiques().getParticipation().getTauxExpatries());
        caracteristiques.setParticipation(participation);
        
        // Emplois
        InvestmentAgreement.ProjectCharacteristics.Employment emplois = 
            new InvestmentAgreement.ProjectCharacteristics.Employment();
        emplois.setNationaux(request.getCaracteristiques().getEmplois().getNationaux());
        emplois.setExpatries(request.getCaracteristiques().getEmplois().getExpatries());
        caracteristiques.setEmplois(emplois);
        
        // Marché
        InvestmentAgreement.ProjectCharacteristics.MarketTargets marche = 
            new InvestmentAgreement.ProjectCharacteristics.MarketTargets();
        marche.setLocal(request.getCaracteristiques().getMarche().getLocal());
        marche.setExterieur(request.getCaracteristiques().getMarche().getExterieur());
        caracteristiques.setMarche(marche);
        
        // Autres caractéristiques
        caracteristiques.setTauxValeurAjoutee(request.getCaracteristiques().getTauxValeurAjoutee());
        caracteristiques.setCapaciteProduction(request.getCaracteristiques().getCapaciteProduction());
        
        agreement.setCaracteristiques(caracteristiques);
        agreement.setRegimeSollicite(request.getRegimeSollicite());
        
        // Sauvegarder la demande d'agrément
        InvestmentAgreement savedAgreement = investmentAgreementRepository.save(agreement);
        
        // Sauvegarder tous les documents uploadés
        try {
            if (documents != null && !documents.isEmpty()) {
                System.out.println("🔍 [DEBUG] Sauvegarde de " + documents.size() + " documents");
                for (MultipartFile document : documents) {
                    if (document != null && !document.isEmpty()) {
                        // Déterminer le type de document basé sur le nom du fichier ou un mapping
                        String documentType = determineDocumentType(document.getOriginalFilename());
                        System.out.println("🔍 [DEBUG] Sauvegarde document: " + document.getOriginalFilename() + " (type: " + documentType + ")");
                        saveDocument(savedAgreement.getId(), document, documentType);
                    }
                }
            } else {
                System.out.println("🔍 [DEBUG] Aucun document à sauvegarder");
            }
        } catch (Exception e) {
            System.out.println("❌ [ERROR] Erreur lors de la sauvegarde des documents: " + e.getMessage());
            e.printStackTrace();
            // Ne pas faire échouer la demande si les documents ne peuvent pas être sauvegardés
        }
        
        return savedAgreement;
    }

    /**
     * Récupérer toutes les demandes d'agrément d'investissement
     */
    public List<InvestmentAgreement> getAllInvestmentAgreements() {
        System.out.println("🔍 [DEBUG] Récupération de toutes les demandes d'investissement");
        List<InvestmentAgreement> agreements = investmentAgreementRepository.findAll();
        System.out.println("🔍 [DEBUG] Nombre de demandes trouvées: " + agreements.size());
        return agreements;
    }

    /**
     * Récupérer les documents d'une demande d'investissement
     */
    public List<InvestmentAgreementDocumentDto> getDocumentsByAgreementId(String agreementId) {
        System.out.println("🔍 [DEBUG] Service - Récupération des documents pour l'agreement: " + agreementId);
        List<InvestmentAgreementDocument> documents = documentRepository.findByInvestmentAgreementIdOrderByUploadDateDesc(agreementId);
        System.out.println("🔍 [DEBUG] Service - Nombre de documents trouvés: " + documents.size());
        
        for (InvestmentAgreementDocument doc : documents) {
            System.out.println("🔍 [DEBUG] Document: " + doc.getOriginalFilename() + " (type: " + doc.getDocumentType() + ")");
        }
        
        List<InvestmentAgreementDocumentDto> documentDtos = new ArrayList<>();
        for (InvestmentAgreementDocument document : documents) {
            documentDtos.add(new InvestmentAgreementDocumentDto(
                document.getId(),
                document.getOriginalFilename(),
                document.getDocumentType(),
                document.getContentType(),
                document.getFileSize(),
                document.getFilePath(),
                document.getUploadDate(),
                document.getInvestmentAgreementId()
            ));
        }
        
        return documentDtos;
    }

    /**
     * Télécharger un document par son ID
     */
    public byte[] downloadDocument(String agreementId, String documentId) throws Exception {
        System.out.println("🔍 [DEBUG] Service - Téléchargement document ID: " + documentId);
        
        InvestmentAgreementDocument document = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document non trouvé: " + documentId));
        
        // Vérifier que le document appartient bien à cette demande
        if (!document.getInvestmentAgreementId().equals(agreementId)) {
            throw new RuntimeException("Document non autorisé pour cette demande");
        }
        
        System.out.println("🔍 [DEBUG] Lecture du fichier: " + document.getFilePath());
        return fileStorageService.readFile(document.getFilePath());
    }

    /**
     * Récupérer les informations d'un document
     */
    public InvestmentAgreementDocumentDto getDocumentInfo(String documentId) {
        System.out.println("🔍 [DEBUG] Service - Récupération info document ID: " + documentId);
        
        InvestmentAgreementDocument document = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document non trouvé: " + documentId));
        
        return new InvestmentAgreementDocumentDto(
            document.getId(),
            document.getOriginalFilename(),
            document.getDocumentType(),
            document.getContentType(),
            document.getFileSize(),
            document.getFilePath(),
            document.getUploadDate(),
            document.getInvestmentAgreementId()
        );
    }

    /**
     * Déterminer le type de document basé sur le nom du fichier
     */
    private String determineDocumentType(String filename) {
        if (filename == null) return "AUTRE_DOCUMENT";
        
        String lowerFilename = filename.toLowerCase();
        if (lowerFilename.contains("demande") || lowerFilename.contains("timbr")) {
            return "DEMANDE_TIMBREE";
        } else if (lowerFilename.contains("faisabilit") || lowerFilename.contains("etude")) {
            return "ETUDE_FAISABILITE";
        } else if (lowerFilename.contains("statut")) {
            return "STATUTS";
        } else if (lowerFilename.contains("autorisation") || lowerFilename.contains("exercice")) {
            return "AUTORISATION_EXERCICE";
        } else if (lowerFilename.contains("nina")) {
            return "NINA";
        } else if (lowerFilename.contains("rccm")) {
            return "RCCM";
        } else {
            return "AUTRE_DOCUMENT";
        }
    }

    /**
     * Sauvegarder un document uploadé
     */
    private void saveDocument(String investmentAgreementId, MultipartFile file, String documentType) throws Exception {
        // Valider le fichier
        if (!fileStorageService.isAllowedFileType(file.getContentType())) {
            throw new IllegalArgumentException("Type de fichier non autorisé: " + file.getContentType());
        }
        
        if (!fileStorageService.isValidFileSize(file.getSize())) {
            throw new IllegalArgumentException("Fichier trop volumineux (max 10MB)");
        }
        
        // Sauvegarder le fichier sur le disque
        String filePath = fileStorageService.storeFile(file, investmentAgreementId, documentType);
        
        // Créer l'enregistrement en base de données
        InvestmentAgreementDocument document = new InvestmentAgreementDocument();
        document.setId(UUID.randomUUID().toString());
        document.setInvestmentAgreementId(investmentAgreementId);
        document.setDocumentType(documentType);
        document.setOriginalFilename(file.getOriginalFilename());
        document.setFilePath(filePath);
        document.setFileSize(Long.valueOf(file.getSize()));
        document.setContentType(file.getContentType());
        document.setUploadDate(LocalDateTime.now());
        
        documentRepository.save(document);
        
        System.out.println("✅ [DEBUG] Document sauvegardé: " + documentType + " - " + file.getOriginalFilename());
    }

    /**
     * Récupérer toutes les demandes d'agrément d'un utilisateur
     */
    public List<InvestmentAgreement> getUserInvestmentAgreements(String userId) {
        return investmentAgreementRepository.findByUserIdOrderByDateCreationDesc(userId);
    }

    /**
     * Récupérer une demande d'agrément spécifique
     */
    public InvestmentAgreement getInvestmentAgreement(String id, String userId) {
        InvestmentAgreement agreement = investmentAgreementRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Demande d'agrément non trouvée"));
        
        if (!agreement.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Accès non autorisé à cette demande");
        }
        
        return agreement;
    }

    /**
     * Mettre à jour une demande d'agrément
     */
    public InvestmentAgreement updateInvestmentAgreement(String id, InvestmentAgreementRequest request, String userId) {
        InvestmentAgreement agreement = getInvestmentAgreement(id, userId);
        
        // Vérifier que la demande peut être modifiée
        if (agreement.getStatut() != StatutCreation.EN_COURS) {
            throw new IllegalArgumentException("Cette demande ne peut plus être modifiée");
        }
        
        // Validation des nouvelles données
        validateInvestmentAgreementRequest(request);
        
        // Mettre à jour les données (même logique que la création)
        agreement.setDateModification(LocalDateTime.now());
        
        // Mise à jour du promoteur
        if (agreement.getPromoteur() == null) {
            agreement.setPromoteur(new InvestmentAgreement.PromoteurInfo());
        }
        agreement.getPromoteur().setNom(request.getPromoteur().getNom());
        agreement.getPromoteur().setNationalite(request.getPromoteur().getNationalite());
        agreement.getPromoteur().setAdresse(request.getPromoteur().getAdresse());
        
        // Mise à jour de l'identification
        if (agreement.getIdentification() == null) {
            agreement.setIdentification(new InvestmentAgreement.ProjectIdentification());
        }
        agreement.getIdentification().setNomRaisonSociale(request.getIdentification().getNomRaisonSociale());
        agreement.getIdentification().setActivite(request.getIdentification().getActivite());
        agreement.getIdentification().setFormeJuridique(request.getIdentification().getFormeJuridique());
        agreement.getIdentification().setLocalisation(request.getIdentification().getLocalisation());
        agreement.getIdentification().setAdresse(request.getIdentification().getAdresse());
        
        // Mise à jour des caractéristiques
        if (agreement.getCaracteristiques() == null) {
            agreement.setCaracteristiques(new InvestmentAgreement.ProjectCharacteristics());
        }
        
        // Investissements
        if (agreement.getCaracteristiques().getInvestissements() == null) {
            agreement.getCaracteristiques().setInvestissements(new InvestmentAgreement.ProjectCharacteristics.InvestmentDetails());
        }
        agreement.getCaracteristiques().getInvestissements().setTotal(request.getCaracteristiques().getInvestissements().getTotal());
        agreement.getCaracteristiques().getInvestissements().setImmobilisations(request.getCaracteristiques().getInvestissements().getImmobilisations());
        agreement.getCaracteristiques().getInvestissements().setFondsRoulement(request.getCaracteristiques().getInvestissements().getFondsRoulement());
        
        // Plan de financement
        if (agreement.getCaracteristiques().getPlanFinancement() == null) {
            agreement.getCaracteristiques().setPlanFinancement(new InvestmentAgreement.ProjectCharacteristics.FinancingPlan());
        }
        agreement.getCaracteristiques().getPlanFinancement().setFondsPropres(request.getCaracteristiques().getPlanFinancement().getFondsPropres());
        agreement.getCaracteristiques().getPlanFinancement().setCredits(request.getCaracteristiques().getPlanFinancement().getCredits());
        agreement.getCaracteristiques().getPlanFinancement().setAutres(request.getCaracteristiques().getPlanFinancement().getAutres());
        
        // Participation
        if (agreement.getCaracteristiques().getParticipation() == null) {
            agreement.getCaracteristiques().setParticipation(new InvestmentAgreement.ProjectCharacteristics.ParticipationRates());
        }
        agreement.getCaracteristiques().getParticipation().setTauxNationaux(request.getCaracteristiques().getParticipation().getTauxNationaux());
        agreement.getCaracteristiques().getParticipation().setTauxExpatries(request.getCaracteristiques().getParticipation().getTauxExpatries());
        
        // Emplois
        if (agreement.getCaracteristiques().getEmplois() == null) {
            agreement.getCaracteristiques().setEmplois(new InvestmentAgreement.ProjectCharacteristics.Employment());
        }
        agreement.getCaracteristiques().getEmplois().setNationaux(request.getCaracteristiques().getEmplois().getNationaux());
        agreement.getCaracteristiques().getEmplois().setExpatries(request.getCaracteristiques().getEmplois().getExpatries());
        
        // Marché
        if (agreement.getCaracteristiques().getMarche() == null) {
            agreement.getCaracteristiques().setMarche(new InvestmentAgreement.ProjectCharacteristics.MarketTargets());
        }
        agreement.getCaracteristiques().getMarche().setLocal(request.getCaracteristiques().getMarche().getLocal());
        agreement.getCaracteristiques().getMarche().setExterieur(request.getCaracteristiques().getMarche().getExterieur());
        
        agreement.getCaracteristiques().setTauxValeurAjoutee(request.getCaracteristiques().getTauxValeurAjoutee());
        agreement.getCaracteristiques().setCapaciteProduction(request.getCaracteristiques().getCapaciteProduction());
        
        agreement.setRegimeSollicite(request.getRegimeSollicite());
        
        return investmentAgreementRepository.save(agreement);
    }

    /**
     * Supprimer une demande d'agrément
     */
    public void deleteInvestmentAgreement(String id, String userId) {
        InvestmentAgreement agreement = getInvestmentAgreement(id, userId);
        
        // Vérifier que la demande peut être supprimée
        if (agreement.getStatut() != StatutCreation.EN_COURS) {
            throw new IllegalArgumentException("Cette demande ne peut plus être supprimée");
        }
        
        investmentAgreementRepository.delete(agreement);
    }

    /**
     * Valider les données de la demande d'agrément
     */
    private void validateInvestmentAgreementRequest(InvestmentAgreementRequest request) {
        // Validation des investissements
        Double total = request.getCaracteristiques().getInvestissements().getTotal();
        Double immobilisations = request.getCaracteristiques().getInvestissements().getImmobilisations();
        Double fondsRoulement = request.getCaracteristiques().getInvestissements().getFondsRoulement();
        
        if (!total.equals(immobilisations + fondsRoulement)) {
            throw new IllegalArgumentException("L'investissement total doit égaler la somme des immobilisations et du fonds de roulement");
        }
        
        // Validation du plan de financement
        Double fondsPropres = request.getCaracteristiques().getPlanFinancement().getFondsPropres();
        Double credits = request.getCaracteristiques().getPlanFinancement().getCredits();
        Double autres = request.getCaracteristiques().getPlanFinancement().getAutres();
        
        if (!total.equals(fondsPropres + credits + autres)) {
            throw new IllegalArgumentException("Le plan de financement doit égaler l'investissement total");
        }
        
        // Validation des taux de participation
        Double tauxNationaux = request.getCaracteristiques().getParticipation().getTauxNationaux();
        Double tauxExpatries = request.getCaracteristiques().getParticipation().getTauxExpatries();
        
        if (!Double.valueOf(100.0).equals(tauxNationaux + tauxExpatries)) {
            throw new IllegalArgumentException("Les taux de participation doivent totaliser 100%");
        }
        
        // Validation des parts de marché
        Double marcheLocal = request.getCaracteristiques().getMarche().getLocal();
        Double marcheExterieur = request.getCaracteristiques().getMarche().getExterieur();
        
        if (!Double.valueOf(100.0).equals(marcheLocal + marcheExterieur)) {
            throw new IllegalArgumentException("Les parts de marché doivent totaliser 100%");
        }
    }

    /**
     * Générer un numéro de référence unique
     */
    private String generateReferenceNumber() {
        String year = String.valueOf(LocalDateTime.now().getYear());
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMddHHmmss"));
        return "AGR-" + year + "-" + timestamp;
    }
}
