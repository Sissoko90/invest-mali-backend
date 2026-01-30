<<<<<<< HEAD
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.OrderCounter;
import abdaty_technologie.API_Invest.repository.OrderCounterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service pour gérer les compteurs d'order_id
 */
@Service
public class OrderCounterService {
    
    private static final Logger logger = LoggerFactory.getLogger(OrderCounterService.class);
    
    @Autowired
    private OrderCounterRepository orderCounterRepository;
    
    /**
     * Génère le prochain order_id pour Orange Money
     */
    @Transactional
    public String generateNextOrderId() {
        return generateNextOrderId("ORANGE_MONEY_V2", "merchant_order");
    }
    
    /**
     * Génère le prochain order_id pour un compteur donné
     */
    @Transactional
    public String generateNextOrderId(String counterName, String prefix) {
        logger.debug("🔢 [OrderCounter] Génération order_id pour: {}", counterName);
        
        try {
            // Chercher le compteur existant
            OrderCounter counter = orderCounterRepository.findByCounterName(counterName)
                .orElseGet(() -> {
                    // Créer un nouveau compteur s'il n'existe pas
                    logger.info("🆕 [OrderCounter] Création nouveau compteur: {}", counterName);
                    OrderCounter newCounter = new OrderCounter(counterName, 124L, prefix); // Commencer à 124 comme dans votre exemple
                    return orderCounterRepository.save(newCounter);
                });
            
            // Incrémenter le compteur
            Long nextValue = counter.incrementAndGet();
            orderCounterRepository.save(counter);
            
            // Générer l'order_id
            String orderId = prefix + "_" + nextValue;
            
            logger.info("✅ [OrderCounter] Order ID généré: {} (compteur: {})", orderId, nextValue);
            return orderId;
            
        } catch (Exception e) {
            logger.error("❌ [OrderCounter] Erreur génération order_id: {}", e.getMessage(), e);
            
            // Fallback : utiliser timestamp + random
            long timestamp = System.currentTimeMillis();
            int random = (int) (Math.random() * 1000);
            String fallbackOrderId = prefix + "_" + timestamp + "_" + random;
            
            logger.warn("⚠️ [OrderCounter] Utilisation fallback order_id: {}", fallbackOrderId);
            return fallbackOrderId;
        }
    }
    
    /**
     * Réinitialise un compteur à une valeur donnée
     */
    @Transactional
    public void resetCounter(String counterName, Long value) {
        logger.info("🔄 [OrderCounter] Réinitialisation compteur {} à {}", counterName, value);
        
        OrderCounter counter = orderCounterRepository.findByCounterName(counterName)
            .orElse(new OrderCounter(counterName, value, "merchant_order"));
        
        counter.setCurrentValue(value);
        orderCounterRepository.save(counter);
    }
    
    /**
     * Obtient la valeur actuelle d'un compteur
     */
    public Long getCurrentCounterValue(String counterName) {
        return orderCounterRepository.getCurrentValue(counterName).orElse(0L);
    }
}
=======
package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.Entity.OrderCounter;
import abdaty_technologie.API_Invest.repository.OrderCounterRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service pour gérer les compteurs d'order_id
 */
@Service
public class OrderCounterService {
    
    private static final Logger logger = LoggerFactory.getLogger(OrderCounterService.class);
    
    @Autowired
    private OrderCounterRepository orderCounterRepository;
    
    /**
     * Génère le prochain order_id pour Orange Money
     */
    @Transactional
    public String generateNextOrderId() {
        return generateNextOrderId("ORANGE_MONEY_V2", "merchant_order");
    }
    
    /**
     * Génère le prochain order_id pour un compteur donné
     */
    @Transactional
    public String generateNextOrderId(String counterName, String prefix) {
        logger.debug("🔢 [OrderCounter] Génération order_id pour: {}", counterName);
        
        try {
            // Chercher le compteur existant
            OrderCounter counter = orderCounterRepository.findByCounterName(counterName)
                .orElseGet(() -> {
                    // Créer un nouveau compteur s'il n'existe pas
                    logger.info("🆕 [OrderCounter] Création nouveau compteur: {}", counterName);
                    OrderCounter newCounter = new OrderCounter(counterName, 124L, prefix); // Commencer à 124 comme dans votre exemple
                    return orderCounterRepository.save(newCounter);
                });
            
            // Incrémenter le compteur
            Long nextValue = counter.incrementAndGet();
            orderCounterRepository.save(counter);
            
            // Générer l'order_id
            String orderId = prefix + "_" + nextValue;
            
            logger.info("✅ [OrderCounter] Order ID généré: {} (compteur: {})", orderId, nextValue);
            return orderId;
            
        } catch (Exception e) {
            logger.error("❌ [OrderCounter] Erreur génération order_id: {}", e.getMessage(), e);
            
            // Fallback : utiliser timestamp + random
            long timestamp = System.currentTimeMillis();
            int random = (int) (Math.random() * 1000);
            String fallbackOrderId = prefix + "_" + timestamp + "_" + random;
            
            logger.warn("⚠️ [OrderCounter] Utilisation fallback order_id: {}", fallbackOrderId);
            return fallbackOrderId;
        }
    }
    
    /**
     * Réinitialise un compteur à une valeur donnée
     */
    @Transactional
    public void resetCounter(String counterName, Long value) {
        logger.info("🔄 [OrderCounter] Réinitialisation compteur {} à {}", counterName, value);
        
        OrderCounter counter = orderCounterRepository.findByCounterName(counterName)
            .orElse(new OrderCounter(counterName, value, "merchant_order"));
        
        counter.setCurrentValue(value);
        orderCounterRepository.save(counter);
    }
    
    /**
     * Obtient la valeur actuelle d'un compteur
     */
    public Long getCurrentCounterValue(String counterName) {
        return orderCounterRepository.getCurrentValue(counterName).orElse(0L);
    }
}
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
