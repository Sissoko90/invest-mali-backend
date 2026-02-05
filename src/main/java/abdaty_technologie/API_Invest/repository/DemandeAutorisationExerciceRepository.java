package abdaty_technologie.API_Invest.repository;

import abdaty_technologie.API_Invest.Entity.DemandeAutorisationExercice;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDemandeAgrement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DemandeAutorisationExerciceRepository extends JpaRepository<DemandeAutorisationExercice, Long> {

    // Recherche par numéro de demande
    Optional<DemandeAutorisationExercice> findByNumeroDemande(String numeroDemande);

    // Recherche par type de demande
    List<DemandeAutorisationExercice> findByTypeDemande(TypeDemandeAgrement typeDemande);

    // Recherche par statut
    List<DemandeAutorisationExercice> findByStatut(String statut);

    // Recherche par étape actuelle
    List<DemandeAutorisationExercice> findByEtapeActuelle(EtapeValidation etapeActuelle);

    // Recherche par agent assigné
    List<DemandeAutorisationExercice> findByAgentAssigneId(String agentAssigneId);

    // Recherche par antenne de traitement
    List<DemandeAutorisationExercice> findByAntenneTraitement(String antenneTraitement);

    // Recherche par demandeur
    List<DemandeAutorisationExercice> findByEmailDemandeur(String emailDemandeur);

    // Recherche par nom d'entreprise
    List<DemandeAutorisationExercice> findByNomEntrepriseContainingIgnoreCase(String nomEntreprise);

    // Demandes en cours par type
    @Query("SELECT d FROM DemandeAutorisationExercice d WHERE d.typeDemande = :typeDemande AND d.statut = 'EN_COURS'")
    List<DemandeAutorisationExercice> findDemandesEnCoursByType(@Param("typeDemande") TypeDemandeAgrement typeDemande);

    // Demandes non assignées
    @Query("SELECT d FROM DemandeAutorisationExercice d WHERE d.agentAssigneId IS NULL AND d.statut = 'EN_COURS'")
    List<DemandeAutorisationExercice> findDemandesNonAssignees();

    // Demandes par étape et antenne
    @Query("SELECT d FROM DemandeAutorisationExercice d WHERE d.etapeActuelle = :etape AND d.antenneTraitement = :antenne")
    List<DemandeAutorisationExercice> findByEtapeAndAntenne(@Param("etape") EtapeValidation etape, @Param("antenne") String antenne);

    // Demandes en attente de paiement
    @Query("SELECT d FROM DemandeAutorisationExercice d WHERE d.typeDemande = 'AGREMENT' AND (d.paiementEffectue IS NULL OR d.paiementEffectue = false)")
    List<DemandeAutorisationExercice> findDemandesEnAttentePaiement();

    // Demandes créées dans une période
    @Query("SELECT d FROM DemandeAutorisationExercice d WHERE d.dateCreation BETWEEN :dateDebut AND :dateFin")
    List<DemandeAutorisationExercice> findDemandesCreatedBetween(@Param("dateDebut") LocalDateTime dateDebut, @Param("dateFin") LocalDateTime dateFin);

    // Statistiques par type de demande
    @Query("SELECT d.typeDemande, COUNT(d) FROM DemandeAutorisationExercice d GROUP BY d.typeDemande")
    List<Object[]> countByTypeDemande();

    // Statistiques par statut
    @Query("SELECT d.statut, COUNT(d) FROM DemandeAutorisationExercice d GROUP BY d.statut")
    List<Object[]> countByStatut();

    // Demandes par secteur d'activité
    List<DemandeAutorisationExercice> findBySecteurActivite(String secteurActivite);

    // Demandes récentes (dernières 30 jours)
    @Query("SELECT d FROM DemandeAutorisationExercice d WHERE d.dateCreation >= :dateLimit ORDER BY d.dateCreation DESC")
    List<DemandeAutorisationExercice> findDemandesRecentes(@Param("dateLimit") LocalDateTime dateLimit);

    // Demandes en retard (dépassant le délai estimé)
    @Query("SELECT d FROM DemandeAutorisationExercice d WHERE d.statut = 'EN_COURS' AND d.delaiTraitementEstime IS NOT NULL AND DATEDIFF(CURRENT_DATE, d.dateCreation) > d.delaiTraitementEstime")
    List<DemandeAutorisationExercice> findDemandesEnRetard();

    // Recherche textuelle dans les observations
    @Query("SELECT d FROM DemandeAutorisationExercice d WHERE d.observations LIKE %:searchTerm% OR d.descriptionActivite LIKE %:searchTerm%")
    List<DemandeAutorisationExercice> searchInObservationsAndDescription(@Param("searchTerm") String searchTerm);

    // Demandes par ville
    List<DemandeAutorisationExercice> findByVilleEntreprise(String villeEntreprise);

    // Demandes par région
    List<DemandeAutorisationExercice> findByRegionEntreprise(String regionEntreprise);

    // Dernière demande par email demandeur
    @Query("SELECT d FROM DemandeAutorisationExercice d WHERE d.emailDemandeur = :email ORDER BY d.dateCreation DESC LIMIT 1")
    Optional<DemandeAutorisationExercice> findLatestByEmailDemandeur(@Param("email") String email);

    // Compter les demandes par agent
    @Query("SELECT d.agentAssigneId, COUNT(d) FROM DemandeAutorisationExercice d WHERE d.agentAssigneId IS NOT NULL GROUP BY d.agentAssigneId")
    List<Object[]> countByAgent();

    // Demandes validées dans une période
    @Query("SELECT d FROM DemandeAutorisationExercice d WHERE d.statut = 'VALIDE' AND d.dateValidation BETWEEN :dateDebut AND :dateFin")
    List<DemandeAutorisationExercice> findDemandesValideesBetween(@Param("dateDebut") LocalDateTime dateDebut, @Param("dateFin") LocalDateTime dateFin);
}
