package abdaty_technologie.API_Invest.dto;

import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AgentCreationRequest {
    
    @NotBlank(message = "Le prénom est obligatoire")
    @Size(min = 2, max = 50, message = "Le prénom doit contenir entre 2 et 50 caractères")
    private String prenom;
    
    @NotBlank(message = "Le nom est obligatoire")
    @Size(min = 2, max = 50, message = "Le nom doit contenir entre 2 et 50 caractères")
    private String nom;
    
    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;
    
    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String motDePasse;
    
    @NotNull(message = "Le rôle est obligatoire")
    private Roles role;
    
    private AntenneAgents antenneAgent;
    
    @Size(max = 15, message = "Le numéro de téléphone ne peut pas dépasser 15 caractères")
    private String telephone;
    
    @Size(max = 200, message = "L'adresse ne peut pas dépasser 200 caractères")
    private String adresse;
    
    // Constructeurs
    public AgentCreationRequest() {}
    
    public AgentCreationRequest(String prenom, String nom, String email, String motDePasse, 
                               Roles role, AntenneAgents antenneAgent) {
        this.prenom = prenom;
        this.nom = nom;
        this.email = email;
        this.motDePasse = motDePasse;
        this.role = role;
        this.antenneAgent = antenneAgent;
    }
    
    // Getters et Setters
    public String getPrenom() {
        return prenom;
    }
    
    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }
    
    public String getNom() {
        return nom;
    }
    
    public void setNom(String nom) {
        this.nom = nom;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getMotDePasse() {
        return motDePasse;
    }
    
    public void setMotDePasse(String motDePasse) {
        this.motDePasse = motDePasse;
    }
    
    public Roles getRole() {
        return role;
    }
    
    public void setRole(Roles role) {
        this.role = role;
    }
    
    public AntenneAgents getAntenneAgent() {
        return antenneAgent;
    }
    
    public void setAntenneAgent(AntenneAgents antenneAgent) {
        this.antenneAgent = antenneAgent;
    }
    
    public String getTelephone() {
        return telephone;
    }
    
    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }
    
    public String getAdresse() {
        return adresse;
    }
    
    public void setAdresse(String adresse) {
        this.adresse = adresse;
    }
}
