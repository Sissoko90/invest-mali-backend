package abdaty_technologie.API_Invest.service.impl;

import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.util.Optional;
import java.util.List;
import java.util.ArrayList;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import abdaty_technologie.API_Invest.Entity.Divisions;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.EntrepriseMembre;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.Entity.ReferenceSequence;
import abdaty_technologie.API_Invest.dto.request.EntrepriseRequest;
import abdaty_technologie.API_Invest.dto.request.BanEntrepriseRequest;
import abdaty_technologie.API_Invest.dto.request.UpdateEntrepriseRequest;
import abdaty_technologie.API_Invest.dto.request.ParticipantRequest;
import abdaty_technologie.API_Invest.constants.Messages;
import abdaty_technologie.API_Invest.exception.BadRequestException;
import abdaty_technologie.API_Invest.exception.NotFoundException;
import abdaty_technologie.API_Invest.repository.DivisionsRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseMembreRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.repository.ReferenceSequenceRepository;
import abdaty_technologie.API_Invest.service.EntrepriseService;
import abdaty_technologie.API_Invest.service.EmailService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole;
import abdaty_technologie.API_Invest.Entity.Enum.EtapeValidation;

/**
 * Service d'application pour la gestion des entreprises.
 *
 * Responsabilités principales:
 * - Valider les données métiers de création
 * - Générer la référence serveur (CE-YYYY-MM-DD-#####) avec remise à zéro annuelle
 * - Résoudre la localisation (Division) via son code et l'associer à l'entreprise
 */
@Service
@Transactional
public class EntrepriseServiceImpl implements EntrepriseService {

    private static final String DEFAULT_DIVISION_CODE = "DEFAULT";

    @Autowired
    private EntrepriseRepository entrepriseRepository;

    @Autowired
    private DivisionsRepository divisionsRepository;

    @Autowired
    private ReferenceSequenceRepository referenceSequenceRepository;

    @Autowired
    private PersonsRepository personsRepository;

