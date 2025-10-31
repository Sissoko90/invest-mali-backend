<<<<<<< HEAD
package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.dto.PaymentRequest;
import abdaty_technologie.API_Invest.dto.PaymentResponse;
import abdaty_technologie.API_Invest.service.TresorPayService;
import abdaty_technologie.API_Invest.dto.tresorpay.TresorPayNoticeRequest;
import abdaty_technologie.API_Invest.dto.tresorpay.TresorPayNoticeResponse;
import abdaty_technologie.API_Invest.dto.tresorpay.TresorPayStatusResponse;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.EntrepriseMembre;
import abdaty_technologie.API_Invest.Entity.Payment;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.InvestmentAgreement;
import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseMembreRepository;
import abdaty_technologie.API_Invest.repository.PaymentRepository;
import abdaty_technologie.API_Invest.repository.InvestmentAgreementRepository;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur pour la gestion des paiements multi-méthodes
 */
@RestController
@RequestMapping("/payments")
@Tag(name = "Payments", description = "API de gestion des paiements")
public class PaymentController {
    
    // StripeService removed - replaced by TresorPay integration
    
    @Autowired
    private TresorPayService tresorPayService;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private EntrepriseRepository entrepriseRepository;
    
    @Autowired
    private EntrepriseMembreRepository entrepriseMembreRepository;
    
    @Autowired
    private InvestmentAgreementRepository investmentAgreementRepository;
    
    @Autowired
    private UtilisateursRepository utilisateursRepository;
    
    @Value("${stripe.public-key}")
    private String stripePublicKey;
    
