package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.Entity.Divisions;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Enum.Sexes;
import abdaty_technologie.API_Invest.Entity.Enum.Civilites;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.constants.Messages;
import abdaty_technologie.API_Invest.dto.request.PersonCreateRequest;
import abdaty_technologie.API_Invest.dto.response.PersonResponse;
import abdaty_technologie.API_Invest.exception.BadRequestException;
import abdaty_technologie.API_Invest.exception.NotFoundException;
import abdaty_technologie.API_Invest.repository.DivisionsRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.service.PersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PersonServiceImpl implements PersonService {

    @Autowired private PersonsRepository personsRepository;
    @Autowired private DivisionsRepository divisionsRepository;

    @Override
    public PersonResponse create(PersonCreateRequest req) {
        // --- Validation de base (au-delà des annotations DTO) ---
        // On garde ici des contrôles côté service pour garantir l'intégrité même si les DTO changent.
        if (req.nom == null || req.nom.isBlank()) throw new BadRequestException(Messages.PERSON_NOM_OBLIGATOIRE);
        if (req.prenom == null || req.prenom.isBlank()) throw new BadRequestException(Messages.PERSON_PRENOM_OBLIGATOIRE);
        if (req.telephone1 == null || req.telephone1.isBlank()) throw new BadRequestException(Messages.PERSON_TEL1_OBLIGATOIRE);
        if (req.dateNaissance == null) throw new BadRequestException(Messages.PERSON_DATE_NAISSANCE_OBLIGATOIRE);
        if (req.lieuNaissance == null || req.lieuNaissance.isBlank()) throw new BadRequestException(Messages.PERSON_LIEU_NAISSANCE_OBLIGATOIRE);
        if (req.nationnalite == null || req.sexe == null || req.situationMatrimoniale == null || req.civilite == null) {
            // Validation fine ci-dessous
        }

        // --- Rôle / Email / Téléphones ---
        // Email: optionnel si role USER, obligatoire sinon
        // (unicité vérifiée uniquement si fourni)
        // Rôle par défaut USER
        Roles role = (req.role == null) ? Roles.USER : req.role;
        if (role != Roles.USER && (req.email == null || req.email.isBlank())) {
            throw new BadRequestException(Messages.PERSON_EMAIL_OBLIGATOIRE_SI_NON_USER);
        }
        if (req.email != null && !req.email.isBlank()) {
            if (personsRepository.existsByEmail(req.email)) throw new BadRequestException(Messages.PERSON_EMAIL_DEJA_UTILISE);
        }
        if (personsRepository.existsByTelephone1(req.telephone1)) throw new BadRequestException(Messages.PERSON_TEL_DEJA_UTILISE);

        // Téléphone format international (E.164): +[country][digits]
        // Helper défini en bas de classe: isValidInternationalPhone
        if (!isValidInternationalPhone(req.telephone1)) {
            throw new BadRequestException(Messages.PERSON_TELEPHONE_INVALIDE);
        }
        if (req.telephone2 != null && !req.telephone2.isBlank() && !isValidInternationalPhone(req.telephone2)) {
            throw new BadRequestException(Messages.PERSON_TELEPHONE_INVALIDE);
        }

        // antenneAgent: non obligatoire si rôle USER, obligatoire sinon
        if (role != Roles.USER && req.antenneAgent == null) {
            throw new BadRequestException(Messages.PERSON_ANTENNE_AGENT_OBLIGATOIRE);
        }

        // entrepriseRole: obligatoire SEULEMENT si rôle USER
        if (role == Roles.USER) {
            if (req.entrepriseRole == null) {
                throw new BadRequestException(Messages.PERSON_ENTREPRISE_ROLE_OBLIGATOIRE_POUR_USER);
            }
        } else {
            // Un agent ne doit pas avoir de rôle d'entreprise
            if (req.entrepriseRole != null) {
                throw new BadRequestException(Messages.PERSON_AGENT_DOIT_PAS_AVOIR_ENTREPRISEROLE);
            }
        }

        // Division optionnelle par code ou par ID avec logique de fallback robuste
        Divisions div = null;
        try {
            if (req.division_id != null && !req.division_id.isBlank()) {
                // Priorité à division_id si fourni
                div = divisionsRepository.findById(req.division_id).orElse(null);
                if (div != null) {
                    System.out.println("[PersonService] Division trouvée par ID: " + div.getId() + " (" + div.getCode() + ")");
                } else {
                    System.out.println("[PersonService] Division_id " + req.division_id + " non trouvé");
                }
            }
            
            if (div == null && req.divisionCode != null && !req.divisionCode.isBlank()) {
                // Fallback sur divisionCode
                div = divisionsRepository.findByCode(req.divisionCode).orElse(null);
                if (div != null) {
                    System.out.println("[PersonService] Division trouvée par code: " + div.getCode() + " (ID: " + div.getId() + ")");
                } else {
                    System.out.println("[PersonService] DivisionCode " + req.divisionCode + " non trouvé");
                }
            }
            
            if (div == null) {
                // Ne plus faire de fallback automatique - respecter le choix de null
                System.out.println("[PersonService] Aucune division spécifiée - division_id et divisionCode sont null/vides");
                System.out.println("[PersonService] La personne sera créée sans division assignée");
            }
        } catch (Exception e) {
            System.out.println("[PersonService] Erreur lors de la recherche de division: " + e.getMessage());
            // Continuer sans division plutôt que de faire échouer la création
        }

        // --- Age / Autorisation ---
        // Calcule l'âge à partir du LocalDate reçu et rejette si < 18 ans.
        LocalDate naissance = req.dateNaissance;
        LocalDate aujourdhui = LocalDate.now(ZoneId.of("Africa/Bamako"));
        
        // Calcul d'âge avec plusieurs méthodes pour débogage
        int agePeriod = Period.between(naissance, aujourdhui).getYears();
        long ageChronoUnit = ChronoUnit.YEARS.between(naissance, aujourdhui);
        
        // Logs de débogage détaillés
        System.out.println("[PersonService] ========== DÉBOGAGE CALCUL D'ÂGE ==========");
        System.out.println("[PersonService] Date de naissance reçue: " + naissance);
        System.out.println("[PersonService] Date actuelle (Bamako): " + aujourdhui);
        System.out.println("[PersonService] Âge calculé (Period): " + agePeriod + " ans");
        System.out.println("[PersonService] Âge calculé (ChronoUnit): " + ageChronoUnit + " ans");
        System.out.println("[PersonService] Différence entre les deux méthodes: " + (agePeriod - ageChronoUnit));
        
        // Utiliser ChronoUnit qui est plus fiable
        int age = (int) ageChronoUnit;
        
        // Vérification de cohérence
        if (naissance.isAfter(aujourdhui)) {
            System.out.println("[PersonService] ERREUR: Date de naissance dans le futur!");
            throw new BadRequestException("La date de naissance ne peut pas être dans le futur");
        }
        
        // Calcul alternatif simple pour vérification
        int anneeNaissance = naissance.getYear();
        int anneeActuelle = aujourdhui.getYear();
        int ageSimple = anneeActuelle - anneeNaissance;
        
        // Ajustement si l'anniversaire n'est pas encore passé cette année
        if (naissance.getDayOfYear() > aujourdhui.getDayOfYear()) {
            ageSimple--;
        }
        
        System.out.println("[PersonService] Âge calculé (méthode simple): " + ageSimple + " ans");
        System.out.println("[PersonService] ================================================");
        
        boolean autoriser = age >= 18;
        if (!autoriser) {
            System.out.println("[PersonService] ERREUR: Personne mineure - âge: " + age + " ans (< 18)");
            System.out.println("[PersonService] Toutes les méthodes de calcul:");
            System.out.println("[PersonService] - Period.between(): " + agePeriod);
            System.out.println("[PersonService] - ChronoUnit.YEARS: " + ageChronoUnit);
            System.out.println("[PersonService] - Méthode simple: " + ageSimple);
            throw new BadRequestException(Messages.personneMineure("ID_TEMPORAIRE") + " - Âge calculé: " + age + " ans");
        }

        // --- Cohérence sexe/civilité ---
        if (req.sexe == Sexes.MASCULIN) {
            if (req.civilite != Civilites.MONSIEUR) {
                throw new BadRequestException(Messages.PERSON_CIVILITE_INVALIDE_POUR_SEXE);
            }
        } else if (req.sexe == Sexes.FEMININ) {
            if (!(req.civilite == Civilites.MADAME || req.civilite == Civilites.MADEMOISELLE)) {
                throw new BadRequestException(Messages.PERSON_CIVILITE_INVALIDE_POUR_SEXE);
            }
        }

        Persons p = new Persons();
        p.setNom(req.nom.trim());
        p.setPrenom(req.prenom.trim());
        p.setEmail(req.email != null && !req.email.isBlank() ? req.email.trim() : null);
        p.setTelephone1(req.telephone1.trim());
        p.setTelephone2(req.telephone2 != null ? req.telephone2.trim() : null);
        p.setDateNaissance(java.util.Date.from(req.dateNaissance.atStartOfDay(ZoneId.of("Africa/Bamako")).toInstant()));
        p.setLieuNaissance(req.lieuNaissance.trim());
        p.setEstAutoriser(autoriser);
        p.setNationalite(req.nationnalite);
        p.setEntrepriseRole(req.entrepriseRole); // peut rester null si role != USER
        p.setAntenneAgent(req.antenneAgent); // peut rester null si role == USER
        p.setSexe(req.sexe);
        p.setSituationMatrimoniale(req.situationMatrimoniale);
        p.setCivilite(req.civilite);
        p.setRole(role);
        p.setDivision(div);
        p.setLocalite(req.localite != null ? req.localite.trim() : null);
        
        // Log final pour vérifier l'assignation
        System.out.println("[PersonService] Division finale assignée: " + (div != null ? div.getId() : "NULL"));
        System.out.println("[PersonService] Localité assignée: " + (req.localite != null ? req.localite : "NULL"));

        Persons saved = personsRepository.save(p);
        return toResponse(saved);
    }

    @Override
    public PersonResponse getById(String id) {
        Persons p = personsRepository.findById(id).orElseThrow(() -> new NotFoundException("Personne introuvable"));
        return toResponse(p);
    }

    @Override
    public List<PersonResponse> list() {
        return personsRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public PersonResponse update(String id, abdaty_technologie.API_Invest.dto.request.PersonUpdateRequest req) {
        Persons p = personsRepository.findById(id).orElseThrow(() -> new NotFoundException("Personne introuvable"));

        // Unicité email/téléphone si modifiés
        if (req.email != null && !req.email.isBlank() && !req.email.equalsIgnoreCase(p.getEmail())) {
            if (personsRepository.existsByEmail(req.email)) throw new BadRequestException(Messages.PERSON_EMAIL_DEJA_UTILISE);
            p.setEmail(req.email.trim());
        }
        if (req.telephone1 != null && !req.telephone1.isBlank() && !req.telephone1.equals(p.getTelephone1())) {
            if (!isValidInternationalPhone(req.telephone1)) throw new BadRequestException(Messages.PERSON_TELEPHONE_INVALIDE);
            if (personsRepository.existsByTelephone1(req.telephone1)) throw new BadRequestException(Messages.PERSON_TEL_DEJA_UTILISE);
            p.setTelephone1(req.telephone1.trim());
        }
        if (req.telephone2 != null) {
            if (!req.telephone2.isBlank() && !isValidInternationalPhone(req.telephone2)) throw new BadRequestException(Messages.PERSON_TELEPHONE_INVALIDE);
            p.setTelephone2(req.telephone2.isBlank() ? null : req.telephone2.trim());
        }
        if (req.nom != null) p.setNom(req.nom.trim());
        if (req.prenom != null) p.setPrenom(req.prenom.trim());
        if (req.lieuNaissance != null) p.setLieuNaissance(req.lieuNaissance.trim());
        if (req.nationnalite != null) p.setNationalite(req.nationnalite);
        if (req.entrepriseRole != null) p.setEntrepriseRole(req.entrepriseRole);
        if (req.sexe != null) p.setSexe(req.sexe);
        if (req.situationMatrimoniale != null) p.setSituationMatrimoniale(req.situationMatrimoniale);
        if (req.civilite != null) p.setCivilite(req.civilite);

        // Division - logique de fallback robuste comme dans PersonSeeder
        Divisions div = null;
        try {
            if (req.division_id != null && !req.division_id.isBlank()) {
                // Priorité à division_id si fourni
                div = divisionsRepository.findById(req.division_id).orElse(null);
                if (div != null) {
                    System.out.println("[PersonService UPDATE] Division trouvée par ID: " + div.getId() + " (" + div.getCode() + ")");
                } else {
                    System.out.println("[PersonService UPDATE] Division_id " + req.division_id + " non trouvé");
                }
            }
            
            if (div == null && req.divisionCode != null && !req.divisionCode.isBlank()) {
                // Fallback sur divisionCode
                div = divisionsRepository.findByCode(req.divisionCode).orElse(null);
                if (div != null) {
                    System.out.println("[PersonService UPDATE] Division trouvée par code: " + div.getCode() + " (ID: " + div.getId() + ")");
                } else {
                    System.out.println("[PersonService UPDATE] DivisionCode " + req.divisionCode + " non trouvé");
                }
            }
            
            if (div == null && (req.division_id != null || req.divisionCode != null)) {
                // Ne plus faire de fallback automatique - respecter le choix de null
                System.out.println("[PersonService UPDATE] Division spécifiée mais non trouvée - division_id: " + req.division_id + ", divisionCode: " + req.divisionCode);
                System.out.println("[PersonService UPDATE] La division restera null");
            }
            
            // Appliquer la division trouvée (ou null si aucune demandée)
            if (req.division_id != null || req.divisionCode != null) {
                p.setDivision(div);
                System.out.println("[PersonService UPDATE] Division finale assignée: " + (div != null ? div.getId() : "NULL"));
            }
        } catch (Exception e) {
            System.out.println("[PersonService UPDATE] Erreur lors de la recherche de division: " + e.getMessage());
            // Continuer sans division plutôt que de faire échouer la mise à jour
        }

        // Localité
        if (req.localite != null) {
            p.setLocalite(req.localite.isBlank() ? null : req.localite.trim());
            System.out.println("[PersonService UPDATE] Localité assignée: " + (req.localite.isBlank() ? "NULL" : req.localite));
        }


        // Rôle et antenneAgent
        Roles newRole = (req.role != null) ? req.role : p.getRole();
        if (newRole != Roles.USER) {
            // email obligatoire globalement si rôle final != USER
            if ((req.email == null || req.email.isBlank()) && (p.getEmail() == null || p.getEmail().isBlank())) {
                throw new BadRequestException(Messages.PERSON_EMAIL_OBLIGATOIRE_SI_NON_USER);
            }
        }
        if (newRole != Roles.USER) {
            // antenneAgent obligatoire si rôle != USER
            if (req.antenneAgent == null && p.getAntenneAgent() == null) {
                throw new BadRequestException(Messages.PERSON_ANTENNE_AGENT_OBLIGATOIRE);
            }
         
        }
        p.setRole(newRole);
        if (req.antenneAgent != null) {
            p.setAntenneAgent(req.antenneAgent);
        }

        // --- Date de naissance et estAutoriser (automatique) ---
        if (req.dateNaissance != null) {
            p.setDateNaissance(java.util.Date.from(req.dateNaissance.atStartOfDay(ZoneId.of("Africa/Bamako")).toInstant()));
        }
        // Cohérence sexe/civilité si modifiés
        Sexes effSexe = (req.sexe != null) ? req.sexe : p.getSexe();
        Civilites effCiv = (req.civilite != null) ? req.civilite : p.getCivilite();
        if (effSexe == Sexes.MASCULIN) {
            if (effCiv != Civilites.MONSIEUR) {
                throw new BadRequestException(Messages.PERSON_CIVILITE_INVALIDE_POUR_SEXE);
            }
        } else if (effSexe == Sexes.FEMININ) {
            if (!(effCiv == Civilites.MADAME || effCiv == Civilites.MADEMOISELLE)) {
                throw new BadRequestException(Messages.PERSON_CIVILITE_INVALIDE_POUR_SEXE);
            }
        }
        LocalDate naissanceUpd = p.getDateNaissance().toInstant().atZone(ZoneId.of("Africa/Bamako")).toLocalDate();
        int ageUpd = Period.between(naissanceUpd, LocalDate.now(ZoneId.of("Africa/Bamako"))).getYears();
        p.setEstAutoriser(ageUpd >= 18);

        Persons saved = personsRepository.save(p);
        return toResponse(saved);
    }

    @Override
    public void delete(String id) {
        Persons p = personsRepository.findById(id).orElseThrow(() -> new NotFoundException("Personne introuvable"));
        personsRepository.delete(p);
    }

    private PersonResponse toResponse(Persons p) {
        PersonResponse r = new PersonResponse();
        r.id = p.getId();
        r.nom = p.getNom();
        r.prenom = p.getPrenom();
        r.email = p.getEmail();
        r.telephone1 = p.getTelephone1();
        r.telephone2 = p.getTelephone2();
        r.dateNaissance = p.getDateNaissance();
        r.lieuNaissance = p.getLieuNaissance();
        r.estAutoriser = p.getEstAutoriser();
        r.nationnalite = p.getNationalite();
        r.entrepriseRole = p.getEntrepriseRole();
        r.antenneAgent = p.getAntenneAgent();
        r.sexe = p.getSexe();
        r.situationMatrimoniale = p.getSituationMatrimoniale();
        r.civilite = p.getCivilite();
        r.role = p.getRole();
        r.divisionCode = p.getDivision() != null ? p.getDivision().getCode() : null;
        r.divisionNom = p.getDivision() != null ? p.getDivision().getNom() : null;
        r.division_id = p.getDivision() != null ? p.getDivision().getId() : null;
        r.localite = p.getLocalite();
        return r;
    }

    // Helper téléphone
    // Téléphone international E.164: +[country_code][national_number], 8 à 15 chiffres au total après +
    private boolean isValidInternationalPhone(String phone) {
        if (phone == null) return false;
        String p = phone.trim();
        return p.matches("^\\+[1-9]\\d{7,14}$");
    }
}
