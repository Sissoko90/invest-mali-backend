package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.Entity.Divisions;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Enum.Sexes;
import abdaty_technologie.API_Invest.Entity.Enum.Civilites;
import abdaty_technologie.API_Invest.Entity.Enum.PaysEmissionRccM;
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
        // --- Détection précoce des personnes morales ---
        // Amélioration de la détection avec plusieurs critères
        boolean isPersonneMorale = false;
        
        // Critère 1: Civilité PERSONNE_MORALE
        boolean civilitePersonneMorale = req.civilite == Civilites.PERSONNE_MORALE;
        
        // Critère 2: Présence des champs spécifiques aux personnes morales
        boolean champsPersonneMorale = (req.paysEmissionRccm != null && !req.paysEmissionRccm.isEmpty()) || 
                                      (req.denominationEntreprise != null && !req.denominationEntreprise.trim().isEmpty());
        
        // Critère 3: Date de naissance fictive (1900-01-01) utilisée pour les personnes morales
        boolean dateNaissanceFictive = req.dateNaissance != null && 
                                      req.dateNaissance.equals(LocalDate.of(1900, 1, 1));
        
        // Une personne morale est détectée si au moins un critère est rempli
        isPersonneMorale = civilitePersonneMorale || champsPersonneMorale || dateNaissanceFictive;
        
        // Logs de diagnostic pour la détection des personnes morales
        System.out.println("🔍 [PersonService] DIAGNOSTIC PERSONNE MORALE:");
        System.out.println("🔍 [PersonService] - req.civilite: " + req.civilite);
        System.out.println("🔍 [PersonService] - Critère 1 (civilité): " + civilitePersonneMorale);
        System.out.println("🔍 [PersonService] - req.paysEmissionRccm: " + req.paysEmissionRccm);
        System.out.println("🔍 [PersonService] - req.denominationEntreprise: " + req.denominationEntreprise);
        System.out.println("🔍 [PersonService] - Critère 2 (champs): " + champsPersonneMorale);
        System.out.println("🔍 [PersonService] - req.dateNaissance: " + req.dateNaissance);
        System.out.println("🔍 [PersonService] - Critère 3 (date fictive): " + dateNaissanceFictive);
        System.out.println("🔍 [PersonService] - isPersonneMorale final: " + isPersonneMorale);
        
        if (isPersonneMorale) {
            System.out.println("🏢 [PersonService] PERSONNE MORALE DÉTECTÉE - Exemption des validations d'âge et personnelles");
        } else {
            System.out.println("👤 [PersonService] PERSONNE PHYSIQUE DÉTECTÉE - Validations normales appliquées");
        }
        
        // --- Validation de base (au-delà des annotations DTO) ---
        // Champs obligatoires pour tous
        if (req.nom == null || req.nom.isBlank()) throw new BadRequestException(Messages.PERSON_NOM_OBLIGATOIRE);
        if (req.prenom == null || req.prenom.isBlank()) throw new BadRequestException(Messages.PERSON_PRENOM_OBLIGATOIRE);
        
        // Champs obligatoires uniquement pour les personnes physiques
        if (!isPersonneMorale) {
            if (req.telephone1 == null || req.telephone1.isBlank()) throw new BadRequestException(Messages.PERSON_TEL1_OBLIGATOIRE);
            if (req.dateNaissance == null) throw new BadRequestException(Messages.PERSON_DATE_NAISSANCE_OBLIGATOIRE);
            if (req.lieuNaissance == null || req.lieuNaissance.isBlank()) throw new BadRequestException(Messages.PERSON_LIEU_NAISSANCE_OBLIGATOIRE);
        } else {
            System.out.println("🏢 [PersonService] Personne morale - exemption des validations téléphone, date et lieu de naissance");
        }

        // --- Rôle / Email / Téléphones ---
        // Email: optionnel si role USER ou personne morale, obligatoire sinon
        // (unicité vérifiée uniquement si fourni)
        // Rôle par défaut USER
        Roles role = (req.role == null) ? Roles.USER : req.role;
        
        // Nettoyer l'email s'il ressemble à un numéro de téléphone
        String cleanedEmail = req.email;
        if (cleanedEmail != null && (cleanedEmail.startsWith("+") || cleanedEmail.matches("^[\\d\\s\\-\\.]+$"))) {
            System.out.println("🔍 [PersonService.create] Email rejeté car ressemble à un numéro de téléphone: " + cleanedEmail);
            cleanedEmail = null;
        }
        
        if (!isPersonneMorale && role != Roles.USER && (cleanedEmail == null || cleanedEmail.isBlank())) {
            throw new BadRequestException(Messages.PERSON_EMAIL_OBLIGATOIRE_SI_NON_USER);
        } else if (isPersonneMorale) {
            System.out.println("🏢 [PersonService] Personne morale - email optionnel même pour rôles non-USER");
        }
        if (cleanedEmail != null && !cleanedEmail.isBlank()) {
            if (personsRepository.existsByEmail(cleanedEmail)) throw new BadRequestException(Messages.PERSON_EMAIL_DEJA_UTILISE);
        }
        // Validations téléphone uniquement pour les personnes physiques
        if (!isPersonneMorale) {
            if (personsRepository.existsByTelephone1(req.telephone1)) throw new BadRequestException(Messages.PERSON_TEL_DEJA_UTILISE);

            // Téléphone format international (E.164): +[country][digits]
            // Helper défini en bas de classe: isValidInternationalPhone
            if (!isValidInternationalPhone(req.telephone1)) {
                throw new BadRequestException(Messages.PERSON_TELEPHONE_INVALIDE);
            }
            if (req.telephone2 != null && !req.telephone2.isBlank() && !isValidInternationalPhone(req.telephone2)) {
                throw new BadRequestException(Messages.PERSON_TELEPHONE_INVALIDE);
            }
        } else {
            System.out.println("🏢 [PersonService] Personne morale - exemption des validations téléphone (unicité et format)");
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
        // Calcule l'âge uniquement pour les personnes physiques
        boolean autoriser = true; // Par défaut autorisé pour les personnes morales
        
        if (!isPersonneMorale) {
            // Validation et calcul d'âge pour les personnes physiques
            if (req.dateNaissance == null) {
                System.out.println("[PersonService] ERREUR: Date de naissance null pour une personne physique");
                throw new BadRequestException("La date de naissance est obligatoire pour les personnes physiques");
            }
            
            LocalDate naissance = req.dateNaissance;
            LocalDate aujourdhui = LocalDate.now(ZoneId.of("Africa/Bamako"));
            
            // Validation de cohérence de la date
            if (naissance.isAfter(aujourdhui)) {
                System.out.println("[PersonService] ERREUR: Date de naissance dans le futur: " + naissance);
                throw new BadRequestException("La date de naissance ne peut pas être dans le futur");
            }
            
            // Validation d'âge maximum raisonnable (120 ans)
            if (naissance.isBefore(LocalDate.now().minusYears(120))) {
                System.out.println("[PersonService] ERREUR: Date de naissance trop ancienne: " + naissance);
                throw new BadRequestException("La date de naissance ne peut pas être antérieure à 120 ans");
            }
            
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
            
            // Validation d'âge avec exemption spéciale pour les dates fictives des personnes morales
            if (naissance.equals(LocalDate.of(1900, 1, 1))) {
                // Date fictive utilisée pour les personnes morales - toujours autoriser
                autoriser = true;
                System.out.println("🏢 [PersonService] Date de naissance fictive (1900-01-01) détectée - Personne morale autorisée automatiquement");
            } else {
                // Validation normale pour les personnes physiques
                autoriser = age >= 18;
                if (!autoriser) {
                    System.out.println("[PersonService] ERREUR: Personne mineure - âge: " + age + " ans (< 18)");
                    System.out.println("[PersonService] Toutes les méthodes de calcul:");
                    System.out.println("[PersonService] - Period.between(): " + agePeriod);
                    System.out.println("[PersonService] - ChronoUnit.YEARS: " + ageChronoUnit);
                    System.out.println("[PersonService] - Méthode simple: " + ageSimple);
                    throw new BadRequestException(Messages.personneMineure("ID_TEMPORAIRE") + " - Âge calculé: " + age + " ans");
                }
            }
        } else {
            System.out.println("🏢 [PersonService] Personne morale - exemption de la validation d'âge (toujours autorisée)");
        }

        // --- Cohérence sexe/civilité (sauf pour les personnes morales) ---
        if (!isPersonneMorale) {
            if (req.sexe == Sexes.MASCULIN) {
                if (req.civilite != Civilites.MONSIEUR) {
                    throw new BadRequestException(Messages.PERSON_CIVILITE_INVALIDE_POUR_SEXE);
                }
            } else if (req.sexe == Sexes.FEMININ) {
                if (!(req.civilite == Civilites.MADAME || req.civilite == Civilites.MADEMOISELLE)) {
                    throw new BadRequestException(Messages.PERSON_CIVILITE_INVALIDE_POUR_SEXE);
                }
            }
        } else {
            System.out.println("🏢 [PersonService] Personne morale détectée - validation sexe/civilité ignorée");
        }

        Persons p = new Persons();
        p.setNom(req.nom.trim());
        p.setPrenom(req.prenom.trim());
        p.setEmail(cleanedEmail != null && !cleanedEmail.isBlank() ? cleanedEmail.trim() : null);
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
        p.setPorte(req.porte != null ? req.porte.trim() : null);
        p.setAdresseLibre(req.adresseLibre != null ? req.adresseLibre.trim() : null);
        
        // 🔍 DEBUG: Logs pour tracer la réception du champ 'porte'
        System.out.println("🔍 [PersonService] DEBUG - Champs de localisation:");
        System.out.println("- localite reçu: " + req.localite);
        System.out.println("- porte reçu: " + req.porte);
        System.out.println("- localite assigné: " + p.getLocalite());
        System.out.println("- porte assigné: " + p.getPorte());
        
        System.out.println("🔍 [PersonService] DEBUG - Détection personne morale:");
        System.out.println("- paysEmissionRccm: " + req.paysEmissionRccm);
        System.out.println("- denominationEntreprise: " + req.denominationEntreprise);
        System.out.println("- isPersonneMorale: " + isPersonneMorale);
        
        // Si c'est une personne morale, forcer la civilité et traiter les champs spécifiques
        if (isPersonneMorale) {
            System.out.println("🏢 [PersonService] Personne morale détectée - traitement des champs spécifiques");
            
            // Forcer la civilité à PERSONNE_MORALE
            p.setCivilite(Civilites.PERSONNE_MORALE);
            System.out.println("✅ [PersonService] Civilité forcée à PERSONNE_MORALE");
            
            // Forcer les champs non applicables aux personnes morales à des valeurs par défaut
            p.setSexe(null); // Les personnes morales n'ont pas de sexe
            p.setSituationMatrimoniale(null); // Les personnes morales n'ont pas de situation matrimoniale
            p.setNationalite(null); // Les personnes morales n'ont pas de nationalité
            System.out.println("✅ [PersonService] Champs personnels forcés à null pour personne morale");
            
            // Traiter paysEmissionRccm
            try {
                if (req.paysEmissionRccm != null && !req.paysEmissionRccm.isEmpty()) {
                    p.setPaysEmissionRccm(PaysEmissionRccM.valueOf(req.paysEmissionRccm));
                    System.out.println("✅ [PersonService] Pays d'émission RCCM assigné: " + req.paysEmissionRccm);
                } else {
                    p.setPaysEmissionRccm(PaysEmissionRccM.MALI);
                    System.out.println("⚠️ [PersonService] Pays d'émission RCCM null/vide, utilisation de MALI par défaut");
                }
            } catch (IllegalArgumentException ex) {
                // Si la valeur n'est pas valide, utiliser MALI par défaut
                p.setPaysEmissionRccm(PaysEmissionRccM.MALI);
                System.out.println("⚠️ [PersonService] Pays d'émission RCCM invalide, utilisation de MALI par défaut");
            }
            
            // Traiter denominationEntreprise avec protection contre null
            if (req.denominationEntreprise != null && !req.denominationEntreprise.trim().isEmpty()) {
                p.setDenominationEntreprise(req.denominationEntreprise.trim());
                System.out.println("✅ [PersonService] Dénomination entreprise assignée: " + req.denominationEntreprise.trim());
            } else {
                p.setDenominationEntreprise("Entreprise");
                System.out.println("⚠️ [PersonService] Dénomination entreprise null/vide, utilisation de 'Entreprise' par défaut");
            }
            
        } else {
            System.out.println("👤 [PersonService] Personne physique détectée - pas de traitement des champs personnes morales");
            // Pour les personnes physiques, s'assurer que les champs sont null
            p.setPaysEmissionRccm(null);
            p.setDenominationEntreprise(null);
        }
        
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

        // Unicité email/téléphone si modifiés (exclure la personne en cours de mise à jour)
        // Nettoyer l'email existant s'il ressemble à un numéro de téléphone
        if (p.getEmail() != null && (p.getEmail().startsWith("+") || p.getEmail().matches("^[\\d\\s\\-\\.]+$"))) {
            System.out.println("🔍 [PersonService.update] Nettoyage email invalide: " + p.getEmail() + " -> null");
            p.setEmail(null);
        }
        
        if (req.email != null && !req.email.isBlank() && !req.email.equalsIgnoreCase(p.getEmail())) {
            // Vérifier que l'email n'est pas un numéro de téléphone
            if (req.email.startsWith("+") || req.email.matches("^[\\d\\s\\-\\.]+$")) {
                System.out.println("🔍 [PersonService.update] Email rejeté car ressemble à un numéro de téléphone: " + req.email);
                // Ne pas mettre à jour l'email, le laisser null
            } else {
                if (personsRepository.existsByEmailAndIdNot(req.email, id)) throw new BadRequestException(Messages.PERSON_EMAIL_DEJA_UTILISE);
                p.setEmail(req.email.trim());
            }
        }
        if (req.telephone1 != null && !req.telephone1.isBlank()) {
            String normalizedNewPhone = req.telephone1.trim().replaceAll("[\\s\\-\\.]", "");
            String normalizedCurrentPhone = p.getTelephone1() != null ? p.getTelephone1().trim().replaceAll("[\\s\\-\\.]", "") : "";
            
            System.out.println("🔍 [PersonService.update] ID personne: " + id);
            System.out.println("🔍 [PersonService.update] Téléphone actuel: " + normalizedCurrentPhone);
            System.out.println("🔍 [PersonService.update] Téléphone reçu: " + normalizedNewPhone);
            System.out.println("🔍 [PersonService.update] Téléphones identiques: " + normalizedNewPhone.equals(normalizedCurrentPhone));
            
            // Ne vérifier la duplication que si le téléphone change réellement
            if (!normalizedNewPhone.equals(normalizedCurrentPhone)) {
                if (!isValidInternationalPhone(normalizedNewPhone)) throw new BadRequestException(Messages.PERSON_TELEPHONE_INVALIDE);
                // Exclure la personne en cours de mise à jour de la vérification de duplication
                boolean existsElsewhere = personsRepository.existsByTelephone1AndIdNot(normalizedNewPhone, id);
                System.out.println("🔍 [PersonService.update] Téléphone existe ailleurs: " + existsElsewhere);
                if (existsElsewhere) throw new BadRequestException(Messages.PERSON_TEL_DEJA_UTILISE);
                p.setTelephone1(normalizedNewPhone);
            } else {
                System.out.println("🔍 [PersonService.update] Téléphone inchangé, pas de vérification de duplication");
            }
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

        // Porte
        if (req.porte != null) {
            p.setPorte(req.porte.isBlank() ? null : req.porte.trim());
            System.out.println("🔍 [PersonService UPDATE] Porte reçue: " + req.porte);
            System.out.println("🔍 [PersonService UPDATE] Porte assignée: " + (req.porte.isBlank() ? "NULL" : req.porte));
            System.out.println("🔍 [PersonService UPDATE] Porte dans l'entité: " + p.getPorte());
        } else {
            System.out.println("🔍 [PersonService UPDATE] Aucune porte reçue (req.porte est null)");
        }

        // Adresse libre
        if (req.adresseLibre != null) {
            p.setAdresseLibre(req.adresseLibre.isBlank() ? null : req.adresseLibre.trim());
            System.out.println("🔍 [PersonService UPDATE] Adresse libre reçue: " + req.adresseLibre);
            System.out.println("🔍 [PersonService UPDATE] Adresse libre assignée: " + (req.adresseLibre.isBlank() ? "NULL" : req.adresseLibre));
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
        // Cohérence sexe/civilité et âge - uniquement pour les personnes physiques
        Civilites effCiv = (req.civilite != null) ? req.civilite : p.getCivilite();
        boolean isPersonneMoraleUpdate = effCiv == Civilites.PERSONNE_MORALE || 
                                        (p.getDenominationEntreprise() != null && !p.getDenominationEntreprise().trim().isEmpty());
        
        if (!isPersonneMoraleUpdate) {
            // Validation sexe/civilité pour personnes physiques
            Sexes effSexe = (req.sexe != null) ? req.sexe : p.getSexe();
            if (effSexe == Sexes.MASCULIN) {
                if (effCiv != Civilites.MONSIEUR) {
                    throw new BadRequestException(Messages.PERSON_CIVILITE_INVALIDE_POUR_SEXE);
                }
            } else if (effSexe == Sexes.FEMININ) {
                if (!(effCiv == Civilites.MADAME || effCiv == Civilites.MADEMOISELLE)) {
                    throw new BadRequestException(Messages.PERSON_CIVILITE_INVALIDE_POUR_SEXE);
                }
            }
            
            // Calcul d'âge pour personnes physiques
            LocalDate naissanceUpd = p.getDateNaissance().toInstant().atZone(ZoneId.of("Africa/Bamako")).toLocalDate();
            int ageUpd = Period.between(naissanceUpd, LocalDate.now(ZoneId.of("Africa/Bamako"))).getYears();
            p.setEstAutoriser(ageUpd >= 18);
        } else {
            // Personnes morales toujours autorisées
            p.setEstAutoriser(true);
            System.out.println("🏢 [PersonService UPDATE] Personne morale - exemption des validations sexe/civilité et âge");
        }

        Persons saved = personsRepository.save(p);
        return toResponse(saved);
    }

    @Override
    public void delete(String id) {
        Persons p = personsRepository.findById(id).orElseThrow(() -> new NotFoundException("Personne introuvable"));
        personsRepository.delete(p);
    }

    @Override
    public PersonResponse findByTelephone(String telephone) {
        Persons p = personsRepository.findByTelephone1(telephone)
            .orElseThrow(() -> new NotFoundException("Personne introuvable avec ce numéro de téléphone"));
        return toResponse(p);
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
        r.porte = p.getPorte();
        // Champs spécifiques aux personnes morales
        r.paysEmissionRccm = p.getPaysEmissionRccm();
        r.denominationEntreprise = p.getDenominationEntreprise();
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