    @Autowired
    private EntrepriseMembreRepository entrepriseMembreRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Crée une entreprise à partir d'une requête validée.
     * - Vérifie l'unicité de {nom, sigle}
     * - Résout la Division par son code
     * - Génère la référence côté serveur (nomenclature)
     */
    @Override
    public Entreprise createEntreprise(EntrepriseRequest req) {
        // Vérification de la validité de la requête
        if (req == null) throw new BadRequestException(Messages.REQ_INVALIDE);
        if (req.nom == null || req.nom.isBlank()) throw new BadRequestException(Messages.NOM_OBLIGATOIRE);
        if (req.sigle == null || req.sigle.isBlank()) throw new BadRequestException(Messages.SIGLE_OBLIGATOIRE);
        if (req.typeEntreprise == null) throw new BadRequestException(Messages.TYPE_ENTREPRISE_OBLIGATOIRE);
        if (req.statutCreation == null) throw new BadRequestException(Messages.STATUT_CREATION_OBLIGATOIRE);
        if (req.etapeValidation == null) throw new BadRequestException(Messages.ETAPE_VALIDATION_OBLIGATOIRE);
        if (req.formeJuridique == null) throw new BadRequestException(Messages.FORME_JURIDIQUE_OBLIGATOIRE);
        if (req.domaineActivite == null) throw new BadRequestException(Messages.DOMAINE_ACTIVITE_OBLIGATOIRE);
        if (req.divisionCode == null || req.divisionCode.isBlank()) throw new BadRequestException(Messages.DIVISION_CODE_OBLIGATOIRE);
        if (req.participants == null || req.participants.isEmpty()) throw new BadRequestException(Messages.PARTICIPANTS_OBLIGATOIRES);

        // Vérification de l'unicité du nom et du sigle
        if (entrepriseRepository.existsByNom(req.nom)) {
            throw new BadRequestException(Messages.ENTREPRISE_NOM_EXISTE);
        }
        if (entrepriseRepository.existsBySigle(req.sigle)) {
            throw new BadRequestException(Messages.ENTREPRISE_SIGLE_EXISTE);
        }

        // Résoudre la division par son code. Si absente: 404 métier.
        String targetDivisionCode = (req.divisionCode != null && !req.divisionCode.isBlank()) ? req.divisionCode.trim() : DEFAULT_DIVISION_CODE;
        Optional<Divisions> divisionOpt = divisionsRepository.findByCode(targetDivisionCode);
        Divisions division = divisionOpt.orElseThrow(() -> new NotFoundException(
            Messages.divisionIntrouvable(targetDivisionCode)));

        // Valider participants (rôles/dates/parts/âge/autorisation)
        validateParticipants(req);

        // Générer la référence unique selon la nomenclature.
        String generatedReference = generateReference();

        // Instancier et remplir l'entité persistée.
        Entreprise e = new Entreprise();
        e.setReference(generatedReference);
        e.setNom(req.nom.trim());
        e.setSigle(req.sigle.trim());

        e.setAdresseDifferentIdentite(Boolean.TRUE.equals(req.adresseDifferentIdentite));
        e.setExtraitJudiciaire(Boolean.TRUE.equals(req.extraitJudiciaire));
        e.setAutorisationGerant(Boolean.TRUE.equals(req.autorisationGerant));
        e.setAutorisationExercice(Boolean.TRUE.equals(req.autorisationExercice));
        e.setImportExport(Boolean.TRUE.equals(req.importExport));
        e.setStatutSociete(Boolean.TRUE.equals(req.statutSociete));

        e.setTypeEntreprise(req.typeEntreprise);
        e.setStatutCreation(req.statutCreation);
        e.setEtapeValidation(req.etapeValidation);
        e.setFormeJuridique(req.formeJuridique);
        e.setDomaineActivite(req.domaineActivite);

        e.setDivision(division);

        // timestamps (en attendant Auditing)
        e.setCreation(Instant.now());
        e.setModification(Instant.now());

        Entreprise saved = entrepriseRepository.save(e);

        // Persister les membres
        List<EntrepriseMembre> membres = new ArrayList<>();
        for (ParticipantRequest p : req.participants) {
            Persons person = personsRepository.findById(p.personId)
                .orElseThrow(() -> new NotFoundException(Messages.personneIntrouvable(p.personId)));

            EntrepriseMembre m = new EntrepriseMembre();
            m.setEntreprise(saved);
            m.setPersonne(person);
            m.setRole(p.role);
            m.setPourcentageParts(p.pourcentageParts);
            m.setDateDebut(p.dateDebut);
            m.setDateFin(p.dateFin);
            membres.add(m);
        }
        entrepriseMembreRepository.saveAll(membres);

        // Notifications email après création: aux fondateurs
        try {
            var foundersEmails = membres.stream()
                .filter(m -> m.getRole() == EntrepriseRole.FONDATEUR)
                .map(m -> m.getPersonne() != null ? m.getPersonne().getEmail() : null)
                .filter(email -> email != null && !email.isBlank())
                .distinct()
                .toList();
            if (!foundersEmails.isEmpty()) {
                String subject = "[InvestMali] Création de votre entreprise - " + saved.getNom();
                String body = "Bonjour,\n\nNous avons le plaisir de vous informer que votre entreprise '" + saved.getNom() + "' a été créée dans notre système.\n" +
                              "Référence: " + saved.getReference() + "\n" +
                              "Statut de création: " + saved.getStatutCreation() + "\n" +
                              "Étape de validation: " + saved.getEtapeValidation() + "\n\n" +
                              "Notre équipe reste à votre disposition pour toute information complémentaire.\n\n" +
                              "Cordialement,\nL'équipe InvestMali";
                emailService.sendToMany(foundersEmails, subject, body);
            }
        } catch (Exception ignore) {
            // éviter d'échouer la création si email invalide/config manquante
        }

        return saved;
    }

