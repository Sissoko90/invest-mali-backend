package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Payment;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.PaymentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service pour synchroniser automatiquement les statuts des paiements TresorPay
 */
@Service
public class TresorPaySyncService {
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private EntrepriseRepository entrepriseRepository;
    
    @Autowired
    private TresorPayService tresorPayService;
    
    @Value("${tresorpay.base-url}")
    private String baseUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Synchronise automatiquement les paiements en attente toutes les 2 minutes
     */
    @Scheduled(fixedRate = 120000) // 2 minutes
    public void syncPendingPayments() {
        System.out.println("🔄 [TresorPay Sync] Début de la synchronisation automatique");
        
        try {
            // Récupérer tous les paiements TresorPay en attente (EMITTED ou PENDING)
            List<Payment> pendingPayments = paymentRepository.findByStatusOrderByCreatedAtDesc("EMITTED");
            pendingPayments.addAll(paymentRepository.findByStatusOrderByCreatedAtDesc("PENDING"));
            
            System.out.println("📊 [TresorPay Sync] " + pendingPayments.size() + " paiements à vérifier");
            
            for (Payment payment : pendingPayments) {
                if (payment.getTresorPayReference() != null && 
                    !payment.getTresorPayReference().startsWith("TEMP-")) {
                    
                    syncPaymentStatus(payment);
                    
                    // Pause entre les appels pour éviter de surcharger l'API
                    Thread.sleep(1000);
                }
            }
            
            System.out.println("✅ [TresorPay Sync] Synchronisation terminée");
            
        } catch (Exception e) {
            System.err.println("❌ [TresorPay Sync] Erreur lors de la synchronisation: " + e.getMessage());
        }
    }
    
    /**
     * Synchronise le statut d'un paiement spécifique
     */
    public void syncPaymentStatus(Payment payment) {
        try {
            System.out.println("🔍 [TresorPay Sync] Vérification du paiement: " + payment.getTresorPayReference());
            
            // Obtenir le token d'accès
            String accessToken = tresorPayService.getAccessToken();
            
            // Construire l'URL de l'API de statut
            String statusUrl = baseUrl + "/notice-recette/status/" + payment.getTresorPayReference();
            
            // Préparer les headers
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            // Appeler l'API TresorPay
            ResponseEntity<String> response = restTemplate.exchange(
                statusUrl, 
                HttpMethod.GET, 
                entity, 
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                
                String tresorPayStatus = responseJson.get("status").asText();
                String provider = responseJson.has("provider") ? responseJson.get("provider").asText() : null;
                
                System.out.println("📋 [TresorPay Sync] Statut TresorPay: " + tresorPayStatus + " pour: " + payment.getTresorPayReference());
                
                // Mettre à jour le statut si nécessaire
                boolean updated = false;
                String oldStatus = payment.getStatus();
                
                switch (tresorPayStatus.toUpperCase()) {
                    case "PAID", "SUCCESS" -> {
                        if (!"PAID".equals(payment.getStatus())) {
                            payment.setStatus("PAID");
                            payment.setCompletedAt(LocalDateTime.now());
                            if (provider != null) {
                                payment.setNotes("Payé via " + provider + " (sync auto)");
                            }
                            updated = true;
                            System.out.println("✅ [TresorPay Sync] Paiement marqué comme payé");
                            
                            // Faire passer l'entreprise de REGISSEUR à REVISION
                            updateEntrepriseStatus(payment);
                        }
                    }
                    case "CANCELED", "CANCELLED" -> {
                        if (!"CANCELED".equals(payment.getStatus())) {
                            payment.setStatus("CANCELED");
                            updated = true;
                            System.out.println("❌ [TresorPay Sync] Paiement marqué comme annulé");
                        }
                    }
                    case "PENDING", "EMITTED" -> {
                        // Pas de changement nécessaire
                        System.out.println("⏳ [TresorPay Sync] Paiement toujours en attente");
                    }
                    default -> {
                        System.out.println("⚠️ [TresorPay Sync] Statut inconnu: " + tresorPayStatus);
                    }
                }
                
                if (updated) {
                    paymentRepository.save(payment);
                    System.out.println("💾 [TresorPay Sync] Statut mis à jour: " + oldStatus + " -> " + payment.getStatus());
                }
                
            } else {
                System.out.println("⚠️ [TresorPay Sync] Erreur API: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            System.err.println("❌ [TresorPay Sync] Erreur lors de la vérification de " + payment.getTresorPayReference() + ": " + e.getMessage());
        }
    }
    
    /**
     * Synchronise manuellement un paiement spécifique par référence
     */
    public boolean syncPaymentByReference(String tresorPayReference) {
        try {
            Payment payment = paymentRepository.findByTresorPayReference(tresorPayReference).orElse(null);
            
            if (payment != null) {
                syncPaymentStatus(payment);
                return true;
            } else {
                System.out.println("⚠️ [TresorPay Sync] Paiement non trouvé: " + tresorPayReference);
                return false;
            }
            
        } catch (Exception e) {
            System.err.println("❌ [TresorPay Sync] Erreur lors de la synchronisation manuelle: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Met à jour le statut de l'entreprise après un paiement réussi
     * Fait passer l'entreprise de REGISSEUR à REVISION
     */
    private void updateEntrepriseStatus(Payment payment) {
        try {
            if (payment.getEntrepriseId() == null) {
                System.out.println("⚠️ [TresorPay Sync] Pas d'entreprise associée au paiement");
                return;
            }
            
            Optional<Entreprise> entrepriseOpt = entrepriseRepository.findById(payment.getEntrepriseId());
            
            if (entrepriseOpt.isPresent()) {
                Entreprise entreprise = entrepriseOpt.get();
                
                System.out.println("🔍 [TresorPay Sync] Entreprise trouvée: " + entreprise.getNom() + 
                                 ", Étape actuelle: " + entreprise.getEtapeValidation());
                
                // Si l'entreprise est à l'étape REGISSEUR, la faire passer à REVISION
                if (entreprise.getEtapeValidation() == EtapeValidation.REGISSEUR) {
                    entreprise.setEtapeValidation(EtapeValidation.REVISION);
                    entreprise.setModification(java.time.Instant.now());
                    entrepriseRepository.save(entreprise);
                    
                    System.out.println("✅ [TresorPay Sync] Entreprise transférée à l'étape REVISION: " + 
                                     entreprise.getNom() + " (ID: " + entreprise.getId() + ")");
                } else {
                    System.out.println("ℹ️ [TresorPay Sync] Entreprise déjà à l'étape: " + 
                                     entreprise.getEtapeValidation());
                }
            } else {
                System.out.println("⚠️ [TresorPay Sync] Entreprise non trouvée avec ID: " + payment.getEntrepriseId());
            }
            
        } catch (Exception e) {
            System.err.println("❌ [TresorPay Sync] Erreur lors de la mise à jour de l'entreprise: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
