package abdaty_technologie.API_Invest.orangemoney.v2.controller;

import abdaty_technologie.API_Invest.orangemoney.v2.model.WebPaymentResponse;
import abdaty_technologie.API_Invest.orangemoney.v2.model.TransactionStatusResponse;
import abdaty_technologie.API_Invest.orangemoney.v2.service.OrangeMoneyServiceV2;
import abdaty_technologie.API_Invest.service.EntrepriseService;
import abdaty_technologie.API_Invest.service.PaymentService;
import abdaty_technologie.API_Invest.Entity.Enum.StatutPaiement;
import abdaty_technologie.API_Invest.Entity.Enum.TypePaiement;
import abdaty_technologie.API_Invest.Entity.Enum.StatutCreation;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Paiement;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Contrôleur REST pour gérer les paiements Orange Money V2
 * Nouvelle implémentation basée sur les tests Postman fournis
 */
@RestController
@RequestMapping("/orange-money/v2")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "https://investmali-agent.abdatytch.com","http://investmali.com"})
public class OrangeMoneyControllerV2 {
    
    private static final Logger logger = LoggerFactory.getLogger(OrangeMoneyControllerV2.class);
    
    @Autowired
    private OrangeMoneyServiceV2 orangeMoneyServiceV2;
    
    @Autowired
    private EntrepriseService entrepriseService;
    
    @Autowired
    private PaymentService paymentService;
    
    @Autowired
    private PersonsRepository personsRepository;
    
    @Autowired
    private UtilisateursRepository utilisateursRepository;
    
    /**
     * Endpoint pour initialiser un paiement Orange Money V2
     * Utilise la nouvelle logique basée sur les tests Postman
     */
    @PostMapping("/initiate")
    @PreAuthorize("hasRole('USER') or hasRole('AGENT_ACCUEIL')")
    public ResponseEntity<Map<String, Object>> initiatePayment(@RequestBody Map<String, Object> request, Authentication authentication) {
        logger.info("🍊 [OrangeMoneyV2] Demande d'initialisation de paiement Orange Money V2");
        
        try {
            // Vérifier l'authentification
            if (authentication == null) {
                logger.warn("⚠️ [OrangeMoneyV2] Authentication paramètre est null, tentative avec SecurityContextHolder");
                authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null) {
                    logger.warn("⚠️ [OrangeMoneyV2] Aucune authentification trouvée");
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Utilisateur non authentifié"));
                }
            }
            
            // Récupérer l'utilisateur connecté
            String currentUserEmail = authentication.getName();
            if (currentUserEmail == null || currentUserEmail.isEmpty()) {
                logger.warn("⚠️ [OrangeMoneyV2] Email utilisateur null ou vide");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Utilisateur non identifié"));
            }
            logger.info("👤 [OrangeMoneyV2] Utilisateur connecté: {}", currentUserEmail);
            
            // Essayer de récupérer le personne_id depuis le contexte de sécurité
            String personneId = null;
            if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                // Si c'est un UserDetails, essayer de récupérer les informations depuis le token
                logger.info("🔍 [OrangeMoneyV2] Tentative de récupération du personne_id depuis le token...");
            }
            