    private void validateParticipants(EntrepriseRequest req) {
        // Un seul gérant, au moins un fondateur, parts = 100 (fondateurs + associés)
        long gerants = req.participants.stream().filter(p -> p.role == EntrepriseRole.GERANT).count();
        if (gerants != 1) throw new BadRequestException(Messages.UN_SEUL_GERANT_AUTORISE);

        boolean hasFondateur = req.participants.stream().anyMatch(p -> p.role == EntrepriseRole.FONDATEUR);
        if (!hasFondateur) throw new BadRequestException(Messages.AU_MOINS_UN_FONDATEUR);

        // dates valides et personnes éligibles
        for (ParticipantRequest p : req.participants) {
            if (p.dateDebut.isAfter(p.dateFin)) {
                throw new BadRequestException(Messages.datesInvalides(p.personId));
            }
            Persons person = personsRepository.findById(p.personId)
                .orElseThrow(() -> new NotFoundException(Messages.personneIntrouvable(p.personId)));
            // Autorisation explicite
            if (Boolean.FALSE.equals(person.getEstAutoriser())) {
                throw new BadRequestException(Messages.personneNonAutorisee(p.personId));
            }
            // Age >= 18
            if (person.getDateNaissance() == null) {
                throw new BadRequestException(Messages.personneMineure(p.personId));
            }
            
            // Utiliser la même timezone pour les deux dates pour éviter les décalages
            ZoneId bamakoZone = ZoneId.of("Africa/Bamako");
            LocalDate birth = person.getDateNaissance().toInstant().atZone(bamakoZone).toLocalDate();
            LocalDate today = LocalDate.now(bamakoZone);
            
            // Logs de débogage pour la validation d'entreprise
            System.out.println("[EntrepriseService] ========== VALIDATION ÂGE PARTICIPANT ==========");
            System.out.println("[EntrepriseService] PersonId: " + p.personId);
            System.out.println("[EntrepriseService] Date de naissance (DB): " + person.getDateNaissance());
            System.out.println("[EntrepriseService] Date de naissance (LocalDate): " + birth);
            System.out.println("[EntrepriseService] Date actuelle (Bamako): " + today);
            
            if (birth.isAfter(today)) {
                System.out.println("[EntrepriseService] ERREUR: Date de naissance dans le futur!");
                throw new BadRequestException(Messages.personneMineure(p.personId));
            }
            
            int years = Period.between(birth, today).getYears();
            System.out.println("[EntrepriseService] Âge calculé: " + years + " ans");
            System.out.println("[EntrepriseService] ================================================");
            
            if (years < 18) {
                System.out.println("[EntrepriseService] REJET: Personne mineure - âge: " + years + " ans");
                throw new BadRequestException(Messages.personneMineure(p.personId));
            } else {
                System.out.println("[EntrepriseService] ✅ ACCEPTÉ: Personne majeure - âge: " + years + " ans");
            }
        }

        // Somme des parts (fondateurs + associés) == 100
        BigDecimal total = req.participants.stream()
            .filter(p -> p.role == EntrepriseRole.FONDATEUR || p.role == EntrepriseRole.ASSOCIE)
            .map(p -> p.pourcentageParts)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (total == null) total = BigDecimal.ZERO;
        if (total.compareTo(new BigDecimal("100")) != 0) {
            throw new BadRequestException(Messages.sommePartsInvalide(total.toPlainString()));
        }
    }

    /**
     * Génère une référence unique au format CE-YYYY-MM-DD-#####.
     *
     * Implémentation:
     * - Persisté par année via ReferenceSequence (lastNumber)
     * - @Version (optimistic locking) sur l'entité permet d'éviter les doublons en concurrence
     */
    private String generateReference() {
        LocalDate today = LocalDate.now();
        int year = today.getYear();

        ReferenceSequence seq = referenceSequenceRepository.findById(year)
            .orElseGet(() -> {
                ReferenceSequence rs = new ReferenceSequence();
                rs.setYear(year);
                rs.setLastNumber(0);
                return rs;
            });

        int next = seq.getLastNumber() + 1;
        seq.setLastNumber(next);
        referenceSequenceRepository.save(seq);

        String counter = String.format("%05d", next);
        return String.format("CE-%04d-%02d-%02d-%s", year, today.getMonthValue(), today.getDayOfMonth(), counter);
    }

