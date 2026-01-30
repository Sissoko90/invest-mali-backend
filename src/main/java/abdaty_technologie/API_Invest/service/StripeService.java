<<<<<<< HEAD
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.PaymentRequest;
import abdaty_technologie.API_Invest.dto.PaymentResponse;
import abdaty_technologie.API_Invest.dto.requests.PaiementRequest;
import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;
import abdaty_technologie.API_Invest.Entity.Enum.TypePaiement;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.EntrepriseMembre;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseMembreRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service pour l'intégration Stripe
 */
@Service
public class StripeService {
    
    @Autowired
    private IPaiementService paiementService;
    
    @Autowired
    private EntrepriseRepository entrepriseRepository;
    
    @Autowired
    private EntrepriseMembreRepository entrepriseMembreRepository;
    
    @Value("${stripe.currency:xof}")
    private String defaultCurrency;
    
    @Value("${stripe.fees.business-creation:2500000}")
    private Long businessCreationFee;
    
    /**
     * Crée une session de paiement Stripe Checkout
     */
    public PaymentResponse createCheckoutSession(PaymentRequest request) {
        try {
            // Paramètres de la session Checkout
            SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(request.getSuccessUrl())
                    .setCancelUrl(request.getCancelUrl())
                    .addLineItem(
                        SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(
                                SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency(request.getCurrency())
                                    .setUnitAmount(request.getAmount())
                                    .setProductData(
                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName("Frais de création d'entreprise")
                                            .setDescription(request.getDescription())
                                            .build()
                                    )
                                    .build()
                            )
                            .build()
                    );
            
            // Métadonnées pour traçabilité
            Map<String, String> metadata = new HashMap<>();
            metadata.put("entreprise_id", request.getEntrepriseId());
            metadata.put("payment_method", request.getPaymentMethod());
            paramsBuilder.putAllMetadata(metadata);
            
            // Créer la session
            Session session = Session.create(paramsBuilder.build());
            
            return PaymentResponse.builder()
                    .paymentId(session.getId())
                    .entrepriseId(request.getEntrepriseId())
                    .status(PaymentResponse.PaymentStatus.PENDING)
                    .paymentMethod(request.getPaymentMethod())
                    .amount(request.getAmount())
                    .currency(request.getCurrency())
                    .redirectUrl(session.getUrl())
                    .transactionReference(session.getId())
                    .build();
                    
        } catch (StripeException e) {
            System.err.println("❌ Erreur Stripe: " + e.getMessage());
            return PaymentResponse.error(
                request.getEntrepriseId(), 
                request.getPaymentMethod(), 
                "Erreur lors de la création de la session de paiement: " + e.getMessage()
            );
        }
    }
    
