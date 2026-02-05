package abdaty_technologie.API_Invest.Entity;

import jakarta.persistence.*;

/**
 * Entité pour gérer les compteurs d'order_id
 */
@Entity
@Table(name = "order_counters")
public class OrderCounter {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "counter_name", unique = true, nullable = false)
    private String counterName;
    
    @Column(name = "current_value", nullable = false)
    private Long currentValue;
    
    @Column(name = "prefix")
    private String prefix;
    
    // Constructeurs
    public OrderCounter() {}
    
    public OrderCounter(String counterName, Long currentValue, String prefix) {
        this.counterName = counterName;
        this.currentValue = currentValue;
        this.prefix = prefix;
    }
    
    // Getters et Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getCounterName() {
        return counterName;
    }
    
    public void setCounterName(String counterName) {
        this.counterName = counterName;
    }
    
    public Long getCurrentValue() {
        return currentValue;
    }
    
    public void setCurrentValue(Long currentValue) {
        this.currentValue = currentValue;
    }
    
    public String getPrefix() {
        return prefix;
    }
    
    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }
    
    /**
     * Incrémente et retourne la nouvelle valeur
     */
    public Long incrementAndGet() {
        this.currentValue++;
        return this.currentValue;
    }
    
    /**
     * Génère l'order_id complet avec préfixe
     */
    public String generateOrderId() {
        return (prefix != null ? prefix : "ORDER") + "_" + currentValue;
    }
}