    @Override
    public Page<Entreprise> listEntreprises(Pageable pageable) {
        return entrepriseRepository.findAll(pageable);
    }

    @Override
    public Page<Entreprise> listEntreprises(String divisionCode, Pageable pageable) {
        if (divisionCode == null || divisionCode.isBlank()) {
            return entrepriseRepository.findAll(pageable);
        }
        return entrepriseRepository.findByDivision_Code(divisionCode.trim(), pageable);
    }
    @Override
    public Entreprise ban(String id, BanEntrepriseRequest request) {
        Entreprise e = entrepriseRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(Messages.ENTREPRISE_INTROUVABLE));
        if (Boolean.TRUE.equals(e.getBanni())) {
            throw new BadRequestException("L'entreprise est déjà bannie");
        }
        if (request == null || request.motif == null || request.motif.isBlank()) {
            throw new BadRequestException("Le motif de bannissement est obligatoire");
        }
        e.setBanni(true);
        e.setMotifBannissement(request.motif.trim());
        e.setDateBannissement(Instant.now());
        e.setModification(Instant.now());
        Entreprise updated = entrepriseRepository.save(e);

        // Email professionnel aux fondateurs avec le motif de bannissement
        try {
            var foundersEmails = entrepriseMembreRepository.findByEntreprise_IdAndRole(updated.getId(), EntrepriseRole.FONDATEUR)
                .stream()
                .map(m -> m.getPersonne() != null ? m.getPersonne().getEmail() : null)
                .filter(email -> email != null && !email.isBlank())
                .distinct()
                .toList();
            if (!foundersEmails.isEmpty()) {
                String subject = "[InvestMali] Suspension du compte entreprise - " + updated.getNom();
                String body = "Bonjour,\n\nNous vous informons que le compte de votre entreprise '" + updated.getNom() + "' a été temporairement suspendu.\n" +
                              "Référence: " + updated.getReference() + "\n" +
                              "Motif: " + updated.getMotifBannissement() + "\n\n" +
                              "Pour toute précision ou régularisation, veuillez contacter le service support.\n\n" +
                              "Cordialement,\nL'équipe InvestMali";
                emailService.sendToMany(foundersEmails, subject, body);
            }
        } catch (Exception ignore) {}

