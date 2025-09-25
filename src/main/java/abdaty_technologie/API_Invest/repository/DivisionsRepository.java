package abdaty_technologie.API_Invest.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import abdaty_technologie.API_Invest.Entity.Divisions;
import abdaty_technologie.API_Invest.Entity.Enum.DivisionType;

@Repository
public interface DivisionsRepository extends JpaRepository<Divisions, String> {
    
    // Recherche par code
    Optional<Divisions> findByCode(String code);
    
    // Recherche par nom
    List<Divisions> findByNomContainingIgnoreCase(String nom);
    
    // Recherche par type de division
    List<Divisions> findByDivisionType(DivisionType divisionType);
    
    // Recherche des régions (divisions sans parent)
    List<Divisions> findByParentIsNullAndDivisionType(DivisionType divisionType);
    
    // Recherche des enfants d'une division (ex: cercles d'une région)
    @Query("SELECT d FROM Divisions d WHERE d.parent.id = :parentId")
    List<Divisions> findByParentId(@Param("parentId") String parentId);
    
    // Recherche des cercles d'une région
    @Query("SELECT d FROM Divisions d WHERE d.parent.id = :regionId AND d.divisionType = 'CERCLE'")
    List<Divisions> findCerclesByRegionId(@Param("regionId") String regionId);
    
    // Recherche des arrondissements d'un cercle
    @Query("SELECT d FROM Divisions d WHERE d.parent.id = :cercleId AND d.divisionType = 'ARRONDISSEMENT'")
    List<Divisions> findArrondissementsByCercleId(@Param("cercleId") String cercleId);
    
    // Recherche des communes d'un arrondissement
    @Query("SELECT d FROM Divisions d WHERE d.parent.id = :arrondissementId AND d.divisionType = 'COMMUNE'")
    List<Divisions> findCommunesByArrondissementId(@Param("arrondissementId") String arrondissementId);
    
    // Recherche des quartiers d'une commune
    @Query("SELECT d FROM Divisions d WHERE d.parent.id = :communeId AND d.divisionType = 'QUARTIER'")
    List<Divisions> findQuartiersByCommuneId(@Param("communeId") String communeId);
    
    // Méthodes spécifiques pour Bamako District (structure différente)
    // Recherche des arrondissements directement depuis une région (pour Bamako District)
    @Query("SELECT d FROM Divisions d WHERE d.parent.id = :regionId AND d.divisionType = 'ARRONDISSEMENT'")
    List<Divisions> findArrondissementsByRegionId(@Param("regionId") String regionId);
    
    // Recherche des quartiers directement depuis un arrondissement (pour Bamako District)
    @Query("SELECT d FROM Divisions d WHERE d.parent.id = :arrondissementId AND d.divisionType = 'QUARTIER'")
    List<Divisions> findQuartiersByArrondissementId(@Param("arrondissementId") String arrondissementId);
    
    // Vérifier l'existence par code
    boolean existsByCode(String code);
}
