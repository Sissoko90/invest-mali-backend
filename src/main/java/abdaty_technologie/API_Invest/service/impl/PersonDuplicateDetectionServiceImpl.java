package abdaty_technologie.API_Invest.service.impl;

import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.dto.response.DuplicateCheckResult;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.service.PersonDuplicateDetectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PersonDuplicateDetectionServiceImpl implements PersonDuplicateDetectionService {

    @Autowired
    private PersonsRepository personsRepository;

    private static final double NAME_SIMILARITY_THRESHOLD = 0.70;
    private static final double HIGH_SIMILARITY_THRESHOLD = 0.85;
    private static final double CRITICAL_CONFLICT_THRESHOLD = 0.50;

    @Override
    public DuplicateCheckResult checkForDuplicates(String email, String telephone1, String nom, String prenom) {
        DuplicateCheckResult result = new DuplicateCheckResult();
        result.setExists(false);
        result.setHasUserAccount(false);
        result.setNameConflict(false);

        Optional<Persons> existingPerson = findExistingPerson(email, telephone1);

        if (existingPerson.isPresent()) {
            Persons person = existingPerson.get();
            result.setExists(true);
            result.setPersonId(person.getId());
            result.setExistingNom(person.getNom());
            result.setExistingPrenom(person.getPrenom());
            result.setExistingEmail(person.getEmail());
            result.setExistingTelephone(person.getTelephone1());
            result.setHasUserAccount(person.getUtilisateur() != null);

            double similarityScore = calculateNameSimilarity(
                person.getNom(), 
                person.getPrenom(), 
                nom, 
                prenom
            );
            result.setNameSimilarityScore(similarityScore);

            if (similarityScore < CRITICAL_CONFLICT_THRESHOLD) {
                result.setNameConflict(true);
                result.setConflictResolutionRequired("BLOCKED_CONTACT_SUPPORT");
                result.setMessage(
                    String.format(
                        "⚠️ CONFLIT DÉTECTÉ: Un compte existe déjà avec ce numéro de téléphone (%s) " +
                        "mais avec un nom différent (%s %s). " +
                        "Pour des raisons de sécurité, vous ne pouvez pas créer de compte en ligne. " +
                        "Veuillez vous rendre dans une agence avec votre pièce d'identité pour régulariser votre situation, " +
                        "ou contactez le support si vous pensez qu'il s'agit d'une erreur.",
                        maskPhoneNumber(person.getTelephone1()),
                        person.getPrenom(),
                        person.getNom()
                    )
                );
                System.err.println(String.format(
                    "🚨 [CRITICAL CONFLICT BLOCKED] Similarité très faible (%.2f) entre '%s %s' et '%s %s' avec même téléphone %s - Inscription bloquée",
                    similarityScore, person.getPrenom(), person.getNom(), prenom, nom, person.getTelephone1()
                ));
            } else if (similarityScore < NAME_SIMILARITY_THRESHOLD) {
                result.setNameConflict(true);
                result.setConflictResolutionRequired("CONFIRM_AND_UPDATE");
                result.setMessage(
                    String.format(
                        "Un compte existe avec ce numéro (%s) au nom de '%s %s'. " +
                        "Si c'est bien vous et que vos informations ont changé, " +
                        "confirmez pour mettre à jour votre profil. " +
                        "Sinon, veuillez vérifier votre numéro de téléphone.",
                        maskPhoneNumber(person.getTelephone1()),
                        person.getPrenom(),
                        person.getNom()
                    )
                );
            } else if (similarityScore < HIGH_SIMILARITY_THRESHOLD) {
                result.setNameConflict(false);
                result.setConflictResolutionRequired("AUTO_MERGE_WITH_UPDATE");
                result.setMessage(
                    String.format(
                        "Un compte existe avec ce numéro. Les informations seront mises à jour " +
                        "de '%s %s' vers '%s %s'.",
                        person.getPrenom(),
                        person.getNom(),
                        prenom,
                        nom
                    )
                );
            } else {
                result.setNameConflict(false);
                result.setConflictResolutionRequired("AUTO_MERGE");
                result.setMessage("Compte existant trouvé. Connexion automatique.");
            }

            if (result.isHasUserAccount()) {
                result.setConflictResolutionRequired("ACCOUNT_EXISTS");
                result.setMessage(
                    "Un compte utilisateur existe déjà avec ces informations. " +
                    "Veuillez vous connecter ou réinitialiser votre mot de passe."
                );
            }
        } else {
            result.setMessage("Aucun compte existant. Nouvelle inscription.");
        }

        return result;
    }

    @Override
    public Optional<Persons> findExistingPerson(String email, String telephone1) {
        if (telephone1 != null && !telephone1.isBlank()) {
            String normalizedPhone = telephone1.replaceAll("\\s+", "").trim();
            System.out.println("🔍 [DUPLICATE CHECK] Téléphone original: '" + telephone1 + "' → normalisé: '" + normalizedPhone + "'");
            
            Optional<Persons> byPhone = personsRepository.findByTelephone1(normalizedPhone);
            if (byPhone.isPresent()) {
                System.out.println("🔍 [DUPLICATE] Personne trouvée par téléphone: " + normalizedPhone);
                return byPhone;
            }
            
            if (!normalizedPhone.equals(telephone1.trim())) {
                byPhone = personsRepository.findByTelephone1(telephone1.trim());
                if (byPhone.isPresent()) {
                    System.out.println("🔍 [DUPLICATE] Personne trouvée par téléphone (format original): " + telephone1);
                    return byPhone;
                }
            }
        }

        if (email != null && !email.isBlank()) {
            Optional<Persons> byEmail = personsRepository.findByEmail(email.trim());
            if (byEmail.isPresent()) {
                System.out.println("🔍 [DUPLICATE] Personne trouvée par email: " + email);
                return byEmail;
            }
        }

        return Optional.empty();
    }

    @Override
    public boolean areNamesSimilar(String name1, String name2) {
        if (name1 == null || name2 == null) return false;
        
        String n1 = normalizeString(name1);
        String n2 = normalizeString(name2);
        
        if (n1.equals(n2)) return true;
        
        int distance = calculateLevenshteinDistance(n1, n2);
        int maxLength = Math.max(n1.length(), n2.length());
        
        double similarity = 1.0 - ((double) distance / maxLength);
        return similarity >= NAME_SIMILARITY_THRESHOLD;
    }

    @Override
    public double calculateNameSimilarity(String nom1, String prenom1, String nom2, String prenom2) {
        if (nom1 == null || prenom1 == null || nom2 == null || prenom2 == null) {
            return 0.0;
        }

        String fullName1 = normalizeString(prenom1 + " " + nom1);
        String fullName2 = normalizeString(prenom2 + " " + nom2);

        if (fullName1.equals(fullName2)) {
            return 1.0;
        }

        double nomSimilarity = calculateStringSimilarity(normalizeString(nom1), normalizeString(nom2));
        double prenomSimilarity = calculateStringSimilarity(normalizeString(prenom1), normalizeString(prenom2));

        double weightedScore = (nomSimilarity * 0.6) + (prenomSimilarity * 0.4);

        if (normalizeString(nom1).contains(normalizeString(nom2)) || 
            normalizeString(nom2).contains(normalizeString(nom1))) {
            weightedScore = Math.max(weightedScore, 0.85);
        }

        System.out.println(String.format(
            "📊 [SIMILARITY] '%s %s' vs '%s %s' = %.2f (nom: %.2f, prenom: %.2f)",
            prenom1, nom1, prenom2, nom2, weightedScore, nomSimilarity, prenomSimilarity
        ));

        return weightedScore;
    }

    private double calculateStringSimilarity(String s1, String s2) {
        if (s1.equals(s2)) return 1.0;
        
        int distance = calculateLevenshteinDistance(s1, s2);
        int maxLength = Math.max(s1.length(), s2.length());
        
        if (maxLength == 0) return 1.0;
        
        return 1.0 - ((double) distance / maxLength);
    }

    @Override
    public int calculateLevenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(
                    Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                    dp[i - 1][j - 1] + cost
                );
            }
        }

        return dp[s1.length()][s2.length()];
    }

    private String normalizeString(String str) {
        if (str == null) return "";
        
        return str.toLowerCase()
            .trim()
            .replaceAll("\\s+", " ")
            .replaceAll("[àáâãäå]", "a")
            .replaceAll("[èéêë]", "e")
            .replaceAll("[ìíîï]", "i")
            .replaceAll("[òóôõö]", "o")
            .replaceAll("[ùúûü]", "u")
            .replaceAll("[ýÿ]", "y")
            .replaceAll("[ç]", "c")
            .replaceAll("[ñ]", "n");
    }

    private String maskPhoneNumber(String phone) {
        if (phone == null || phone.length() < 4) return "****";
        
        int visibleDigits = 4;
        int maskLength = phone.length() - visibleDigits;
        String masked = "*".repeat(maskLength) + phone.substring(maskLength);
        return masked;
    }
}
