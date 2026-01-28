package abdaty_technologie.API_Invest.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.InvestmentAgreement;
import abdaty_technologie.API_Invest.Entity.Paiement;
import abdaty_technologie.API_Invest.Entity.Payment;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;
import abdaty_technologie.API_Invest.Entity.Enum.TypePaiement;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import abdaty_technologie.API_Invest.constants.Messages;
import abdaty_technologie.API_Invest.dto.requests.PaiementRequest;
import abdaty_technologie.API_Invest.dto.responses.PaiementResponse;
import abdaty_technologie.API_Invest.exception.NotFoundException;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.InvestmentAgreementRepository;
import abdaty_technologie.API_Invest.repository.PaiementRepository;
import abdaty_technologie.API_Invest.repository.PaymentRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.service.IPaiementService;

@Service
@Transactional
public class PaiementServiceImpl implements IPaiementService {

    @Autowired
    private PaiementRepository paiementRepository;
    
    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PersonsRepository personsRepository;

    @Autowired
    private EntrepriseRepository entrepriseRepository;
    
    @Autowired
    private InvestmentAgreementRepository investmentAgreementRepository;

    @Override
    public PaiementResponse creerPaiement(PaiementRequest request) {
        // Vérifier que la personne existe
        Persons personne = personsRepository.findById(request.getPersonneId())
                .orElseThrow(() -> new NotFoundException(Messages.PERSON_NOT_FOUND));

        Entreprise entreprise = null;
        if (request.getEntrepriseId() != null) {
            entreprise = entrepriseRepository.findById(request.getEntrepriseId())
                    .orElseThrow(() -> new NotFoundException(Messages.ENTERPRISE_NOT_FOUND));
        }

        // Créer le paiement
        Paiement paiement = new Paiement();
        paiement.setTypePaiement(request.getTypePaiement());
        paiement.setMontant(request.getMontant());
        paiement.setPersonne(personne);
        paiement.setEntreprise(entreprise);
        paiement.setDescription(request.getDescription());
        paiement.setNumeroTelephone(request.getNumeroTelephone());
        paiement.setNumeroCompte(request.getNumeroCompte());
        // Utiliser le statut fourni ou EN_ATTENTE par défaut
        StatutPaiement statut = (request.getStatut() != null) ? request.getStatut() : StatutPaiement.EN_ATTENTE;
        paiement.setStatut(statut);
        
        // Utiliser la date de paiement fournie ou maintenant si le paiement est validé
        if (request.getDatePaiement() != null) {
            paiement.setDatePaiement(request.getDatePaiement());
        } else if (statut == StatutPaiement.VALIDE) {
            paiement.setDatePaiement(LocalDateTime.now());
        }
        
        // Utiliser la référence fournie ou générer une nouvelle
        String referenceTransaction = (request.getReferenceTransaction() != null && !request.getReferenceTransaction().isEmpty()) 
            ? request.getReferenceTransaction() 
            : genererReferenceTransaction();
        paiement.setReferenceTransaction(referenceTransaction);
        
        // Logs de debug pour la persistance
        System.out.println("💾 [PaiementService] Création paiement:");
        System.out.println("- Type: " + request.getTypePaiement());
        System.out.println("- Montant: " + request.getMontant() + " XOF");
        System.out.println("- Référence: " + referenceTransaction);
        System.out.println("- Personne ID: " + request.getPersonneId());
        System.out.println("- Entreprise ID: " + request.getEntrepriseId());
        System.out.println("- Statut: " + statut);
        System.out.println("- Date Paiement: " + paiement.getDatePaiement());
        System.out.println("- Description: " + request.getDescription());

        // Sauvegarder le paiement
        Paiement paiementSauve = paiementRepository.save(paiement);
        System.out.println("✅ [PaiementService] Paiement sauvé avec ID: " + paiementSauve.getId());
        System.out.println("📊 [PaiementService] Référence sauvée: " + paiementSauve.getReferenceTransaction());

        // DIAGNOSTIC: Vérifier l'association
        if (paiementSauve.getEntreprise() != null) {
            System.out.println("🔍 [PaiementService] Paiement associé à l'entreprise: " + paiementSauve.getEntreprise().getId());
            System.out.println("🔍 [PaiementService] Paiement ID: " + paiementSauve.getId());
            System.out.println("🔍 [PaiementService] Statut paiement: " + paiementSauve.getStatut());
        } else {
            System.out.println("❌ [PaiementService] ERREUR: Paiement non associé à une entreprise!");
        }

        // Si le paiement est validé, mettre à jour le statut de l'entreprise
        if (paiementSauve.getStatut() == StatutPaiement.VALIDE) {
            mettreAJourStatutEntreprise(paiementSauve.getEntreprise());
        }

        return convertirEnResponse(paiementSauve);
    }

