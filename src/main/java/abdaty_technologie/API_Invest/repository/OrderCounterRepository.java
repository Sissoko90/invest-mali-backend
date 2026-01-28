package abdaty_technologie.API_Invest.repository;

import abdaty_technologie.API_Invest.Entity.OrderCounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository pour gérer les compteurs d'order_id
 */
@Repository
public interface OrderCounterRepository extends JpaRepository<OrderCounter, Long> {
    
    /**
     * Trouve un compteur par son nom
     */
    Optional<OrderCounter> findByCounterName(String counterName);
    
    /**
     * Incrémente atomiquement un compteur et retourne la nouvelle valeur
     */
    @Modifying
    @Query("UPDATE OrderCounter oc SET oc.currentValue = oc.currentValue + 1 WHERE oc.counterName = :counterName")
    int incrementCounter(@Param("counterName") String counterName);
    
    /**
     * Obtient la valeur actuelle d'un compteur
     */
    @Query("SELECT oc.currentValue FROM OrderCounter oc WHERE oc.counterName = :counterName")
    Optional<Long> getCurrentValue(@Param("counterName") String counterName);
}