    /**
     * Crée un PaymentIntent pour les paiements directs
     */
    public PaymentResponse createPaymentIntent(PaymentRequest request) {
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(request.getAmount())
                    .setCurrency(request.getCurrency())
                    .setDescription(request.getDescription())
                    .putMetadata("entreprise_id", request.getEntrepriseId())
                    .putMetadata("payment_method", request.getPaymentMethod())
                    .build();
            
            PaymentIntent intent = PaymentIntent.create(params);
            
            return PaymentResponse.builder()
                    .paymentId(intent.getId())
                    .entrepriseId(request.getEntrepriseId())
                    .status(mapStripeStatus(intent.getStatus()))
                    .paymentMethod(request.getPaymentMethod())
                    .amount(request.getAmount())
                    .currency(request.getCurrency())
                    .clientSecret(intent.getClientSecret())
                    .transactionReference(intent.getId())
                    .build();
                    
        } catch (StripeException e) {
            System.err.println("❌ Erreur Stripe PaymentIntent: " + e.getMessage());
            return PaymentResponse.error(
                request.getEntrepriseId(), 
                request.getPaymentMethod(), 
                "Erreur lors de la création du PaymentIntent: " + e.getMessage()
            );
        }
    }
    
    /**
     * Récupère le statut d'un paiement
     */
    public PaymentResponse getPaymentStatus(String paymentId) {
        System.out.println("🚨 [StripeService] getPaymentStatus APPELÉ pour: " + paymentId);
        try {
            System.out.println("🚨 [StripeService] Récupération PaymentIntent depuis Stripe...");
            PaymentIntent intent = PaymentIntent.retrieve(paymentId);
            System.out.println("🚨 [StripeService] PaymentIntent récupéré - Status: " + intent.getStatus());
            
            // Si le paiement vient de réussir, l'enregistrer dans la base de données
            System.out.println("🔍 [StripeService] Status PaymentIntent: " + intent.getStatus());
            if ("succeeded".equals(intent.getStatus())) {
                System.out.println("✅ [StripeService] Paiement réussi, appel savePaiementToDatabase");
                savePaiementToDatabase(intent);
            } else {
                System.out.println("⚠️ [StripeService] Paiement pas réussi, status: " + intent.getStatus());
            }
            
            // Récupérer l'entrepriseId depuis les métadonnées
            String entrepriseId = intent.getMetadata().get("entreprise_id");
            String paymentMethod = intent.getMetadata().get("payment_method");
            
            // Logs de debug pour traçabilité
            System.out.println("🔍 [StripeService] Métadonnées PaymentIntent:");
            System.out.println("- PaymentIntent ID: " + intent.getId());
            System.out.println("- Entreprise ID: " + entrepriseId);
            System.out.println("- Payment Method: " + paymentMethod);
            System.out.println("- Status: " + intent.getStatus());
            
            return PaymentResponse.builder()
                    .paymentId(intent.getId())
                    .entrepriseId(entrepriseId)
                    .status(mapStripeStatus(intent.getStatus()))
                    .paymentMethod(paymentMethod)
                    .amount(intent.getAmount())
                    .currency(intent.getCurrency())
                    .transactionReference(intent.getId())
                    .build();
                    
        } catch (StripeException e) {
            System.err.println("❌ Erreur récupération statut Stripe: " + e.getMessage());
            return PaymentResponse.error("", "STRIPE", 
                "Erreur lors de la récupération du statut: " + e.getMessage());
        }
    }
    
    /**
     * Enregistre un paiement Stripe réussi dans la base de données
     */
    private void savePaiementToDatabase(PaymentIntent intent) {
        System.out.println("🚨 [StripeService] savePaiementToDatabase APPELÉ pour: " + intent.getId());
        System.out.println("🚨 [StripeService] Status dans savePaiementToDatabase: " + intent.getStatus());
        try {
            // Extraire les métadonnées
            String entrepriseId = intent.getMetadata().get("entreprise_id");
            System.out.println("🚨 [StripeService] Entreprise ID extraite: " + entrepriseId);
            
            if (entrepriseId != null) {
                // Récupérer l'entreprise pour obtenir le personneId
                Entreprise entreprise = entrepriseRepository.findById(entrepriseId).orElse(null);
                System.out.println("🔍 [StripeService] Entreprise trouvée: " + (entreprise != null ? entreprise.getNom() : "null"));
                
                if (entreprise != null) {
                    // Utiliser une requête séparée pour éviter le lazy loading
                    List<EntrepriseMembre> membres = entrepriseMembreRepository.findByEntreprise_Id(entrepriseId);
                    System.out.println("🔍 [StripeService] Nombre de membres trouvés: " + membres.size());
                    
                    if (!membres.isEmpty()) {
                        // Trouver le fondateur (premier membre ou membre avec rôle FONDATEUR)
                        String personneId = membres.get(0).getPersonne().getId();
                    
                    // Vérifier si le paiement n'existe pas déjà
                    if (!paiementService.existsByReference(intent.getId())) {
                        // Créer la requête de paiement
                        PaiementRequest paiementRequest = new PaiementRequest();
                        paiementRequest.setPersonneId(personneId);
                        paiementRequest.setEntrepriseId(entrepriseId);
                        paiementRequest.setTypePaiement(TypePaiement.CARTE_BANCAIRE);
                        paiementRequest.setMontant(new BigDecimal(intent.getAmount()).divide(new BigDecimal(100))); // Convertir centimes en unités
                        paiementRequest.setReferenceTransaction(intent.getId());
                        
                        // Mapper le statut Stripe vers notre énumération
                        paiementRequest.setStatut(mapStripeStatusToPaiementStatus(intent.getStatus()));
                        
                        // Définir la date de paiement (maintenant pour les paiements réussis)
                        paiementRequest.setDatePaiement(java.time.LocalDateTime.now());
                        
                        // Logs de debug pour traçabilité
                        System.out.println("🔍 [StripeService] Création paiement:");
                        System.out.println("- PaymentIntent ID: " + intent.getId());
                        System.out.println("- Entreprise ID: " + entrepriseId);
                        System.out.println("- Personne ID: " + personneId);
                        System.out.println("- Montant: " + paiementRequest.getMontant() + " XOF");
                        System.out.println("- Statut: " + paiementRequest.getStatut());
                        System.out.println("- Type Paiement: " + paiementRequest.getTypePaiement());
                        System.out.println("- Date Paiement: " + paiementRequest.getDatePaiement());
                        System.out.println("- Référence Transaction: " + paiementRequest.getReferenceTransaction());
                        paiementRequest.setDescription("Paiement Stripe - Frais de création d'entreprise");
                        
                        // Sauvegarder le paiement
                        paiementService.creerPaiement(paiementRequest);
                        System.out.println("✅ Paiement Stripe enregistré en base: " + intent.getId());
                    } else {
                        System.out.println("ℹ️ Paiement Stripe déjà enregistré: " + intent.getId());
                    }
                    
                    
                    // Transition automatique : REGISSEUR → REVISION après paiement réussi (toujours vérifier)
                    System.out.println("🔍 [StripeService] Vérification transition - Status: " + intent.getStatus() + ", Étape actuelle: " + entreprise.getEtapeValidation());
                    if ("succeeded".equals(intent.getStatus()) && entreprise.getEtapeValidation() == EtapeValidation.REGISSEUR) {
                        System.out.println("🔄 [StripeService] Transition automatique REGISSEUR → REVISION pour entreprise: " + entrepriseId);
                        entreprise.setEtapeValidation(EtapeValidation.REVISION);
                        entreprise.setModification(java.time.Instant.now());
                        entrepriseRepository.save(entreprise);
                        System.out.println("✅ [StripeService] Entreprise transférée à l'étape REVISION: " + entrepriseId);
                    } else {
                        System.out.println("❌ [StripeService] Transition non effectuée - Status: " + intent.getStatus() + ", Étape: " + entreprise.getEtapeValidation());
                    }
                    } else {
                        System.err.println("❌ Aucun membre trouvé pour l'entreprise: " + entrepriseId);
                    }
                } else {
                    System.err.println("❌ Entreprise non trouvée pour: " + entrepriseId);
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'enregistrement du paiement Stripe: " + e.getMessage());
        }
    }
    
    /**
     * Mappe les statuts Stripe vers nos statuts internes
     */
    private PaymentResponse.PaymentStatus mapStripeStatus(String stripeStatus) {
        return switch (stripeStatus) {
            case "succeeded" -> PaymentResponse.PaymentStatus.SUCCEEDED;
            case "processing" -> PaymentResponse.PaymentStatus.PROCESSING;
            case "requires_payment_method" -> PaymentResponse.PaymentStatus.REQUIRES_ACTION;
            case "requires_confirmation" -> PaymentResponse.PaymentStatus.REQUIRES_CONFIRMATION;
            case "requires_action" -> PaymentResponse.PaymentStatus.REQUIRES_ACTION;
            case "canceled" -> PaymentResponse.PaymentStatus.CANCELLED;
            default -> PaymentResponse.PaymentStatus.PENDING;
        };
    }
    
    /**
     * Mappe les statuts Stripe vers nos statuts de paiement internes
     */
    private StatutPaiement mapStripeStatusToPaiementStatus(String stripeStatus) {
        return switch (stripeStatus) {
            case "succeeded" -> StatutPaiement.VALIDE;
            case "canceled" -> StatutPaiement.ANNULE;
            case "processing" -> StatutPaiement.EN_ATTENTE;
            case "requires_payment_method", "requires_confirmation", "requires_action" -> StatutPaiement.EN_ATTENTE;
            default -> StatutPaiement.EN_ATTENTE;
        };
    }
    
    /**
     * Calcule les frais selon le type de demande
     */
    public Long calculateFees(String requestType) {
        return switch (requestType) {
            case "BUSINESS_CREATION" -> businessCreationFee;
            case "DOCUMENT_PROCESSING" -> 500000L; // 5,000 XOF
            case "EXPEDITED_PROCESSING" -> 1000000L; // 10,000 XOF
            default -> businessCreationFee;
        };
    }
}
=======
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.PaymentRequest;
import abdaty_technologie.API_Invest.dto.PaymentResponse;
import abdaty_technologie.API_Invest.dto.requests.PaiementRequest;
import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;
import abdaty_technologie.API_Invest.Entity.Enum.TypePaiement;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.EntrepriseMembre;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseMembreRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.checkout.Session;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service pour l'intégration Stripe
 */
@Service
public class StripeService {
    
    @Autowired
    private IPaiementService paiementService;
    
    @Autowired
    private EntrepriseRepository entrepriseRepository;
    
    @Autowired
    private EntrepriseMembreRepository entrepriseMembreRepository;
    
    @Value("${stripe.currency:xof}")
    private String defaultCurrency;
    
    @Value("${stripe.fees.business-creation:2500000}")
    private Long businessCreationFee;
    
    /**
     * Crée une session de paiement Stripe Checkout
     */
    public PaymentResponse createCheckoutSession(PaymentRequest request) {
        try {
            // Paramètres de la session Checkout
            SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(request.getSuccessUrl())
                    .setCancelUrl(request.getCancelUrl())
                    .addLineItem(
                        SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(
                                SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency(request.getCurrency())
                                    .setUnitAmount(request.getAmount())
                                    .setProductData(
                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName("Frais de création d'entreprise")
                                            .setDescription(request.getDescription())
                                            .build()
                                    )
                                    .build()
                            )
                            .build()
                    );
            
            // Métadonnées pour traçabilité
            Map<String, String> metadata = new HashMap<>();
            metadata.put("entreprise_id", request.getEntrepriseId());
            metadata.put("payment_method", request.getPaymentMethod());
            paramsBuilder.putAllMetadata(metadata);
            
            // Créer la session
            Session session = Session.create(paramsBuilder.build());
            
            return PaymentResponse.builder()
                    .paymentId(session.getId())
                    .entrepriseId(request.getEntrepriseId())
                    .status(PaymentResponse.PaymentStatus.PENDING)
                    .paymentMethod(request.getPaymentMethod())
                    .amount(request.getAmount())
                    .currency(request.getCurrency())
                    .redirectUrl(session.getUrl())
                    .transactionReference(session.getId())
                    .build();
                    
        } catch (StripeException e) {
            System.err.println("❌ Erreur Stripe: " + e.getMessage());
            return PaymentResponse.error(
                request.getEntrepriseId(), 
                request.getPaymentMethod(), 
                "Erreur lors de la création de la session de paiement: " + e.getMessage()
            );
        }
    }
    
    /**
     * Crée un PaymentIntent pour les paiements directs
     */
    public PaymentResponse createPaymentIntent(PaymentRequest request) {
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(request.getAmount())
                    .setCurrency(request.getCurrency())
                    .setDescription(request.getDescription())
                    .putMetadata("entreprise_id", request.getEntrepriseId())
                    .putMetadata("payment_method", request.getPaymentMethod())
                    .build();
            
            PaymentIntent intent = PaymentIntent.create(params);
            
            return PaymentResponse.builder()
                    .paymentId(intent.getId())
                    .entrepriseId(request.getEntrepriseId())
                    .status(mapStripeStatus(intent.getStatus()))
                    .paymentMethod(request.getPaymentMethod())
                    .amount(request.getAmount())
                    .currency(request.getCurrency())
                    .clientSecret(intent.getClientSecret())
                    .transactionReference(intent.getId())
                    .build();
                    
        } catch (StripeException e) {
            System.err.println("❌ Erreur Stripe PaymentIntent: " + e.getMessage());
            return PaymentResponse.error(
                request.getEntrepriseId(), 
                request.getPaymentMethod(), 
                "Erreur lors de la création du PaymentIntent: " + e.getMessage()
            );
        }
    }
    
    /**
     * Récupère le statut d'un paiement
     */
    public PaymentResponse getPaymentStatus(String paymentId) {
        System.out.println("🚨 [StripeService] getPaymentStatus APPELÉ pour: " + paymentId);
        try {
            System.out.println("🚨 [StripeService] Récupération PaymentIntent depuis Stripe...");
            PaymentIntent intent = PaymentIntent.retrieve(paymentId);
            System.out.println("🚨 [StripeService] PaymentIntent récupéré - Status: " + intent.getStatus());
            
            // Si le paiement vient de réussir, l'enregistrer dans la base de données
            System.out.println("🔍 [StripeService] Status PaymentIntent: " + intent.getStatus());
            if ("succeeded".equals(intent.getStatus())) {
                System.out.println("✅ [StripeService] Paiement réussi, appel savePaiementToDatabase");
                savePaiementToDatabase(intent);
            } else {
                System.out.println("⚠️ [StripeService] Paiement pas réussi, status: " + intent.getStatus());
            }
            
            // Récupérer l'entrepriseId depuis les métadonnées
            String entrepriseId = intent.getMetadata().get("entreprise_id");
            String paymentMethod = intent.getMetadata().get("payment_method");
            
            // Logs de debug pour traçabilité
            System.out.println("🔍 [StripeService] Métadonnées PaymentIntent:");
            System.out.println("- PaymentIntent ID: " + intent.getId());
            System.out.println("- Entreprise ID: " + entrepriseId);
            System.out.println("- Payment Method: " + paymentMethod);
            System.out.println("- Status: " + intent.getStatus());
            
            return PaymentResponse.builder()
                    .paymentId(intent.getId())
                    .entrepriseId(entrepriseId)
                    .status(mapStripeStatus(intent.getStatus()))
                    .paymentMethod(paymentMethod)
                    .amount(intent.getAmount())
                    .currency(intent.getCurrency())
                    .transactionReference(intent.getId())
                    .build();
                    
        } catch (StripeException e) {
            System.err.println("❌ Erreur récupération statut Stripe: " + e.getMessage());
            return PaymentResponse.error("", "STRIPE", 
                "Erreur lors de la récupération du statut: " + e.getMessage());
        }
    }
    
    /**
     * Enregistre un paiement Stripe réussi dans la base de données
     */
    private void savePaiementToDatabase(PaymentIntent intent) {
        System.out.println("🚨 [StripeService] savePaiementToDatabase APPELÉ pour: " + intent.getId());
        System.out.println("🚨 [StripeService] Status dans savePaiementToDatabase: " + intent.getStatus());
        try {
            // Extraire les métadonnées
            String entrepriseId = intent.getMetadata().get("entreprise_id");
            System.out.println("🚨 [StripeService] Entreprise ID extraite: " + entrepriseId);
            
            if (entrepriseId != null) {
                // Récupérer l'entreprise pour obtenir le personneId
                Entreprise entreprise = entrepriseRepository.findById(entrepriseId).orElse(null);
                System.out.println("🔍 [StripeService] Entreprise trouvée: " + (entreprise != null ? entreprise.getNom() : "null"));
                
                if (entreprise != null) {
                    // Utiliser une requête séparée pour éviter le lazy loading
                    List<EntrepriseMembre> membres = entrepriseMembreRepository.findByEntreprise_Id(entrepriseId);
                    System.out.println("🔍 [StripeService] Nombre de membres trouvés: " + membres.size());
                    
                    if (!membres.isEmpty()) {
                        // Trouver le fondateur (premier membre ou membre avec rôle FONDATEUR)
                        String personneId = membres.get(0).getPersonne().getId();
                    
                    // Vérifier si le paiement n'existe pas déjà
                    if (!paiementService.existsByReference(intent.getId())) {
                        // Créer la requête de paiement
                        PaiementRequest paiementRequest = new PaiementRequest();
                        paiementRequest.setPersonneId(personneId);
                        paiementRequest.setEntrepriseId(entrepriseId);
                        paiementRequest.setTypePaiement(TypePaiement.CARTE_BANCAIRE);
                        paiementRequest.setMontant(new BigDecimal(intent.getAmount()).divide(new BigDecimal(100))); // Convertir centimes en unités
                        paiementRequest.setReferenceTransaction(intent.getId());
                        
                        // Mapper le statut Stripe vers notre énumération
                        paiementRequest.setStatut(mapStripeStatusToPaiementStatus(intent.getStatus()));
                        
                        // Définir la date de paiement (maintenant pour les paiements réussis)
                        paiementRequest.setDatePaiement(java.time.LocalDateTime.now());
                        
                        // Logs de debug pour traçabilité
                        System.out.println("🔍 [StripeService] Création paiement:");
                        System.out.println("- PaymentIntent ID: " + intent.getId());
                        System.out.println("- Entreprise ID: " + entrepriseId);
                        System.out.println("- Personne ID: " + personneId);
                        System.out.println("- Montant: " + paiementRequest.getMontant() + " XOF");
                        System.out.println("- Statut: " + paiementRequest.getStatut());
                        System.out.println("- Type Paiement: " + paiementRequest.getTypePaiement());
                        System.out.println("- Date Paiement: " + paiementRequest.getDatePaiement());
                        System.out.println("- Référence Transaction: " + paiementRequest.getReferenceTransaction());
                        paiementRequest.setDescription("Paiement Stripe - Frais de création d'entreprise");
                        
                        // Sauvegarder le paiement
                        paiementService.creerPaiement(paiementRequest);
                        System.out.println("✅ Paiement Stripe enregistré en base: " + intent.getId());
                    } else {
                        System.out.println("ℹ️ Paiement Stripe déjà enregistré: " + intent.getId());
                    }
                    
                    
                    // Transition automatique : REGISSEUR → REVISION après paiement réussi (toujours vérifier)
                    System.out.println("🔍 [StripeService] Vérification transition - Status: " + intent.getStatus() + ", Étape actuelle: " + entreprise.getEtapeValidation());
                    if ("succeeded".equals(intent.getStatus()) && entreprise.getEtapeValidation() == EtapeValidation.REGISSEUR) {
                        System.out.println("🔄 [StripeService] Transition automatique REGISSEUR → REVISION pour entreprise: " + entrepriseId);
                        entreprise.setEtapeValidation(EtapeValidation.REVISION);
                        entreprise.setModification(java.time.Instant.now());
                        entrepriseRepository.save(entreprise);
                        System.out.println("✅ [StripeService] Entreprise transférée à l'étape REVISION: " + entrepriseId);
                    } else {
                        System.out.println("❌ [StripeService] Transition non effectuée - Status: " + intent.getStatus() + ", Étape: " + entreprise.getEtapeValidation());
                    }
                    } else {
                        System.err.println("❌ Aucun membre trouvé pour l'entreprise: " + entrepriseId);
                    }
                } else {
                    System.err.println("❌ Entreprise non trouvée pour: " + entrepriseId);
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'enregistrement du paiement Stripe: " + e.getMessage());
        }
    }
    
    /**
     * Mappe les statuts Stripe vers nos statuts internes
     */
    private PaymentResponse.PaymentStatus mapStripeStatus(String stripeStatus) {
        return switch (stripeStatus) {
            case "succeeded" -> PaymentResponse.PaymentStatus.SUCCEEDED;
            case "processing" -> PaymentResponse.PaymentStatus.PROCESSING;
            case "requires_payment_method" -> PaymentResponse.PaymentStatus.REQUIRES_ACTION;
            case "requires_confirmation" -> PaymentResponse.PaymentStatus.REQUIRES_CONFIRMATION;
            case "requires_action" -> PaymentResponse.PaymentStatus.REQUIRES_ACTION;
            case "canceled" -> PaymentResponse.PaymentStatus.CANCELLED;
            default -> PaymentResponse.PaymentStatus.PENDING;
        };
    }
    
    /**
     * Mappe les statuts Stripe vers nos statuts de paiement internes
     */
    private StatutPaiement mapStripeStatusToPaiementStatus(String stripeStatus) {
        return switch (stripeStatus) {
            case "succeeded" -> StatutPaiement.VALIDE;
            case "canceled" -> StatutPaiement.ANNULE;
            case "processing" -> StatutPaiement.EN_ATTENTE;
            case "requires_payment_method", "requires_confirmation", "requires_action" -> StatutPaiement.EN_ATTENTE;
            default -> StatutPaiement.EN_ATTENTE;
        };
    }
    
    /**
     * Calcule les frais selon le type de demande
     */
    public Long calculateFees(String requestType) {
        return switch (requestType) {
            case "BUSINESS_CREATION" -> businessCreationFee;
            case "DOCUMENT_PROCESSING" -> 500000L; // 5,000 XOF
            case "EXPEDITED_PROCESSING" -> 1000000L; // 10,000 XOF
            default -> businessCreationFee;
        };
    }
}
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
