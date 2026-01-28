package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;
import abdaty_technologie.API_Invest.Entity.Enum.TypeAgrement;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.service.AgrementService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.Year;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AgrementServiceImpl implements AgrementService {

    private final EntrepriseRepository entrepriseRepository;
    private final Random random = new Random();

    @Override
    @Transactional
    public Entreprise initierDemandeAgrement(String entrepriseId) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise non trouvée avec l'ID: " + entrepriseId));

        System.out.println("=== INITIATION AGREMENT DEBUG ===");
        System.out.println("Entreprise ID: " + entrepriseId);
        System.out.println("Nom: " + entreprise.getNom());
        System.out.println("Domaine activité: " + entreprise.getDomaineActivite());
        System.out.println("Etape validation: " + entreprise.getEtapeValidation());
        System.out.println("Numéro autorisation: " + entreprise.getNumeroAutorisation());

        // Vérifier l'éligibilité - Assouplir les conditions pour permettre l'initiation
        // Le domaine d'activité n'est pas obligatoire pour les entreprises de transport
        
        // Vérifier que l'entreprise a terminé la création OU est déjà en processus d'agrément
        if (entreprise.getEtapeValidation() != null && 
            !EtapeValidation.RETRAIT.equals(entreprise.getEtapeValidation()) &&
            !entreprise.getEtapeValidation().toString().contains("AGREMENT")) {
            throw new IllegalStateException("L'entreprise doit avoir terminé la création avant de demander un agrément. Étape actuelle: " + entreprise.getEtapeValidation());
        }

        // Si l'entreprise a déjà un numéro d'autorisation et est à l'étape finale
        if (entreprise.getNumeroAutorisation() != null && 
            EtapeValidation.AGREMENT_COMPLETE.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise a déjà un agrément complet");
        }

        // Si déjà en cours d'agrément, ne pas réinitier
        if (entreprise.getEtapeValidation() != null && 
            entreprise.getEtapeValidation().toString().contains("AGREMENT") &&
            !EtapeValidation.RETRAIT.equals(entreprise.getEtapeValidation())) {
            System.out.println("Entreprise déjà en processus d'agrément, retour de l'état actuel");
            return entreprise;
        }

        // Initier le workflow d'agrément
        entreprise.setEtapeValidation(EtapeValidation.ACCUEIL_AGREMENT);
        
        System.out.println("Agrément initié avec succès - Nouvelle étape: " + entreprise.getEtapeValidation());
        
        return entrepriseRepository.save(entreprise);
    }

    @Override
    @Transactional
    public Entreprise validerEtapeAgrement(String entrepriseId, EtapeValidation etapeActuelle) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise non trouvée avec l'ID: " + entrepriseId));

        // Vérifier que l'entreprise est bien à l'étape indiquée
        if (!etapeActuelle.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("L'entreprise n'est pas à l'étape " + etapeActuelle);
        }

        // Transition vers l'étape suivante
        switch (etapeActuelle) {
            case ACCUEIL_AGREMENT:
                entreprise.setEtapeValidation(EtapeValidation.REVISION_AGREMENT);
                break;
            case REVISION_AGREMENT:
                entreprise.setEtapeValidation(EtapeValidation.REGISSEUR_AGREMENT);
                break;
            case REGISSEUR_AGREMENT:
                entreprise.setEtapeValidation(EtapeValidation.MINISTERE_AGREMENT);
                break;
            default:
                throw new IllegalStateException("Étape invalide pour la validation: " + etapeActuelle);
        }

        return entrepriseRepository.save(entreprise);
    }

    @Override
    @Transactional
    public Entreprise rejeterDemandeAgrement(String entrepriseId, String observations) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise non trouvée avec l'ID: " + entrepriseId));

        // Vérifier que l'entreprise est à l'étape de révision
        if (!EtapeValidation.REVISION_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("Le rejet n'est possible qu'à l'étape de révision");
        }

        // Retour à l'accueil avec observations
        entreprise.setEtapeValidation(EtapeValidation.ACCUEIL_AGREMENT);
        entreprise.setObservations(observations);

        return entrepriseRepository.save(entreprise);
    }

    @Override
    @Transactional
    public Entreprise delivrerAgrement(String entrepriseId, TypeAgrement typeAgrement, String observations) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise non trouvée avec l'ID: " + entrepriseId));

        // Vérifier que l'entreprise est à l'étape ministère
        if (!EtapeValidation.MINISTERE_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("La délivrance n'est possible qu'à l'étape ministère");
        }

        // Générer le numéro d'autorisation
        String numeroAutorisation = genererNumeroAutorisation(typeAgrement);

        // Mettre à jour les informations d'agrément
        entreprise.setNumeroAutorisation(numeroAutorisation);
        entreprise.setDateAutorisation(Instant.now());
        entreprise.setTypeAgrement(typeAgrement);
        entreprise.setDelaiTraitement(typeAgrement.getDelaiJours());
        entreprise.setAvantagesFiscaux(typeAgrement.hasAvantagesFiscaux());
        entreprise.setObservations(observations);
        entreprise.setEtapeValidation(EtapeValidation.RETRAIT_AGREMENT);

        return entrepriseRepository.save(entreprise);
    }

    @Override
    @Transactional
    public Entreprise marquerAgrementRetire(String entrepriseId) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise non trouvée avec l'ID: " + entrepriseId));

        // Vérifier que l'entreprise est à l'étape de retrait
        if (!EtapeValidation.RETRAIT_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("Le marquage comme retiré n'est possible qu'à l'étape de retrait");
        }

        // Marquer comme retiré
        entreprise.setDateRetraitAgrement(Instant.now());
        entreprise.setEtapeValidation(EtapeValidation.AGREMENT_COMPLETE);

        return entrepriseRepository.save(entreprise);
    }

    @Override
    public String genererNumeroAutorisation(TypeAgrement typeAgrement) {
        int annee = Year.now().getValue();
        int numeroAleatoire = random.nextInt(10000);
        String numeroFormate = String.format("%04d", numeroAleatoire);

        String prefix = switch (typeAgrement) {
            case BTP_TOURISME -> "BTP";
            case ETABLISSEMENT_CLASSE -> "EC";
            case CODE_INVESTISSEMENT -> "CI";
        };

        return String.format("%s-%d-%s", prefix, annee, numeroFormate);
    }

    @Override
    @Transactional
    public Entreprise soumettreDemandeAgrement(String entrepriseId) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise non trouvée avec l'ID: " + entrepriseId));

        // Vérifier que la demande a été initiée
        if (!entreprise.getEtapeValidation().toString().contains("AGREMENT")) {
            throw new IllegalStateException("La demande d'agrément n'a pas été initiée pour cette entreprise");
        }

        // Vérifier que l'entreprise est à l'étape d'accueil (première étape après initiation)
        if (!EtapeValidation.ACCUEIL_AGREMENT.equals(entreprise.getEtapeValidation())) {
            throw new IllegalStateException("La demande a déjà été soumise ou est en cours de traitement");
        }

        // La demande reste à l'étape ACCUEIL_AGREMENT pour être traitée par l'agent d'accueil
        // L'agent d'accueil validera ensuite pour passer à REVISION_AGREMENT
        
        // Ajouter une observation pour indiquer la soumission
        String observation = "Demande soumise avec tous les documents requis le " + 
                           Instant.now().toString() + ". En attente de traitement par l'agent d'accueil.";
        entreprise.setObservations(observation);

        return entrepriseRepository.save(entreprise);
    }
}