            // Récupérer la personne connectée par son email
            if (!currentUserEmail.equals("anonymousUser")) {
                // Chercher d'abord par email dans la table Persons
                Optional<Persons> personByEmail = personsRepository.findByEmail(currentUserEmail);
                if (personByEmail.isPresent()) {
                    personneId = personByEmail.get().getId();
                    logger.info("👤 [OrangeMoneyV2] Personne trouvée par email: {} → ID: {}", currentUserEmail, personneId);
                } else {
                    logger.warn("⚠️ [OrangeMoneyV2] Aucune personne trouvée pour l'email: {}", currentUserEmail);
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Utilisateur non trouvé", 
                                   "message", "Aucun profil trouvé pour cet utilisateur",
                                   "email", currentUserEmail));
                }
            } else if (currentUserEmail.equals("anonymousUser")) {
                // Cas où l'authentification a échoué - ERREUR CRITIQUE
                logger.error("❌ [OrangeMoneyV2] ERREUR: Utilisateur anonyme détecté - authentification requise");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentification requise", 
                               "message", "Vous devez être connecté pour effectuer un paiement",
                               "code", "AUTH_REQUIRED"));
            }
            
            Persons currentPerson = null;
            if (personneId != null) {
                // Chercher directement par ID
                logger.info("� [OrangeMoneyV2] Recherche de la personne avec l'ID: '{}'", personneId);
                currentPerson = personsRepository.findById(personneId).orElse(null);
                
                if (currentPerson != null) {
                    logger.info("👤 [OrangeMoneyV2] Personne trouvée par ID: {} {} (ID: {})", 
                               currentPerson.getPrenom(), currentPerson.getNom(), currentPerson.getId());
                } else {
                    logger.warn("⚠️ [OrangeMoneyV2] Personne non trouvée avec l'ID: '{}'", personneId);
                }
            }
            
            // Fallback : chercher par email si pas trouvé par ID
            if (currentPerson == null) {
                logger.info("🔍 [OrangeMoneyV2] Fallback - recherche par email: '{}'", currentUserEmail);
                currentPerson = personsRepository.findByEmail(currentUserEmail).orElse(null);
                
                if (currentPerson == null) {
                    logger.warn("⚠️ [OrangeMoneyV2] Aucune personne trouvée pour l'email: '{}'", currentUserEmail);
                    
                    // Mode test : créer une personne temporaire
                    if (currentUserEmail.contains("test") || currentUserEmail.contains("mdz.dev54")) {
                        logger.info("🧪 [OrangeMoneyV2] Mode test - création d'une personne temporaire");
                        currentPerson = new Persons();
                        currentPerson.setId("49c97491-f8b3-41b1-ae73-8e0afc0cb11e");
                        currentPerson.setEmail(currentUserEmail);
                        currentPerson.setNom("Doukhanse");
                        currentPerson.setPrenom("Abdoul");
                        logger.info("🧪 [OrangeMoneyV2] Personne de test créée: {} {} (ID: {})", 
                                   currentPerson.getPrenom(), currentPerson.getNom(), currentPerson.getId());
                    } else {
                        return ResponseEntity.badRequest()
                            .body(Map.of("error", "Utilisateur non trouvé"));
                    }
                } else {
                    logger.info("👤 [OrangeMoneyV2] Personne trouvée par email: {} {}", 
                               currentPerson.getPrenom(), currentPerson.getNom());
                }
            }
            logger.info("👤 [OrangeMoneyV2] Personne trouvée: {} {} (ID: {})", 
                       currentPerson.getPrenom(), currentPerson.getNom(), currentPerson.getId());
            
            // Récupérer les données de la requête
            String entrepriseId = (String) request.get("entrepriseId");
            Object amountObj = request.get("amount");
            
            if (entrepriseId == null || amountObj == null) {
                logger.warn("⚠️ [OrangeMoneyV2] Données manquantes: entrepriseId={}, amount={}", 
                           entrepriseId, amountObj);
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Données manquantes: entrepriseId et amount requis"));
            }
            
            // Convertir le montant
            Double amount;
            if (amountObj instanceof Integer) {
                amount = ((Integer) amountObj).doubleValue();
            } else if (amountObj instanceof Double) {
                amount = (Double) amountObj;
            } else {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Format de montant invalide"));
            }
            
            // Vérifier que l'entreprise existe (sauf pour les tests)
            Entreprise entreprise = null;
            if (!"test".equals(entrepriseId)) {
                entreprise = entrepriseService.findById(entrepriseId);
                if (entreprise == null) {
                    logger.warn("⚠️ [OrangeMoneyV2] Entreprise non trouvée: {}", entrepriseId);
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Entreprise non trouvée avec l'ID: " + entrepriseId));
                }
            } else {
                logger.info("🧪 [OrangeMoneyV2] Mode test avec entrepriseId=test");
            }
            
            // Vérifier s'il existe déjà un paiement en attente pour cette entreprise
            // Note: Cette vérification sera implémentée plus tard si nécessaire
            // Pour l'instant, on continue avec la logique normale
            
            // Générer un ID de commande unique avec timestamp et random pour éviter les doublons
            String timestamp = String.valueOf(System.currentTimeMillis());
            String randomSuffix = String.valueOf((int)(Math.random() * 10000));
            String orderId = "merchant_order_" + timestamp + "_" + randomSuffix;
            // Générer une référence similaire au curl qui fonctionne (ref-xyz.456)
            String reference = "ref-" + timestamp + ".inv";
            
            // Utiliser le montant directement (comme dans le test Postman)
            Integer amountForOrangeMoney = amount.intValue();
            
            logger.info("💳 [OrangeMoneyV2] Initialisation - Entreprise: {}, Montant: {} XOF, OrderID: {}", 
                       entreprise.getNom(), amountForOrangeMoney, orderId);
            
            // D'ABORD appeler le service Orange Money V2
            WebPaymentResponse omResponse = orangeMoneyServiceV2.createWebPayment(orderId, amountForOrangeMoney, reference);
            
            if (omResponse != null && omResponse.isSuccess() && omResponse.getPaymentUrl() != null) {
                // SEULEMENT si Orange Money réussit, créer l'enregistrement de paiement
                Paiement paiement = new Paiement();
                paiement.setEntreprise(entreprise);
                paiement.setPersonne(currentPerson); // Associer la personne qui effectue le paiement
                paiement.setMontant(BigDecimal.valueOf(amount));
                paiement.setTypePaiement(TypePaiement.MOBILE_MONEY);
                paiement.setStatut(StatutPaiement.EN_ATTENTE);
                paiement.setReferenceTransaction(orderId);
                paiement.setDescription("Paiement Orange Money V2 - " + entreprise.getNom());
                paiement.setPayToken(omResponse.getPayToken()); // Sauvegarder le pay_token
                
                // Sauvegarder le paiement
                paiement = paymentService.save(paiement);
                logger.info("💾 [OrangeMoneyV2] Paiement créé en BDD avec ID: {}", paiement.getId());
                
                // Succès - retourner l'URL de paiement
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("payment_url", omResponse.getPaymentUrl());
                response.put("order_id", orderId);
                response.put("amount", amount);
                response.put("currency", "OUV");
                response.put("payment_id", paiement.getId());
                response.put("pay_token", omResponse.getPayToken());
                response.put("notif_token", omResponse.getNotifToken());
                response.put("status", omResponse.getStatus());
                response.put("message", omResponse.getMessage());
                
                logger.info(" [OrangeMoneyV2] Paiement initialisé avec succès - URL: {}", 
                           omResponse.getPaymentUrl());
                
                return ResponseEntity.ok(response);
                
            } else {
                // Échec Orange Money - ne pas créer de paiement en base
                logger.error(" [OrangeMoneyV2] Échec de l'initialisation Orange Money V2");
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", "Échec de l'initialisation du paiement Orange Money V2");
                response.put("message", omResponse != null ? omResponse.getMessage() : "Erreur inconnue");
                response.put("status", omResponse != null ? omResponse.getStatus() : null);
                
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
            
        } catch (Exception e) {
            logger.error(" [OrangeMoneyV2] Erreur lors de l'initialisation du paiement: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "Échec de l'initialisation du paiement Orange Money V2");
            response.put("message", e.getMessage());
            response.put("error_class", e.getClass().getSimpleName());
            response.put("status", null);
            
            // Ajouter la stack trace pour le debug
            if (e.getCause() != null) {
                response.put("cause", e.getCause().getMessage());
            }
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    /**
     * Endpoint de callback (webhook) appelé par Orange Money V2
     * Traite les notifications de statut de paiement
     */
    @PostMapping("/callback")
    public ResponseEntity<Void> handleCallback(@RequestBody Map<String, Object> notification) {
        logger.info("📞 [OrangeMoneyV2] Callback reçu d'Orange Money V2");
        logger.info("📞 [OrangeMoneyV2] Notification: {}", notification);
        
        try {
            String orderId = (String) notification.get("order_id");
            String status = (String) notification.get("status");
            String transactionId = (String) notification.get("transaction_id");
            
            if (orderId == null) {
                logger.warn("⚠️ [OrangeMoneyV2] OrderID manquant dans la notification");
                return ResponseEntity.badRequest().build();
            }
            
            // Valider la notification
            String notifToken = (String) notification.get("notif_token");
            if (notifToken != null && !orangeMoneyServiceV2.validateNotification(notifToken, orderId)) {
                logger.warn("⚠️ [OrangeMoneyV2] Notification non valide pour OrderID: {}", orderId);
                return ResponseEntity.badRequest().build();
            }
            
            // Trouver le paiement correspondant
            Paiement paiement = paymentService.findByReferenceTransaction(orderId);
            if (paiement == null) {
                logger.warn("⚠️ [OrangeMoneyV2] Paiement non trouvé pour OrderID: {}", orderId);
                return ResponseEntity.notFound().build();
            }
            
            logger.info("💳 [OrangeMoneyV2] Traitement du callback - Paiement ID: {}, Statut: {}", 
                       paiement.getId(), status);
            
            // Mettre à jour le statut du paiement selon la notification
            if ("SUCCESS".equalsIgnoreCase(status)) {
                // Paiement réussi
                paiement.setStatut(StatutPaiement.VALIDE);
                paiement.setReferenceTransaction(transactionId != null ? transactionId : orderId);
                paiement.setDatePaiement(LocalDateTime.now());
                
                // Mettre à jour l'entreprise
                Entreprise entreprise = paiement.getEntreprise();
                if (entreprise != null) {
                    entreprise.setStatutCreation(StatutCreation.EN_COURS);
                    entreprise.setEtapeValidation(EtapeValidation.REVISION);
                    
                    // Désassigner de l'agent d'accueil lors du passage en REVISION
                    if (entreprise.getAssignedTo() != null) {
                        logger.info("🔄 [OrangeMoneyV2] Désassignation automatique - Paiement Orange Money V2 validé");
                        entreprise.setAssignedTo(null);
                    }
                    
                    entrepriseService.save(entreprise);
                    logger.info("✅ [OrangeMoneyV2] Entreprise mise à jour - Statut: EN_COURS, Étape: REVISION");
                }
                
                logger.info("✅ [OrangeMoneyV2] Paiement Orange Money V2 validé - ID: {}, Transaction: {}", 
                           paiement.getId(), transactionId);
                
            } else if ("FAILED".equalsIgnoreCase(status) || "CANCELLED".equalsIgnoreCase(status)) {
                // Paiement échoué ou annulé
                paiement.setStatut(StatutPaiement.REFUSE);
                paiement.setDatePaiement(LocalDateTime.now());
                
                String message = (String) notification.get("message");
                logger.info("❌ [OrangeMoneyV2] Paiement Orange Money V2 échoué/annulé - ID: {}, Raison: {}", 
                           paiement.getId(), message != null ? message : status);
                
            } else {
                // Statut en attente ou autre
                logger.info("⏳ [OrangeMoneyV2] Paiement Orange Money V2 en attente - ID: {}, Statut: {}", 
                           paiement.getId(), status);
            }
            
            // Sauvegarder les modifications
            paymentService.save(paiement);
            
            // Toujours retourner 200 OK pour confirmer la réception à Orange Money
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyV2] Erreur lors du traitement du callback: {}", e.getMessage(), e);
            
            // Même en cas d'erreur, retourner 200 OK pour éviter les re-tentatives d'Orange Money
            return ResponseEntity.ok().build();
        }
    }
    
    /**
     * Endpoint pour vérifier le statut d'un paiement Orange Money V2
     */
    @GetMapping("/status/{paymentId}")
    @PreAuthorize("hasRole('USER') or hasRole('AGENT_ACCUEIL')")
    public ResponseEntity<Map<String, Object>> getPaymentStatus(@PathVariable String paymentId) {
        logger.info("🔍 [OrangeMoneyV2] Vérification du statut - Payment ID: {}", paymentId);
        
        try {
            Paiement paiement = paymentService.findById(paymentId);
            if (paiement == null) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("payment_id", paiement.getId());
            response.put("status", paiement.getStatut().toString());
            response.put("amount", paiement.getMontant());
            response.put("method", "Orange Money V2");
            response.put("transaction_id", paiement.getReferenceTransaction());
            response.put("created_at", paiement.getCreation());
            response.put("validated_at", paiement.getDatePaiement());
            response.put("version", "v2");
            
            if (paiement.getEntreprise() != null) {
                response.put("entreprise_id", paiement.getEntreprise().getId());
                response.put("entreprise_name", paiement.getEntreprise().getNom());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyV2] Erreur lors de la vérification du statut: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erreur interne du serveur"));
        }
    }
    
    /**
     * Endpoint pour forcer la vérification et mise à jour du statut d'un paiement
     */
    @PostMapping("/force-update-status/{orderId}")
    @PreAuthorize("hasRole('USER') or hasRole('AGENT_ACCUEIL')")
    public ResponseEntity<Map<String, Object>> forceUpdateStatus(@PathVariable String orderId) {
        logger.info("🔄 [OrangeMoneyV2] Force update statut - OrderID: {}", orderId);
        
        try {
            Paiement paiement = paymentService.findByReferenceTransaction(orderId);
            
            if (paiement == null) {
                return ResponseEntity.notFound().build();
            }
            
            if (paiement.getPayToken() == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "Pay token manquant pour ce paiement"));
            }
            
            // Vérifier le statut via Orange Money
            TransactionStatusResponse statusResponse = orangeMoneyServiceV2.checkTransactionStatus(
                paiement.getReferenceTransaction(), 
                paiement.getMontant().intValue(), 
                paiement.getPayToken()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("order_id", orderId);
            response.put("current_status", paiement.getStatut().toString());
            
            if (statusResponse != null) {
                if (statusResponse.isSuccess()) {
                    // Paiement réussi
                    paiement.setStatut(StatutPaiement.VALIDE);
                    if (statusResponse.getTxnid() != null) {
                        paiement.setReferenceTransaction(statusResponse.getTxnid());
                    }
                    paiement.setDatePaiement(LocalDateTime.now());
                    
                    // Mettre à jour l'entreprise
                    Entreprise entreprise = paiement.getEntreprise();
                    if (entreprise != null) {
                        entreprise.setStatutCreation(StatutCreation.EN_COURS);
                        entreprise.setEtapeValidation(EtapeValidation.REVISION);
                        
                        // Désassigner de l'agent d'accueil
                        if (entreprise.getAssignedTo() != null) {
                            logger.info("🔄 [OrangeMoneyV2] Désassignation automatique - Paiement validé");
                            entreprise.setAssignedTo(null);
                        }
                        
                        entrepriseService.save(entreprise);
                    }
                    
                    paymentService.save(paiement);
                    logger.info("✅ [OrangeMoneyV2] Paiement mis à jour avec succès - ID: {}", paiement.getId());
                    
                    response.put("success", true);
                    response.put("updated", true);
                    response.put("new_status", "VALIDE");
                    response.put("txnid", statusResponse.getTxnid());
                    response.put("orange_money_status", statusResponse.getStatus());
                    
                } else if (statusResponse.isFailed()) {
                    // Paiement échoué
                    paiement.setStatut(StatutPaiement.REFUSE);
                    paiement.setDatePaiement(LocalDateTime.now());
                    
                    paymentService.save(paiement);
                    logger.info("❌ [OrangeMoneyV2] Paiement marqué comme échoué via force-update - ID: {}", paiement.getId());
                    
                    response.put("success", true);
                    response.put("updated", true);
                    response.put("new_status", "REFUSE");
                    response.put("orange_money_status", statusResponse.getStatus());
                    response.put("message", "Paiement marqué comme échoué");
                    
                } else {
                    // Paiement en attente
                    response.put("success", true);
                    response.put("updated", false);
                    response.put("orange_money_status", statusResponse.getStatus());
                    response.put("message", "Le paiement est toujours en attente");
                }
            } else {
                response.put("success", false);
                response.put("updated", false);
                response.put("orange_money_status", "ERROR");
                response.put("message", "Impossible de vérifier le statut auprès d'Orange Money");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyV2] Erreur force update statut: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "Erreur interne du serveur", "message", e.getMessage()));
        }
    }
    
    /**
     * Endpoint de test pour simuler un statut d'échec (à des fins de test uniquement)
     */
    @PostMapping("/test-simulate-failed/{orderId}")
    @PreAuthorize("hasRole('USER') or hasRole('AGENT_ACCUEIL')")
    public ResponseEntity<Map<String, Object>> simulateFailedStatus(@PathVariable String orderId) {
        logger.info("🧪 [OrangeMoneyV2] Test simulation échec - OrderID: {}", orderId);
        
        try {
            Paiement paiement = paymentService.findByReferenceTransaction(orderId);
            
            if (paiement == null) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("order_id", orderId);
            response.put("current_status", paiement.getStatut().toString());
            
            // Simuler un paiement échoué si il est EN_ATTENTE
            if (paiement.getStatut() == StatutPaiement.EN_ATTENTE) {
                paiement.setStatut(StatutPaiement.REFUSE);
                paiement.setDatePaiement(LocalDateTime.now());
                
                paymentService.save(paiement);
                logger.info("🧪 [OrangeMoneyV2] Paiement simulé comme échoué - ID: {}", paiement.getId());
                
                response.put("success", true);
                response.put("updated", true);
                response.put("new_status", "REFUSE");
                response.put("message", "Paiement simulé comme échoué pour test");
            } else {
                response.put("success", false);
                response.put("updated", false);
                response.put("message", "Le paiement n'est pas EN_ATTENTE, impossible de simuler l'échec");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyV2] Erreur simulation échec: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "Erreur interne du serveur", "message", e.getMessage()));
        }
    }
    
    /**
     * Endpoint pour vérifier le statut d'une transaction avec pay_token
     * Utilise l'API Orange Money /transactionstatus
     */
    @PostMapping("/check-transaction-status")
    @PreAuthorize("hasRole('USER') or hasRole('AGENT_ACCUEIL')")
    public ResponseEntity<Map<String, Object>> checkTransactionStatus(@RequestBody Map<String, Object> request) {
        logger.info("🔍 [OrangeMoneyV2] Demande de vérification du statut de transaction");
        
        try {
            // Récupérer les données de la requête
            String orderId = (String) request.get("order_id");
            Object amountObj = request.get("amount");
            String payToken = (String) request.get("pay_token");
            
            if (orderId == null || amountObj == null || payToken == null) {
                logger.warn("⚠️ [OrangeMoneyV2] Données manquantes pour vérification statut: orderId={}, amount={}, payToken={}", 
                           orderId, amountObj, payToken != null ? payToken.substring(0, Math.min(10, payToken.length())) + "..." : "null");
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Données manquantes: order_id, amount et pay_token requis"));
            }
            
            // Convertir le montant
            Integer amount;
            if (amountObj instanceof Integer) {
                amount = (Integer) amountObj;
            } else if (amountObj instanceof Double) {
                amount = ((Double) amountObj).intValue();
            } else {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Format de montant invalide"));
            }
            
            logger.info("🔍 [OrangeMoneyV2] Vérification statut - OrderID: {}, Amount: {}", orderId, amount);
            
            // Appeler le service pour vérifier le statut
            TransactionStatusResponse statusResponse = orangeMoneyServiceV2.checkTransactionStatus(orderId, amount, payToken);
            
            if (statusResponse != null) {
                // Mettre à jour le paiement en base si nécessaire
                Paiement paiement = paymentService.findByReferenceTransaction(orderId);
                
                if (paiement != null && paiement.getStatut() == StatutPaiement.EN_ATTENTE) {
                    if (statusResponse.isSuccess()) {
                        // Paiement réussi
                        paiement.setStatut(StatutPaiement.VALIDE);
                        paiement.setReferenceTransaction(statusResponse.getTxnid());
                        paiement.setDatePaiement(LocalDateTime.now());
                        
                        // Mettre à jour l'entreprise
                        Entreprise entreprise = paiement.getEntreprise();
                        if (entreprise != null) {
                            entreprise.setStatutCreation(StatutCreation.EN_COURS);
                            entreprise.setEtapeValidation(EtapeValidation.REVISION);
                            
                            // Désassigner de l'agent d'accueil
                            if (entreprise.getAssignedTo() != null) {
                                logger.info("🔄 [OrangeMoneyV2] Désassignation automatique - Paiement validé via check-status");
                                entreprise.setAssignedTo(null);
                            }
                            
                            entrepriseService.save(entreprise);
                        }
                        
                        paymentService.save(paiement);
                        logger.info("✅ [OrangeMoneyV2] Paiement mis à jour suite à vérification statut - ID: {}", paiement.getId());
                        
                    } else if (statusResponse.isFailed()) {
                        // Paiement échoué
                        paiement.setStatut(StatutPaiement.REFUSE);
                        paiement.setDatePaiement(LocalDateTime.now());
                        
                        paymentService.save(paiement);
                        logger.info("❌ [OrangeMoneyV2] Paiement marqué comme échoué suite à vérification statut - ID: {}, Statut Orange: {}", 
                                   paiement.getId(), statusResponse.getStatus());
                    }
                    // Si isPending(), on ne fait rien, le paiement reste EN_ATTENTE
                }
                
                // Retourner la réponse
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("status", statusResponse.getStatus());
                response.put("order_id", statusResponse.getOrderId());
                response.put("txnid", statusResponse.getTxnid());
                response.put("is_success", statusResponse.isSuccess());
                response.put("is_failed", statusResponse.isFailed());
                response.put("is_pending", statusResponse.isPending());
                
                return ResponseEntity.ok(response);
                
            } else {
                logger.error("❌ [OrangeMoneyV2] Échec de la vérification du statut de transaction");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", "Échec de la vérification du statut"));
            }
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyV2] Erreur lors de la vérification du statut: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "Erreur interne du serveur"));
        }
    }
    
    /**
     * Endpoint de redirection de retour (return-url)
     * Appelé quand l'utilisateur termine le paiement avec succès
     */
    @GetMapping("/return")
    public ResponseEntity<String> handleReturn(
            @RequestParam(required = false) String order_id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String txnid) {
        
        logger.info("🔄 [OrangeMoneyV2] Redirection de retour - OrderID: {}, Status: {}, TxnID: {}", 
                   order_id, status, txnid);
        
        try {
            // Créer une page HTML de succès avec les informations de paiement
            String htmlResponse = "<!DOCTYPE html>\n" +
                "<html lang='fr'>\n" +
                "<head>\n" +
                "    <meta charset='UTF-8'>\n" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
                "    <title>Paiement Orange Money - Résultat</title>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\n" +
                "        .success { color: #28a745; text-align: center; }\n" +
                "        .info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }\n" +
                "        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; }\n" +
                "        .btn:hover { background: #0056b3; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class='container'>\n" +
                "        <h1 class='success'>✅ Paiement Orange Money</h1>\n" +
                "        <div class='info'>\n" +
                "            <h3>Informations de transaction :</h3>\n" +
                "            <p><strong>Statut :</strong> " + (status != null ? status : "En cours de vérification") + "</p>\n" +
                "            <p><strong>Numéro de commande :</strong> " + (order_id != null ? order_id : "N/A") + "</p>\n" +
                "            <p><strong>ID de transaction :</strong> " + (txnid != null ? txnid : "En attente") + "</p>\n" +
                "        </div>\n" +
                "        <p>Votre paiement a été traité. Vous pouvez fermer cette fenêtre.</p>\n" +
                "        <a href='#' onclick='window.close()' class='btn'>Fermer</a>\n" +
                "    </div>\n" +
                "    <script>\n" +
                "        // Notifier la fenêtre parent si c'est une popup\n" +
                "        if (window.opener) {\n" +
                "            window.opener.postMessage({\n" +
                "                type: 'ORANGE_MONEY_RETURN',\n" +
                "                data: {\n" +
                "                    order_id: '" + (order_id != null ? order_id : "") + "',\n" +
                "                    status: '" + (status != null ? status : "") + "',\n" +
                "                    txnid: '" + (txnid != null ? txnid : "") + "'\n" +
                "                }\n" +
                "            }, '*');\n" +
                "        }\n" +
                "    </script>\n" +
                "</body>\n" +
                "</html>";
            
            return ResponseEntity.ok()
                .header("Content-Type", "text/html; charset=UTF-8")
                .body(htmlResponse);
                
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyV2] Erreur lors du traitement de la redirection de retour: {}", e.getMessage(), e);
            return ResponseEntity.ok()
                .header("Content-Type", "text/html; charset=UTF-8")
                .body("<html><body><h1>Erreur</h1><p>Une erreur s'est produite lors du traitement de votre paiement.</p></body></html>");
        }
    }
    
    /**
     * Endpoint de redirection d'annulation (cancel-url)
     * Appelé quand l'utilisateur annule le paiement
     */
    @GetMapping("/cancel")
    public ResponseEntity<String> handleCancel(
            @RequestParam(required = false) String order_id,
            @RequestParam(required = false) String reason) {
        
        logger.info("❌ [OrangeMoneyV2] Redirection d'annulation - OrderID: {}, Reason: {}", order_id, reason);
        
        try {
            // Mettre à jour le paiement comme annulé si trouvé
            if (order_id != null) {
                Paiement paiement = paymentService.findByReferenceTransaction(order_id);
                if (paiement != null && paiement.getStatut() == StatutPaiement.EN_ATTENTE) {
                    paiement.setStatut(StatutPaiement.REFUSE);
                    paiement.setDatePaiement(LocalDateTime.now());
                    paymentService.save(paiement);
                    logger.info("❌ [OrangeMoneyV2] Paiement marqué comme annulé - ID: {}", paiement.getId());
                }
            }
            
            // Créer une page HTML d'annulation
            String htmlResponse = "<!DOCTYPE html>\n" +
                "<html lang='fr'>\n" +
                "<head>\n" +
                "    <meta charset='UTF-8'>\n" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
                "    <title>Paiement Orange Money - Annulé</title>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\n" +
                "        .cancel { color: #dc3545; text-align: center; }\n" +
                "        .info { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }\n" +
                "        .btn { background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; }\n" +
                "        .btn:hover { background: #545b62; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class='container'>\n" +
                "        <h1 class='cancel'>❌ Paiement Annulé</h1>\n" +
                "        <div class='info'>\n" +
                "            <h3>Paiement annulé :</h3>\n" +
                "            <p><strong>Numéro de commande :</strong> " + (order_id != null ? order_id : "N/A") + "</p>\n" +
                "            <p><strong>Raison :</strong> " + (reason != null ? reason : "Annulé par l'utilisateur") + "</p>\n" +
                "        </div>\n" +
                "        <p>Votre paiement a été annulé. Vous pouvez fermer cette fenêtre et réessayer.</p>\n" +
                "        <a href='#' onclick='window.close()' class='btn'>Fermer</a>\n" +
                "    </div>\n" +
                "    <script>\n" +
                "        // Notifier la fenêtre parent si c'est une popup\n" +
                "        if (window.opener) {\n" +
                "            window.opener.postMessage({\n" +
                "                type: 'ORANGE_MONEY_CANCEL',\n" +
                "                data: {\n" +
                "                    order_id: '" + (order_id != null ? order_id : "") + "',\n" +
                "                    reason: '" + (reason != null ? reason : "Annulé par l'utilisateur") + "'\n" +
                "                }\n" +
                "            }, '*');\n" +
                "        }\n" +
                "    </script>\n" +
                "</body>\n" +
                "</html>";
            
            return ResponseEntity.ok()
                .header("Content-Type", "text/html; charset=UTF-8")
                .body(htmlResponse);
                
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyV2] Erreur lors du traitement de l'annulation: {}", e.getMessage(), e);
            return ResponseEntity.ok()
                .header("Content-Type", "text/html; charset=UTF-8")
                .body("<html><body><h1>Erreur</h1><p>Une erreur s'est produite lors du traitement de l'annulation.</p></body></html>");
        }
    }
    
    /**
     * Endpoint de notification (notif-url)
     * Appelé par Orange Money pour notifier le changement de statut
     */
    @PostMapping("/notif")
    public ResponseEntity<Void> handleNotification(@RequestBody Map<String, Object> notification) {
        logger.info("📞 [OrangeMoneyV2] Notification reçue: {}", notification);
        
        try {
            String orderId = (String) notification.get("order_id");
            String status = (String) notification.get("status");
            String txnid = (String) notification.get("txnid");
            
            if (orderId != null) {
                // Trouver le paiement correspondant
                Paiement paiement = paymentService.findByReferenceTransaction(orderId);
                if (paiement != null) {
                    // Mettre à jour selon le statut
                    if ("SUCCESS".equalsIgnoreCase(status)) {
                        paiement.setStatut(StatutPaiement.VALIDE);
                        paiement.setReferenceTransaction(txnid != null ? txnid : orderId);
                        paiement.setDatePaiement(LocalDateTime.now());
                        
                        // Mettre à jour l'entreprise
                        Entreprise entreprise = paiement.getEntreprise();
                        if (entreprise != null) {
                            entreprise.setStatutCreation(StatutCreation.EN_COURS);
                            entreprise.setEtapeValidation(EtapeValidation.REVISION);
                            
                            if (entreprise.getAssignedTo() != null) {
                                logger.info("🔄 [OrangeMoneyV2] Désassignation automatique - Notification de succès");
                                entreprise.setAssignedTo(null);
                            }
                            
                            entrepriseService.save(entreprise);
                        }
                        
                        logger.info("✅ [OrangeMoneyV2] Paiement validé via notification - ID: {}", paiement.getId());
                    } else {
                        paiement.setStatut(StatutPaiement.REFUSE);
                        paiement.setDatePaiement(LocalDateTime.now());
                        logger.info("❌ [OrangeMoneyV2] Paiement refusé via notification - ID: {}", paiement.getId());
                    }
                    
                    paymentService.save(paiement);
                }
            }
            
            // Toujours retourner 200 OK
            return ResponseEntity.ok().build();
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyV2] Erreur lors du traitement de la notification: {}", e.getMessage(), e);
            return ResponseEntity.ok().build(); // Toujours OK pour éviter les re-tentatives
        }
    }
    
    /**
     * Endpoint pour tester la connectivité avec l'API Orange Money V2
     */
    @GetMapping("/test-connection")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> testConnection() {
        logger.info("🔧 [OrangeMoneyV2] Test de connectivité avec l'API Orange Money V2");
        
        try {
            String token = orangeMoneyServiceV2.getAccessToken();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", token != null);
            response.put("message", token != null ? "Connexion réussie" : "Échec de connexion");
            response.put("timestamp", LocalDateTime.now());
            response.put("version", "v2");
            
            if (token != null) {
                response.put("token_preview", token.substring(0, Math.min(20, token.length())) + "...");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ [OrangeMoneyV2] Erreur lors du test de connectivité: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "Erreur de connectivité", "message", e.getMessage()));
        }
    }
}
