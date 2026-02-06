package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.Entity.Conjoint;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.dto.request.ConjointRequest;
import abdaty_technologie.API_Invest.dto.response.ConjointResponse;
import abdaty_technologie.API_Invest.exception.BadRequestException;
import abdaty_technologie.API_Invest.exception.NotFoundException;
import abdaty_technologie.API_Invest.repository.ConjointRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.service.ConjointService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConjointServiceImpl implements ConjointService {

    private final ConjointRepository conjointRepository;
    private final PersonsRepository personsRepository;

    @Value("${file.upload-dir:uploads/actes-mariage}")
    private String uploadDir;

    @Override
    @Transactional
    public ConjointResponse create(String personId, ConjointRequest request) {
        Persons person = personsRepository.findById(personId)
                .orElseThrow(() -> new NotFoundException("Personne introuvable"));

        // Vérifier que la personne est mariée
        if (person.getSituationMatrimoniale() == null || 
            !person.getSituationMatrimoniale().name().contains("MARIE")) {
            throw new BadRequestException("La personne doit être mariée pour ajouter un conjoint");
        }

        // Vérifier si un conjoint avec le même prénom et nom existe déjà
        List<Conjoint> conjointsExistants = conjointRepository.findByPersonId(personId);
        for (Conjoint existant : conjointsExistants) {
            if (existant.getPrenom().equalsIgnoreCase(request.prenom) && 
                existant.getNom().equalsIgnoreCase(request.nom)) {
                System.out.println("⚠️ [CONJOINT] Conjoint existant trouvé: " + request.prenom + " " + request.nom);
                
                // Vérifier si les informations correspondent
                boolean infosDifferentes = false;
                StringBuilder differences = new StringBuilder();
                
                if (!existant.getDateMariage().equals(request.dateMariage)) {
                    infosDifferentes = true;
                    differences.append("Date de mariage différente (existant: ")
                              .append(existant.getDateMariage())
                              .append(", nouveau: ")
                              .append(request.dateMariage)
                              .append("). ");
                }
                
                if (!existant.getLieuMariage().equalsIgnoreCase(request.lieuMariage)) {
                    infosDifferentes = true;
                    differences.append("Lieu de mariage différent (existant: ")
                              .append(existant.getLieuMariage())
                              .append(", nouveau: ")
                              .append(request.lieuMariage)
                              .append("). ");
                }
                
                if (existant.getRegimeMatrimonial() != request.regimeMatrimonial) {
                    infosDifferentes = true;
                    differences.append("Régime matrimonial différent (existant: ")
                              .append(existant.getRegimeMatrimonial())
                              .append(", nouveau: ")
                              .append(request.regimeMatrimonial)
                              .append("). ");
                }
                
                if (existant.getClauseRestrictive() != request.clauseRestrictive) {
                    infosDifferentes = true;
                    differences.append("Clause restrictive différente (existant: ")
                              .append(existant.getClauseRestrictive())
                              .append(", nouveau: ")
                              .append(request.clauseRestrictive)
                              .append("). ");
                }
                
                if (infosDifferentes) {
                    throw new BadRequestException(
                        "Un conjoint avec le nom '" + request.prenom + " " + request.nom + 
                        "' existe déjà pour cette personne avec des informations différentes: " + 
                        differences.toString() + 
                        "Veuillez vérifier les informations ou utiliser le conjoint existant."
                    );
                }
                
                // Si toutes les infos correspondent, retourner le conjoint existant
                System.out.println("✅ [CONJOINT] Réutilisation du conjoint existant: " + request.prenom + " " + request.nom);
                return toResponse(existant);
            }
        }

        // Créer un nouveau conjoint seulement s'il n'existe pas
        System.out.println("✅ [CONJOINT] Création d'un nouveau conjoint: " + request.prenom + " " + request.nom);
        Conjoint conjoint = new Conjoint();
        conjoint.setPerson(person);
        conjoint.setPrenom(request.prenom);
        conjoint.setNom(request.nom);
        conjoint.setDateMariage(request.dateMariage);
        conjoint.setLieuMariage(request.lieuMariage);
        conjoint.setRegimeMatrimonial(request.regimeMatrimonial);
        conjoint.setClauseRestrictive(request.clauseRestrictive);

        Conjoint saved = conjointRepository.save(conjoint);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ConjointResponse update(String conjointId, ConjointRequest request) {
        Conjoint conjoint = conjointRepository.findById(conjointId)
                .orElseThrow(() -> new NotFoundException("Conjoint introuvable"));

        conjoint.setPrenom(request.prenom);
        conjoint.setNom(request.nom);
        conjoint.setDateMariage(request.dateMariage);
        conjoint.setLieuMariage(request.lieuMariage);
        conjoint.setRegimeMatrimonial(request.regimeMatrimonial);
        conjoint.setClauseRestrictive(request.clauseRestrictive);

        Conjoint updated = conjointRepository.save(conjoint);
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void delete(String conjointId) {
        Conjoint conjoint = conjointRepository.findById(conjointId)
                .orElseThrow(() -> new NotFoundException("Conjoint introuvable"));

        conjointRepository.delete(conjoint);
    }

    @Override
    public List<ConjointResponse> getByPersonId(String personId) {
        List<Conjoint> conjoints = conjointRepository.findByPersonId(personId);
        return conjoints.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ConjointResponse getById(String conjointId) {
        Conjoint conjoint = conjointRepository.findById(conjointId)
                .orElseThrow(() -> new NotFoundException("Conjoint introuvable"));
        return toResponse(conjoint);
    }

    @Override
    @Transactional
    public String uploadActeMariage(String conjointId, MultipartFile file) {
        // L'acte de mariage n'est plus géré au niveau du conjoint
        // Il sera uploadé dans les documents de la personne (Promoteur/Documents)
        throw new BadRequestException("L'acte de mariage doit être uploadé dans les documents de la personne");
    }

    @Override
    @Transactional
    public void deleteActeMariage(String conjointId) {
        // L'acte de mariage n'est plus géré au niveau du conjoint
        throw new BadRequestException("L'acte de mariage doit être géré dans les documents de la personne");
    }

    @Override
    @Transactional
    public ConjointResponse findOrCreate(String personId, ConjointRequest request) {
        // Cette méthode utilise la même logique que create() qui vérifie déjà les doublons
        return create(personId, request);
    }

    private ConjointResponse toResponse(Conjoint conjoint) {
        ConjointResponse response = new ConjointResponse();
        response.setId(conjoint.getId());
        response.setPrenom(conjoint.getPrenom());
        response.setNom(conjoint.getNom());
        response.setDateMariage(conjoint.getDateMariage());
        response.setLieuMariage(conjoint.getLieuMariage());
        response.setRegimeMatrimonial(conjoint.getRegimeMatrimonial());
        response.setClauseRestrictive(conjoint.getClauseRestrictive());
        return response;
    }
}