    @Override
    public List<PaiementResponse> obtenirTousPaiements() {
        return paiementRepository.findAll().stream()
                .map(this::convertirEnResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaiementResponse obtenirPaiementParId(String id) {
        Paiement paiement = paiementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(Messages.PAYMENT_NOT_FOUND + id));
        return convertirEnResponse(paiement);
    }

    @Override
    public PaiementResponse obtenirPaiementParReference(String reference) {
        Paiement paiement = paiementRepository.findByReferenceTransaction(reference)
                .orElseThrow(() -> new NotFoundException(Messages.PAYMENT_NOT_FOUND_BY_REFERENCE + reference));
        return convertirEnResponse(paiement);
    }

    @Override
    public List<PaiementResponse> obtenirPaiementsParPersonne(String personneId) {
        return paiementRepository.findByPersonneId(personneId).stream()
                .map(this::convertirEnResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PaiementResponse> obtenirPaiementsParEntreprise(String entrepriseId) {
        return paiementRepository.findByEntrepriseId(entrepriseId).stream()
                .map(this::convertirEnResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PaiementResponse> obtenirPaiementsParStatut(StatutPaiement statut) {
        return paiementRepository.findByStatut(statut).stream()
                .map(this::convertirEnResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaiementResponse validerPaiement(String id) {
        Paiement paiement = paiementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(Messages.PAYMENT_NOT_FOUND + id));
        
        paiement.setStatut(StatutPaiement.VALIDE);
        paiement.setDatePaiement(LocalDateTime.now());
        
        Paiement paiementMisAJour = paiementRepository.save(paiement);
        return convertirEnResponse(paiementMisAJour);
    }

    @Override
    public PaiementResponse refuserPaiement(String id) {
        Paiement paiement = paiementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(Messages.PAYMENT_NOT_FOUND + id));
        
        paiement.setStatut(StatutPaiement.REFUSE);
        
        Paiement paiementMisAJour = paiementRepository.save(paiement);
        return convertirEnResponse(paiementMisAJour);
    }

    @Override
    public PaiementResponse annulerPaiement(String id) {
        Paiement paiement = paiementRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(Messages.PAYMENT_NOT_FOUND + id));
        
        paiement.setStatut(StatutPaiement.ANNULE);
        
        Paiement paiementMisAJour = paiementRepository.save(paiement);
        return convertirEnResponse(paiementMisAJour);
    }

    @Override
    public BigDecimal calculerTotalPaiementsPersonne(String personneId, StatutPaiement statut) {
        BigDecimal total = paiementRepository.sumMontantByPersonneIdAndStatut(personneId, statut);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public BigDecimal calculerTotalPaiementsEntreprise(String entrepriseId, StatutPaiement statut) {
        BigDecimal total = paiementRepository.sumMontantByEntrepriseIdAndStatut(entrepriseId, statut);
        return total != null ? total : BigDecimal.ZERO;
    }

    @Override
    public void supprimerPaiement(String id) {
        if (!paiementRepository.existsById(id)) {
            throw new NotFoundException(Messages.PAYMENT_NOT_FOUND + id);
        }
        paiementRepository.deleteById(id);
    }

    private String genererReferenceTransaction() {
        return "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private PaiementResponse convertirEnResponse(Paiement paiement) {
        PaiementResponse response = new PaiementResponse();
        response.setId(paiement.getId());
        response.setTypePaiement(paiement.getTypePaiement());
        response.setStatut(paiement.getStatut());
        response.setMontant(paiement.getMontant());
        response.setReferenceTransaction(paiement.getReferenceTransaction());
        response.setDescription(paiement.getDescription());
        response.setDatePaiement(paiement.getDatePaiement());
        response.setDateCreation(paiement.getCreation() != null ? paiement.getCreation().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null);
        response.setNumeroTelephone(paiement.getNumeroTelephone());
        response.setNumeroCompte(paiement.getNumeroCompte());

        // Informations de la personne
        if (paiement.getPersonne() != null) {
            response.setPersonneId(paiement.getPersonne().getId());
            response.setPersonneNom(paiement.getPersonne().getNom());
            response.setPersonnePrenom(paiement.getPersonne().getPrenom());
        }

        // Informations de l'entreprise
        if (paiement.getEntreprise() != null) {
            response.setEntrepriseId(paiement.getEntreprise().getId());
            response.setEntrepriseNom(paiement.getEntreprise().getNom());
        }

        return response;
    }

    @Override
    public boolean existsByReference(String reference) {
        return paiementRepository.existsByReferenceTransaction(reference);
    }

    /**
     * Met à jour le statut de l'entreprise après un paiement validé
     */
    private void mettreAJourStatutEntreprise(Entreprise entreprise) {
        if (entreprise != null) {
            System.out.println("🏢 [PaiementService] Mise à jour statut entreprise: " + entreprise.getNom());
            
            // Marquer l'entreprise comme ayant payé - avancer à l'étape suivante
            // Si l'entreprise est à l'étape ACCUEIL, la faire passer à REGISSEUR
            if (entreprise.getEtapeValidation() == EtapeValidation.ACCUEIL) {
                entreprise.setEtapeValidation(EtapeValidation.REGISSEUR);
                System.out.println("📋 [PaiementService] Étape mise à jour: ACCUEIL → REGISSEUR");
            }
            // Si l'entreprise est à l'étape REGISSEUR, la faire passer à REVISION
            else if (entreprise.getEtapeValidation() == EtapeValidation.REGISSEUR) {
                entreprise.setEtapeValidation(EtapeValidation.REVISION);
                System.out.println("📋 [PaiementService] Étape mise à jour: REGISSEUR → REVISION");
            }
            
            // Mettre le statut de création à EN_COURS si c'était EN_ATTENTE
            if (entreprise.getStatutCreation() == StatutCreation.EN_ATTENTE) {
                entreprise.setStatutCreation(StatutCreation.EN_COURS);
                System.out.println("📋 [PaiementService] Statut création: EN_ATTENTE → EN_COURS");
            }
            
            // Sauvegarder les modifications
            entrepriseRepository.save(entreprise);
            System.out.println("✅ [PaiementService] Statut entreprise mis à jour avec succès");
        }
    }

    @Override
    public List<PaiementResponse> getPaiementsByStatut(StatutPaiement statut) {
        System.out.println("🔍 [PaiementService] Recherche des paiements avec statut: " + statut);
        
        List<PaiementResponse> allPayments = new ArrayList<>();
        
        // 1. Récupérer les paiements de l'ancienne table "paiement" (ESPECES, etc.)
        List<Paiement> paiements = paiementRepository.findByStatutWithRelations(statut);
        System.out.println("✅ [PaiementService] " + paiements.size() + " paiements trouvés dans table 'paiement' avec statut " + statut);
        
        // Convertir les anciens paiements
        List<PaiementResponse> oldPayments = paiements.stream()
                .map(this::convertirEnResponse)
                .collect(Collectors.toList());
        allPayments.addAll(oldPayments);
        
        // 2. Récupérer les paiements TresorPay de la nouvelle table "payments" avec statut PAID
        if (statut == StatutPaiement.VALIDE) {
            List<Payment> tresorpayPayments = paymentRepository.findByStatusOrderByCreatedAtDesc("PAID");
            System.out.println("✅ [PaiementService] " + tresorpayPayments.size() + " paiements TresorPay trouvés avec statut PAID");
            
            // Convertir les paiements TresorPay en PaiementResponse
            for (Payment payment : tresorpayPayments) {
                try {
                    Entreprise entreprise = null;
                    if (payment.getEntrepriseId() != null) {
                        entreprise = entrepriseRepository.findById(payment.getEntrepriseId()).orElse(null);
                    }
                    
                    PaiementResponse response = new PaiementResponse();
                    response.setId(payment.getId().toString());
                    // Déterminer le type de paiement dynamiquement
                    TypePaiement typePaiement = determinerTypePaiement(payment);
                    response.setTypePaiement(typePaiement);
                    // Mapper le statut dynamiquement
                    StatutPaiement statutPaiement = mapperStatutPaiement(payment.getStatus());
                    response.setStatut(statutPaiement);
                    response.setMontant(payment.getAmount());
                    response.setReferenceTransaction(payment.getTresorPayReference());
                    response.setDescription(payment.getDescription());
                    
                    if (payment.getCompletedAt() != null) {
                        response.setDatePaiement(payment.getCompletedAt().atZone(ZoneId.systemDefault()).toLocalDateTime());
                    }
                    
                    // Déterminer le nom d'entreprise selon le type de paiement
                    String nomEntreprise = null;
                    if (entreprise != null) {
                        response.setEntrepriseId(entreprise.getId());
                        nomEntreprise = entreprise.getNom();
                    } else if (payment.getEntrepriseId() != null && payment.getEntrepriseId().startsWith("INV-")) {
                        // C'est un paiement d'agrément - récupérer le nom depuis investment_agreements
                        try {
                            String investmentId = payment.getEntrepriseId().substring(4); // Enlever le préfixe "INV-"
                            Optional<InvestmentAgreement> investmentOpt = investmentAgreementRepository.findById(investmentId);
                            if (investmentOpt.isPresent() && investmentOpt.get().getIdentification() != null) {
                                nomEntreprise = investmentOpt.get().getIdentification().getNomRaisonSociale();
                                System.out.println("🏆 [PaiementService] Nom d'agrément récupéré: " + nomEntreprise + " pour " + payment.getEntrepriseId());
                            }
                        } catch (Exception ex) {
                            System.err.println("⚠️ [PaiementService] Erreur récupération nom agrément: " + ex.getMessage());
                        }
                    }
                    
                    response.setEntrepriseNom(nomEntreprise);
                    
                    allPayments.add(response);
                    System.out.println("📋 [PaiementService] Paiement TresorPay " + payment.getId() + " → Entreprise: " + 
                                     (entreprise != null ? entreprise.getNom() : "Non liée"));
                } catch (Exception e) {
                    System.err.println("❌ [PaiementService] Erreur conversion paiement TresorPay " + payment.getId() + ": " + e.getMessage());
                }
            }
        }
        
        System.out.println("✅ [PaiementService] Total: " + allPayments.size() + " paiements confirmés (anciens + TresorPay)");
        
        return allPayments;
    }

    /**
     * Détermine le type de paiement basé sur les données du paiement
     */
    private TypePaiement determinerTypePaiement(Payment payment) {
        // Si le paiement a une référence TresorPay, c'est un paiement TresorPay
        if (payment.getTresorPayReference() != null && !payment.getTresorPayReference().isEmpty()) {
            return TypePaiement.TRESORPAY;
        }
        
        // Analyser la méthode de paiement pour déterminer le type
        if (payment.getPaymentMethod() != null) {
            String method = payment.getPaymentMethod().toUpperCase();
            if (method.contains("CARD") || method.contains("CARTE")) {
                return TypePaiement.CARTE_BANCAIRE;
            }
            if (method.contains("MOBILE") || method.contains("ORANGE") || method.contains("MOOV") || method.contains("WAVE")) {
                return TypePaiement.MOBILE_MONEY;
            }
            if (method.contains("CASH") || method.contains("ESPECES")) {
                return TypePaiement.ESPECES;
            }
        }
        
        // Si le paiement a un numéro de téléphone client, c'est probablement du mobile money
        if (payment.getCustomerPhone() != null && !payment.getCustomerPhone().isEmpty()) {
            return TypePaiement.MOBILE_MONEY;
        }
        
        // Par défaut, considérer comme TresorPay (pour compatibilité)
        return TypePaiement.TRESORPAY;
    }
    
    /**
     * Mappe le statut du paiement de la table Payment vers StatutPaiement
     */
    private StatutPaiement mapperStatutPaiement(String status) {
        if (status == null) {
            return StatutPaiement.EN_ATTENTE;
        }
        
        switch (status.toUpperCase()) {
            case "PAID":
            case "COMPLETED":
            case "SUCCESS":
                return StatutPaiement.VALIDE;
            case "PENDING":
            case "PROCESSING":
                return StatutPaiement.EN_ATTENTE;
            case "FAILED":
            case "ERROR":
                return StatutPaiement.REFUSE;
            case "CANCELLED":
            case "CANCELED":
                return StatutPaiement.ANNULE;
            default:
                return StatutPaiement.EN_ATTENTE;
        }
    }

}