        return updated;
    }

    @Override
    public Entreprise unban(String id) {
        Entreprise e = entrepriseRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(Messages.ENTREPRISE_INTROUVABLE));
        if (!Boolean.TRUE.equals(e.getBanni())) {
            return e; // rien à faire
        }
        e.setBanni(false);
        e.setMotifBannissement(null);
        e.setDateBannissement(null);
        e.setModification(Instant.now());
        return entrepriseRepository.save(e);
    }

    @Override
    public Page<Entreprise> listBanned(Pageable pageable) {
        return entrepriseRepository.findByBanniTrue(pageable);
    }

    @Override
    public Entreprise updateEntreprise(String id, UpdateEntrepriseRequest req) {
        Entreprise e = entrepriseRepository.findById(id)
            .orElseThrow(() -> new NotFoundException(Messages.ENTREPRISE_INTROUVABLE));

        if (req == null) return e;

        var oldStatus = e.getStatutCreation();
        var oldEtape = e.getEtapeValidation();

        // Unicité si nom/sigle changent
        if (req.nom != null && !req.nom.isBlank() && !req.nom.equals(e.getNom())) {
            if (entrepriseRepository.existsByNom(req.nom)) {
                throw new BadRequestException(Messages.ENTREPRISE_NOM_EXISTE);
            }
            e.setNom(req.nom.trim());
        }
        if (req.sigle != null && !req.sigle.isBlank() && !req.sigle.equals(e.getSigle())) {
            if (entrepriseRepository.existsBySigle(req.sigle)) {
                throw new BadRequestException(Messages.ENTREPRISE_SIGLE_EXISTE);
            }
            e.setSigle(req.sigle.trim());
        }

        if (req.adresseDifferentIdentite != null) e.setAdresseDifferentIdentite(req.adresseDifferentIdentite);
        if (req.extraitJudiciaire != null) e.setExtraitJudiciaire(req.extraitJudiciaire);
        if (req.autorisationGerant != null) e.setAutorisationGerant(req.autorisationGerant);
        if (req.autorisationExercice != null) e.setAutorisationExercice(req.autorisationExercice);
        if (req.importExport != null) e.setImportExport(req.importExport);
        if (req.statutSociete != null) e.setStatutSociete(req.statutSociete);

        if (req.typeEntreprise != null) e.setTypeEntreprise(req.typeEntreprise);
        if (req.statutCreation != null) e.setStatutCreation(req.statutCreation);
        if (req.etapeValidation != null) e.setEtapeValidation(req.etapeValidation);
        if (req.formeJuridique != null) e.setFormeJuridique(req.formeJuridique);
        if (req.domaineActivite != null) e.setDomaineActivite(req.domaineActivite);

        if (req.divisionCode != null && !req.divisionCode.isBlank()) {
            Divisions d = divisionsRepository.findByCode(req.divisionCode.trim())
                .orElseThrow(() -> new NotFoundException(Messages.divisionIntrouvable(req.divisionCode)));
            e.setDivision(d);
        }

        e.setModification(Instant.now());
        Entreprise updated = entrepriseRepository.save(e);

        // Calcul des changements de suivi
        boolean statusChanged = oldStatus != updated.getStatutCreation();
        boolean etapeChanged = oldEtape != updated.getEtapeValidation();

        // Email aux fondateurs: envoyer soit le suivi détaillé (si changement), soit un email générique
        try {
            var foundersEmails = entrepriseMembreRepository.findByEntreprise_IdAndRole(updated.getId(), EntrepriseRole.FONDATEUR)
                .stream()
                .map(m -> m.getPersonne() != null ? m.getPersonne().getEmail() : null)
                .filter(email -> email != null && !email.isBlank())
                .distinct()
                .toList();
            if (!foundersEmails.isEmpty()) {
                if (statusChanged || etapeChanged) {
                    String subject = "[InvestMali] Mise à jour de suivi - " + updated.getNom();
                    String body = "Bonjour,\n\nLe suivi de votre entreprise '" + updated.getNom() + "' a évolué.\n" +
                                  (statusChanged ? ("Statut de création: " + oldStatus + " -> " + updated.getStatutCreation() + "\n") : "") +
                                  (etapeChanged ? ("Étape de validation: " + oldEtape + " -> " + updated.getEtapeValidation() + "\n") : "") +
                                  "Référence: " + updated.getReference() + "\n\n" +
                                  "Cordialement,\nL'équipe InvestMali";
                    emailService.sendToMany(foundersEmails, subject, body);
                } else {
                    String subject = "[InvestMali] Mise à jour de votre entreprise - " + updated.getNom();
                    String body = "Bonjour,\n\nLes informations de votre entreprise '" + updated.getNom() + "' ont été mises à jour.\n" +
                                  "Référence: " + updated.getReference() + "\n" +
                                  "Statut de création: " + updated.getStatutCreation() + "\n" +
                                  "Étape de validation: " + updated.getEtapeValidation() + "\n\n" +
                                  "Cordialement,\nL'équipe InvestMali";
                    emailService.sendToMany(foundersEmails, subject, body);
                }
            }
        } catch (Exception ignore) {}

        // Email: si validée -> emails personnalisés à tous les membres (inclure rôle, pourcentage, date_debut)
        try {
            if (updated.getStatutCreation() == abdaty_technologie.API_Invest.Entity.Enum.StatutCreation.VALIDEE) {
                var formatter = DateTimeFormatter.ISO_LOCAL_DATE;
                var membres = entrepriseMembreRepository.findByEntreprise_Id(updated.getId());
                for (var m : membres) {
                    var person = m.getPersonne();
                    if (person == null || person.getEmail() == null || person.getEmail().isBlank()) continue;
                    String role = String.valueOf(m.getRole());
                    String parts = m.getPourcentageParts() != null ? m.getPourcentageParts().stripTrailingZeros().toPlainString() : "0";
                    String debut = m.getDateDebut() != null ? m.getDateDebut().format(formatter) : "";
                    String subject = "[InvestMali] Entreprise validée - " + updated.getNom();
                    String body = "Bonjour,\n\nL'entreprise '" + updated.getNom() + "' a été validée avec succès.\n" +
                                  "Référence: " + updated.getReference() + "\n" +
                                  "Votre rôle: " + role + "\n" +
                                  "Pourcentage de parts: " + parts + "%\n" +
                                  "Date de début: " + debut + "\n\n" +
                                  "Merci de votre confiance.\n\nCordialement,\nL'équipe InvestMali";
                    emailService.sendTo(person.getEmail(), subject, body);
                }
            }
        } catch (Exception ignore) {}

        return updated;
    }

    @Override
    public Entreprise assignToAgent(String entrepriseId, Utilisateurs agent) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
            .orElseThrow(() -> new NotFoundException(Messages.ENTREPRISE_INTROUVABLE));
        
        // Vérifier que l'agent a le bon rôle pour cette étape
        if (!canAgentHandleStep(agent, entreprise.getEtapeValidation())) {
            throw new BadRequestException("L'agent n'a pas les permissions pour traiter cette étape");
        }
        
        entreprise.setAssignedTo(agent);
        entreprise.setModification(Instant.now());
        return entrepriseRepository.save(entreprise);
    }

    @Override
    public Entreprise unassignFromAgent(String entrepriseId) {
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
            .orElseThrow(() -> new NotFoundException(Messages.ENTREPRISE_INTROUVABLE));
        
        entreprise.setAssignedTo(null);
        entreprise.setModification(Instant.now());
        return entrepriseRepository.save(entreprise);
    }

    @Override
    public Page<Entreprise> getAssignedToAgent(String agentId, Pageable pageable) {
        return entrepriseRepository.findByAssignedToId(agentId, pageable);
    }

    @Override
    public Page<Entreprise> getUnassignedForStep(EtapeValidation etape, Pageable pageable) {
        return entrepriseRepository.findByEtapeValidationAndAssignedToIsNull(etape, pageable);
    }

    private boolean canAgentHandleStep(Utilisateurs agent, EtapeValidation etape) {
        // Vérifier les rôles selon l'étape
        if (agent.getPersonne() == null || agent.getPersonne().getRole() == null) {
            System.out.println("🚫 [ASSIGN] Agent sans personne ou rôle: " + agent.getId());
            return false;
        }
        
        String roleName = agent.getPersonne().getRole().name();
        System.out.println("🔍 [ASSIGN] Agent: " + agent.getId() + ", Rôle: " + roleName + ", Étape: " + etape);
        
        switch (etape) {
            case ACCUEIL:
                return roleName.equals("AGENT_ACCEUIL") || roleName.equals("SUPER_ADMIN");
            case REGISSEUR:
                return roleName.equals("AGENT_REGISTER");
            case REVISION:
                return roleName.equals("AGENT_REVISION");
            case IMPOTS:
                return roleName.equals("AGENT_IMPOT");
            case RCCM1:
                return roleName.equals("AGENT_RCCM1");
            case RCCM2:
                return roleName.equals("AGENT_RCCM2");
            case NINA:
                return roleName.equals("AGENT_NINA");
            case RETRAIT:
                return roleName.equals("AGENT_RETRAIT");
            default:
                return false;
        }
    }

// ... (rest of the code remains the same)
}