    /**
     * Récupère la clé publique Stripe pour le frontend
     */
    @GetMapping("/stripe/public-key")
    @Operation(summary = "Récupère la clé publique Stripe")
    public ResponseEntity<Map<String, String>> getStripePublicKey() {
        Map<String, String> response = new HashMap<>();
        response.put("publicKey", stripePublicKey);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Initie un paiement selon la méthode choisie
     */
    @PostMapping("/initiate")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Transactional
    @Operation(summary = "Initie un paiement", description = "Crée une session de paiement selon la méthode choisie")
    public ResponseEntity<PaymentResponse> initiatePayment(@Valid @RequestBody PaymentRequest request) {
        System.out.println("💳 Initiation paiement: " + request.getPaymentMethod() + " pour entreprise: " + request.getEntrepriseId());
        
        PaymentResponse response;
        
        switch (request.getPaymentMethod()) {
            case "TRESORPAY" -> {
                // Paiement via TresorPay (remplace tous les autres moyens sauf cash)
                response = handleTresorPayPayment(request);
            }
            case "CASH" -> {
                // Paiement en espèces (conservé)
                response = handleCashPayment(request);
            }
            default -> {
                response = PaymentResponse.error(
                    request.getEntrepriseId(),
                    request.getPaymentMethod(),
                    "Méthode de paiement non supportée: " + request.getPaymentMethod() + ". Utilisez TRESORPAY ou CASH."
                );
            }
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Vérifie le statut d'un paiement
     */
    @GetMapping("/{paymentId}/status")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Operation(summary = "Vérifie le statut d'un paiement")
    public ResponseEntity<PaymentResponse> getPaymentStatus(@PathVariable String paymentId) {
        System.out.println("🔍 Vérification statut paiement: " + paymentId);
        
        // Pour TresorPay, utiliser le service TresorPay
        if (paymentId.startsWith("TP")) {
            TresorPayStatusResponse tresorPayStatus = tresorPayService.getNoticeStatus(paymentId);
            PaymentResponse response = convertTresorPayStatusToPaymentResponse(tresorPayStatus);
            return ResponseEntity.ok(response);
        }
        
        // Pour les paiements en espèces, simuler une vérification
        PaymentResponse response = PaymentResponse.builder()
                .paymentId(paymentId)
                .status(PaymentResponse.PaymentStatus.PENDING)
                .build();
                
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test simple pour vérifier si le serveur répond
     */
    @GetMapping("/test")
    @Operation(summary = "Test endpoint")
    public ResponseEntity<String> testEndpoint() {
        return ResponseEntity.ok("Server is working!");
    }
    
    /**
     * Callback TresorPay pour les notifications de paiement
     */
    @GetMapping("/tresorpay/callback")
    @Operation(summary = "Callback TresorPay")
    public ResponseEntity<String> tresorPayCallback(@RequestParam String status,
                                                   @RequestParam String id,
                                                   @RequestParam String amount,
                                                   @RequestParam(required = false) String provider) {
        System.out.println("🔔 [TresorPay Callback] Notification reçue:");
        System.out.println("   📋 Référence: " + id);
        System.out.println("   📊 Statut: " + status);
        System.out.println("   💰 Montant: " + amount);
        System.out.println("   🏦 Provider: " + provider);
        
        try {
            // Chercher le paiement en base de données par référence TresorPay
            Payment payment = paymentRepository.findByTresorPayReference(id).orElse(null);
            
            if (payment != null) {
                String oldStatus = payment.getStatus();
                
                // Mettre à jour le statut selon la documentation TresorPay
                switch (status) {
                    case "PAID", "SUCCESS" -> {
                        payment.setStatus("PAID");
                        payment.setCompletedAt(LocalDateTime.now());
                        System.out.println("✅ [TresorPay Callback] Paiement marqué comme payé");
                    }
                    case "CANCELED", "CANCELLED" -> {
                        payment.setStatus("CANCELED");
                        System.out.println("❌ [TresorPay Callback] Paiement annulé");
                    }
                    default -> {
                        payment.setStatus(status);
                        System.out.println("⚠️ [TresorPay Callback] Statut mis à jour: " + status);
                    }
                }
                
                // Ajouter des métadonnées sur le provider
                if (provider != null) {
                    payment.setNotes("Payé via " + provider);
                }
                
                paymentRepository.save(payment);
                
                System.out.println("🔄 [TresorPay Callback] Statut mis à jour automatiquement: " + oldStatus + " -> " + payment.getStatus());
                System.out.println("💾 [TresorPay Callback] Paiement sauvegardé en base de données");
                
            } else {
                System.out.println("⚠️ [TresorPay Callback] Paiement non trouvé pour référence: " + id);
                System.out.println("🔍 [TresorPay Callback] Vérifiez que la référence existe en base");
            }
            
            // Retourner OK pour confirmer la réception à TresorPay
            return ResponseEntity.ok("OK");
            
        } catch (Exception e) {
            System.err.println("❌ [TresorPay Callback] Erreur lors du traitement: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("ERROR");
        }
    }
    
    /**
     * Endpoint pour synchroniser manuellement un paiement Stripe avec la base de données
     */
    @PostMapping("/stripe/{paymentId}/sync")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL')")
    @Operation(summary = "Synchronise un paiement Stripe avec la base de données")
    public ResponseEntity<PaymentResponse> syncStripePayment(@PathVariable String paymentId,
                                                           @RequestHeader(value = "X-Agent-Mode", required = false) String agentMode) {
        boolean isAgentMode = "true".equals(agentMode);
        String modeLabel = isAgentMode ? "(AGENT)" : "(USER)";
        
        System.out.println("🚨 [PaymentController] ENDPOINT APPELÉ " + modeLabel + " - Synchronisation du paiement: " + paymentId);
        System.out.println("🚨 [PaymentController] Thread: " + Thread.currentThread().getName());
        System.out.println("🚨 [PaymentController] Timestamp: " + java.time.LocalDateTime.now());
        System.out.println("🚨 [PaymentController] Mode Agent: " + isAgentMode);
        
        try {
            // Get payment status from TresorPay (Stripe replaced)
            TresorPayStatusResponse tresorPayStatus = tresorPayService.getNoticeStatus(paymentId);
            PaymentResponse response = convertTresorPayStatusToPaymentResponse(tresorPayStatus);
            
            // Ajouter une métadonnée pour indiquer que c'est traité par un agent
            if (isAgentMode) {
                response.getMetadata().put("processedByAgent", "true");
                response.getMetadata().put("agentProcessingTime", java.time.LocalDateTime.now().toString());
                System.out.println("👤 [PaymentController] Paiement marqué comme traité par agent");
            }
            
            System.out.println("✅ [PaymentController] Synchronisation terminée " + modeLabel + " pour: " + paymentId + " - Statut: " + response.getStatus());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ [PaymentController] Erreur synchronisation " + modeLabel + ": " + e.getMessage());
            throw e;
        }
    }
    
    /**
     * Récupère tous les paiements d'une entreprise
     */
    @GetMapping("/entreprise/{entrepriseId}")
    @PreAuthorize("hasAnyRole('USER', 'AGENT_ACCUEIL', 'AGENT_REVISION', 'AGENT_REGISSEUR')")
    @Operation(summary = "Récupère tous les paiements d'une entreprise")
    public ResponseEntity<List<Payment>> getPaymentsByEntreprise(@PathVariable String entrepriseId) {
        System.out.println("🔍 Récupération des paiements pour entreprise: " + entrepriseId);
        
        try {
            List<Payment> payments = paymentRepository.findByEntrepriseId(entrepriseId);
            System.out.println("✅ Trouvé " + payments.size() + " paiement(s) pour l'entreprise " + entrepriseId);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la récupération des paiements: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Calcule les frais de paiement
     */
    @GetMapping("/fees")
    @Operation(summary = "Calcule les frais de paiement")
    public ResponseEntity<Map<String, Object>> calculateFees(@RequestParam(defaultValue = "BUSINESS_CREATION") String requestType) {
        // Fixed fees for TresorPay (replace Stripe calculation)
        Long fees = 50000L; // 50,000 XOF for business creation
        
        Map<String, Object> response = new HashMap<>();
        response.put("requestType", requestType);
        response.put("amount", fees);
        response.put("currency", "xof");
        response.put("amountFormatted", String.format("%,d XOF", fees / 100));
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Gère les paiements TresorPay
     */
    private PaymentResponse handleTresorPayPayment(PaymentRequest request) {
        try {
            System.out.println("🔧 [TresorPay] Début handleTresorPayPayment");
            System.out.println("🔧 [TresorPay] Entreprise: " + request.getEntrepriseId());
            System.out.println("🔧 [TresorPay] Montant: " + request.getAmount());
            
            String customerFirstName = "";
            String customerLastName = "";
            String customerEmail = "";
            String customerPhone = "";
            String entrepriseName = "";
            String entrepriseReference = "";
            
            // Vérifier si c'est une demande d'investissement (préfixe INV-)
            if (request.getEntrepriseId().startsWith("INV-")) {
                System.out.println("🔧 [TresorPay] Traitement demande d'investissement: " + request.getEntrepriseId());
                
                // Récupérer les informations de la demande d'investissement
                String investmentId = request.getEntrepriseId().substring(4); // Enlever le préfixe INV-
                System.out.println("🔧 [TresorPay] Recherche investment agreement avec ID: " + investmentId);
                
                InvestmentAgreement agreement = investmentAgreementRepository.findById(investmentId)
                        .orElseThrow(() -> new RuntimeException("Demande d'investissement non trouvée"));
                
                System.out.println("🔧 [TresorPay] Agreement trouvé, userId stocké: " + agreement.getUserId());
                
                // Utiliser l'utilisateur actuellement connecté au lieu de celui stocké dans investment_agreements
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                String currentUserId = getCurrentUserId(authentication);
                System.out.println("🔧 [TresorPay] Utilisateur connecté: " + currentUserId);
                
                // Récupérer les informations de l'utilisateur connecté par email
                Utilisateurs user = utilisateursRepository.findByUtilisateur(currentUserId)
                        .orElseThrow(() -> new RuntimeException("Utilisateur connecté non trouvé avec email: " + currentUserId));
                
                // Récupérer les informations de la personne
                Persons personne = user.getPersonne();
                if (personne == null) {
                    throw new RuntimeException("Informations personnelles de l'utilisateur introuvables");
                }
                
                // Utiliser les vraies données de l'utilisateur
                customerFirstName = personne.getPrenom() != null ? personne.getPrenom() : "";
                customerLastName = personne.getNom() != null ? personne.getNom() : "";
                customerEmail = personne.getEmail() != null ? personne.getEmail() : "";
                customerPhone = personne.getTelephone1() != null ? personne.getTelephone1() : "";
                
                // Utiliser le nom du projet ou de l'entreprise de la demande
                if (agreement.getIdentification() != null && agreement.getIdentification().getNomRaisonSociale() != null) {
                    entrepriseName = agreement.getIdentification().getNomRaisonSociale();
                } else {
                    entrepriseName = "Demande d'agrément d'investissement";
                }
                entrepriseReference = request.getEntrepriseId();
                
                System.out.println("📋 [TresorPay] Demande d'investissement configurée avec utilisateur: " + customerFirstName + " " + customerLastName);
            } else {
                System.out.println("🔧 [TresorPay] Traitement entreprise normale: " + request.getEntrepriseId());
                
                // Récupérer les informations de l'entreprise et du gérant (logique existante)
                Entreprise entreprise = entrepriseRepository.findById(request.getEntrepriseId())
                        .orElseThrow(() -> new RuntimeException("Entreprise non trouvée"));
                
                // Récupérer le gérant (fondateur) de l'entreprise avec chargement EAGER de la personne
                List<EntrepriseMembre> membres = entrepriseMembreRepository.findByEntreprise_Id(request.getEntrepriseId());
                
                if (membres.isEmpty()) {
                    throw new RuntimeException("Aucun membre trouvé pour l'entreprise");
                }
                
                EntrepriseMembre gerant = membres.stream()
                        .filter(m -> "FONDATEUR".equals(m.getRole()) || "GERANT".equals(m.getRole()))
                        .findFirst()
                        .orElse(membres.get(0));
                
                // Forcer le chargement de la personne avant la fermeture de la session
                Persons personne = gerant.getPersonne();
                if (personne == null) {
                    throw new RuntimeException("Informations du gérant introuvables");
                }
                
                // Accéder aux propriétés pour forcer le chargement
                customerFirstName = personne.getPrenom() != null ? personne.getPrenom() : "";
                customerLastName = personne.getNom() != null ? personne.getNom() : "";
                customerEmail = personne.getEmail() != null ? personne.getEmail() : "";
                customerPhone = personne.getTelephone1() != null ? personne.getTelephone1() : "";
                entrepriseName = entreprise.getNom();
                entrepriseReference = entreprise.getReference();
            }
            
            System.out.println("📋 [TresorPay] Gérant: " + customerFirstName + " " + customerLastName);
            System.out.println("📋 [TresorPay] Entreprise: " + entrepriseName + " (Ref: " + entrepriseReference + ")");
            
            // Créer et sauvegarder le paiement en base de données AVANT l'appel TresorPay
            Payment payment = new Payment();
            payment.setTresorPayReference("TEMP-" + System.currentTimeMillis()); // Référence temporaire
            payment.setPaymentMethod("TRESORPAY");
            payment.setAmount(new BigDecimal(request.getAmount()));
            payment.setCurrency("XOF");
            payment.setStatus("PENDING");
            payment.setEntrepriseId(request.getEntrepriseId());
            // payment.setEntrepriseNom(entrepriseName); // Temporairement commenté - colonne pas encore créée
            payment.setCustomerName(customerFirstName + " " + customerLastName);
            payment.setCustomerPhone(customerPhone);
            payment.setCustomerEmail(customerEmail);
            payment.setDescription(request.getDescription());
            
            // Sauvegarder le paiement
            Payment savedPayment = paymentRepository.save(payment);
            System.out.println("✅ [TresorPay] Paiement sauvegardé avec ID: " + savedPayment.getId());
            
            // Récupérer le numéro de téléphone et le provider depuis methodData si fournis
            String userPhoneNumber = null;
            String paymentProvider = null;
            
            if (request.getMethodData() != null) {
                userPhoneNumber = request.getMethodData().getPhoneNumber();
                paymentProvider = request.getMethodData().getPaymentProvider();
                System.out.println("📱 [TresorPay] Numéro utilisateur fourni: " + userPhoneNumber);
                System.out.println("🏦 [TresorPay] Provider choisi: " + paymentProvider);
            }
            
            // Utiliser le numéro fourni par l'utilisateur en priorité, sinon celui du profil
            String phoneToUse = (userPhoneNumber != null && !userPhoneNumber.trim().isEmpty()) ? userPhoneNumber : customerPhone;
            
            // Construire la requête TresorPay avec les vraies informations
            TresorPayNoticeRequest tresorPayRequest = tresorPayService.buildNoticeRequest(
                request.getEntrepriseId(),
                entrepriseReference,
                entrepriseName,
                request.getAmount(),
                request.getDescription(),
                customerFirstName,
                customerLastName,
                customerEmail,
                phoneToUse
            );
            
            // Créer l'avis de recette
            TresorPayNoticeResponse tresorPayResponse = tresorPayService.createNotice(tresorPayRequest);
            System.out.println("✅ [TresorPay] Avis créé avec référence: " + tresorPayResponse.getReference());
            
            // Mettre à jour avec la vraie référence TresorPay
            savedPayment.setTresorPayReference(tresorPayResponse.getReference());
            savedPayment.setStatus("EMITTED");
            
            // Générer l'URL de paiement
            String paymentUrl = tresorPayService.generatePaymentUrl(tresorPayResponse.getReference());
            savedPayment.setPaymentUrl(paymentUrl);
            
            // Sauvegarder les mises à jour
            paymentRepository.save(savedPayment);
            System.out.println("✅ [TresorPay] Paiement mis à jour avec référence TresorPay: " + tresorPayResponse.getReference());
            
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("tresorPayReference", tresorPayResponse.getReference());
            metadata.put("paymentUrl", paymentUrl);
            metadata.put("provider", "TresorPay");
            
            String instructions = String.format(
                "Votre avis de recette TresorPay a été créé avec succès.\n" +
                "Référence: %s\n\n" +
                "Pour effectuer le paiement, cliquez sur le lien suivant:\n%s\n\n" +
                "Vous pourrez payer avec:\n" +
                "- Orange Money\n" +
                "- Moov Money\n" +
                "- Sama Money\n" +
                "- Wave\n" +
                "- Carte bancaire",
                tresorPayResponse.getReference(),
                paymentUrl
            );
            
            return PaymentResponse.builder()
                    .paymentId(tresorPayResponse.getReference())
                    .entrepriseId(request.getEntrepriseId())
                    .status(PaymentResponse.PaymentStatus.PENDING)
                    .paymentMethod(request.getPaymentMethod())
                    .amount(request.getAmount())
                    .currency(request.getCurrency())
                    .transactionReference(tresorPayResponse.getReference())
                    .redirectUrl(paymentUrl)
                    .paymentInstructions(instructions)
                    .metadata(metadata)
                    .createdAt(LocalDateTime.now())
                    .build();
                    
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la création du paiement TresorPay: " + e.getMessage());
            e.printStackTrace(); // Afficher la stack trace complète
            System.err.println("❌ Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "Aucune cause"));
            return PaymentResponse.error(
                request.getEntrepriseId(),
                request.getPaymentMethod(),
                "Erreur lors de la création du paiement TresorPay: " + e.getMessage()
            );
        }
    }
    
    /**
     * Gère les paiements en espèces
     */
    private PaymentResponse handleCashPayment(PaymentRequest request) {
        String transactionRef = "CASH_" + System.currentTimeMillis();
        
        String instructions = String.format(
            "Rendez-vous dans l'une de nos agences avec:\n" +
            "- Référence: %s\n" +
            "- Montant: %,d XOF\n" +
            "- Pièce d'identité\n\n" +
            "Agences disponibles:\n" +
            "- Bamako Centre: ACI 2000, près de la BCEAO\n" +
            "- Bamako Hippodrome: Avenue Cheick Zayed\n" +
            "Horaires: Lun-Ven 8h-17h, Sam 8h-12h",
            transactionRef,
            request.getAmount() / 100
        );
        
        return PaymentResponse.builder()
                .paymentId(transactionRef)
                .entrepriseId(request.getEntrepriseId())
                .status(PaymentResponse.PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .transactionReference(transactionRef)
                .paymentInstructions(instructions)
                .createdAt(LocalDateTime.now())
                .build();
    }
    
    /**
     * Convertit une réponse de statut TresorPay en PaymentResponse
     */
    private PaymentResponse convertTresorPayStatusToPaymentResponse(TresorPayStatusResponse tresorPayStatus) {
        PaymentResponse.PaymentStatus status;
        
        // Mapper les statuts TresorPay vers les statuts PaymentResponse
        switch (tresorPayStatus.getStatus()) {
            case "EMITTED" -> status = PaymentResponse.PaymentStatus.PENDING;
            case "PAID" -> status = PaymentResponse.PaymentStatus.SUCCEEDED;
            case "CANCELED" -> status = PaymentResponse.PaymentStatus.CANCELLED;
            default -> status = PaymentResponse.PaymentStatus.PENDING;
        }
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("provider", tresorPayStatus.getProvider());
        metadata.put("tresorPayStatus", tresorPayStatus.getStatus());
        if (tresorPayStatus.getPayDate() != null) {
            metadata.put("payDate", tresorPayStatus.getPayDate().toString());
        }
        
        return PaymentResponse.builder()
                .paymentId(tresorPayStatus.getReference())
                .status(status)
                .paymentMethod("TRESORPAY")
                .transactionReference(tresorPayStatus.getReference())
                .metadata(metadata)
                .updatedAt(LocalDateTime.now())
                .build();
    }
    
    /**
     * Récupère l'ID de l'utilisateur connecté depuis l'authentification.
     */
    private String getCurrentUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            System.out.println("⚠️ [WARNING] Utilisateur non authentifié, utilisation de 'anonymous' pour les tests");
            return "anonymous";
        }
        
        String userId = authentication.getName();
        System.out.println("🔍 [AUTH] UserId extrait de l'authentification: " + userId);
        return userId;
    }
}
=======
package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.dto.PaymentRequest;
import abdaty_technologie.API_Invest.dto.PaymentResponse;
import abdaty_technologie.API_Invest.service.StripeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Contrôleur pour la gestion des paiements multi-méthodes
 */
@RestController
@RequestMapping("/payments")
@Tag(name = "Payments", description = "API de gestion des paiements")
public class PaymentController {
    
    @Autowired
    private StripeService stripeService;
    
    @Value("${stripe.public-key}")
    private String stripePublicKey;
    
    /**
     * Récupère la clé publique Stripe pour le frontend
     */
    @GetMapping("/stripe/public-key")
    @Operation(summary = "Récupère la clé publique Stripe")
    public ResponseEntity<Map<String, String>> getStripePublicKey() {
        Map<String, String> response = new HashMap<>();
        response.put("publicKey", stripePublicKey);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Initie un paiement selon la méthode choisie
     */
    @PostMapping("/initiate")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Initie un paiement", description = "Crée une session de paiement selon la méthode choisie")
    public ResponseEntity<PaymentResponse> initiatePayment(@Valid @RequestBody PaymentRequest request) {
        System.out.println("💳 Initiation paiement: " + request.getPaymentMethod() + " pour entreprise: " + request.getEntrepriseId());
        
        PaymentResponse response;
        
        switch (request.getPaymentMethod()) {
            case "STRIPE" -> {
                // Paiement par carte via Stripe Elements (PaymentIntent)
                response = stripeService.createPaymentIntent(request);
            }
            case "ORANGE_MONEY" -> {
                // Paiement Orange Money (simulation)
                response = handleOrangeMoneyPayment(request);
            }
            case "MOOV_MONEY" -> {
                // Paiement Moov Money (simulation)
                response = handleMoovMoneyPayment(request);
            }
            case "BANK_TRANSFER" -> {
                // Virement bancaire (instructions)
                response = handleBankTransferPayment(request);
            }
            case "CASH" -> {
                // Paiement en espèces (instructions)
                response = handleCashPayment(request);
            }
            default -> {
                response = PaymentResponse.error(
                    request.getEntrepriseId(),
                    request.getPaymentMethod(),
                    "Méthode de paiement non supportée: " + request.getPaymentMethod()
                );
            }
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Vérifie le statut d'un paiement
     */
    @GetMapping("/{paymentId}/status")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Vérifie le statut d'un paiement")
    public ResponseEntity<PaymentResponse> getPaymentStatus(@PathVariable String paymentId) {
        System.out.println("🔍 Vérification statut paiement: " + paymentId);
        
        // Pour Stripe, utiliser le service Stripe
        if (paymentId.startsWith("pi_") || paymentId.startsWith("cs_")) {
            PaymentResponse response = stripeService.getPaymentStatus(paymentId);
            return ResponseEntity.ok(response);
        }
        
        // Pour les autres méthodes, simuler une vérification
        PaymentResponse response = PaymentResponse.builder()
                .paymentId(paymentId)
                .status(PaymentResponse.PaymentStatus.PENDING)
                .build();
                
        return ResponseEntity.ok(response);
    }
    
    /**
     * Webhook Stripe pour les notifications de paiement
     */
    @PostMapping("/stripe/webhook")
    @Operation(summary = "Webhook Stripe")
    public ResponseEntity<String> stripeWebhook(@RequestBody String payload, 
                                              @RequestHeader("Stripe-Signature") String sigHeader) {
        System.out.println("🔔 Webhook Stripe reçu");
        // TODO: Implémenter la vérification de signature et le traitement des événements
        return ResponseEntity.ok("OK");
    }
    
    /**
     * Endpoint pour synchroniser manuellement un paiement Stripe avec la base de données
     */
    @PostMapping("/stripe/{paymentId}/sync")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Synchronise un paiement Stripe avec la base de données")
    public ResponseEntity<PaymentResponse> syncStripePayment(@PathVariable String paymentId) {
        System.out.println("🔄 Synchronisation manuelle du paiement Stripe: " + paymentId);
        
        PaymentResponse response = stripeService.getPaymentStatus(paymentId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Calcule les frais de paiement
     */
    @GetMapping("/fees")
    @Operation(summary = "Calcule les frais de paiement")
    public ResponseEntity<Map<String, Object>> calculateFees(@RequestParam(defaultValue = "BUSINESS_CREATION") String requestType) {
        Long fees = stripeService.calculateFees(requestType);
        
        Map<String, Object> response = new HashMap<>();
        response.put("requestType", requestType);
        response.put("amount", fees);
        response.put("currency", "xof");
        response.put("amountFormatted", String.format("%,d XOF", fees / 100));
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Gère les paiements Orange Money (simulation)
     */
    private PaymentResponse handleOrangeMoneyPayment(PaymentRequest request) {
        // Simulation d'intégration Orange Money
        String transactionRef = "OM_" + System.currentTimeMillis();
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("phoneNumber", request.getMethodData().getPhoneNumber());
        metadata.put("provider", "Orange Money");
        
        return PaymentResponse.builder()
                .paymentId(transactionRef)
                .entrepriseId(request.getEntrepriseId())
                .status(PaymentResponse.PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .transactionReference(transactionRef)
                .paymentInstructions("Composez *144*4*4# et suivez les instructions pour valider le paiement")
                .metadata(metadata)
                .createdAt(LocalDateTime.now())
                .build();
    }
    
    /**
     * Gère les paiements Moov Money (simulation)
     */
    private PaymentResponse handleMoovMoneyPayment(PaymentRequest request) {
        // Simulation d'intégration Moov Money
        String transactionRef = "MM_" + System.currentTimeMillis();
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("phoneNumber", request.getMethodData().getPhoneNumber());
        metadata.put("provider", "Moov Money");
        
        return PaymentResponse.builder()
                .paymentId(transactionRef)
                .entrepriseId(request.getEntrepriseId())
                .status(PaymentResponse.PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .transactionReference(transactionRef)
                .paymentInstructions("Composez *555# et suivez les instructions pour valider le paiement")
                .metadata(metadata)
                .createdAt(LocalDateTime.now())
                .build();
    }
    
    /**
     * Gère les virements bancaires
     */
    private PaymentResponse handleBankTransferPayment(PaymentRequest request) {
        String transactionRef = "BT_" + System.currentTimeMillis();
        
        String instructions = String.format(
            "Effectuez un virement bancaire vers:\n" +
            "Bénéficiaire: API-INVEST MALI\n" +
            "IBAN: ML13 BMLI 0001 0000 0000 0000 1234\n" +
            "BIC: BMLIMALI\n" +
            "Montant: %,d XOF\n" +
            "Référence: %s",
            request.getAmount() / 100,
            transactionRef
        );
        
        return PaymentResponse.builder()
                .paymentId(transactionRef)
                .entrepriseId(request.getEntrepriseId())
                .status(PaymentResponse.PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .transactionReference(transactionRef)
                .paymentInstructions(instructions)
                .createdAt(LocalDateTime.now())
                .build();
    }
    
    /**
     * Gère les paiements en espèces
     */
    private PaymentResponse handleCashPayment(PaymentRequest request) {
        String transactionRef = "CASH_" + System.currentTimeMillis();
        
        String instructions = String.format(
            "Rendez-vous dans l'une de nos agences avec:\n" +
            "- Référence: %s\n" +
            "- Montant: %,d XOF\n" +
            "- Pièce d'identité\n\n" +
            "Agences disponibles:\n" +
            "- Bamako Centre: ACI 2000, près de la BCEAO\n" +
            "- Bamako Hippodrome: Avenue Cheick Zayed\n" +
            "Horaires: Lun-Ven 8h-17h, Sam 8h-12h",
            transactionRef,
            request.getAmount() / 100
        );
        
        return PaymentResponse.builder()
                .paymentId(transactionRef)
                .entrepriseId(request.getEntrepriseId())
                .status(PaymentResponse.PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .transactionReference(transactionRef)
                .paymentInstructions(instructions)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
>>>>>>> 7674fb3a5 (16e commit - Mise à jour après la réunion du 30/10/2025)
