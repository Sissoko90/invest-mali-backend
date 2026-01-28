package abdaty_technologie.API_Invest.dto;

import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class AgentUpdateRequest {
    
    @Size(min = 2, max = 50, message = "Le prénom doit contenir entre 2 et 50 caractères")
    private String prenom;
    
    @Size(min = 2, max = 50, message = "Le nom doit contenir entre 2 et 50 caractères")
    private String nom;
    
    @Email(message = "Format d'email invalide")
    private String email;
    
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String motDePasse;
    
    private Roles role;
    
    private AntenneAgents antenneAgent;
    
    @Size(max = 15, message = "Le numéro de téléphone ne peut pas dépasser 15 caractères")
    private String telephone;
    
    @Size(max = 200, message = "L'adresse ne peut pas dépasser 200 caractères")
    private String adresse;
    
    private Boolean actif;
    
    // Constructeurs
    public AgentUpdateRequest() {}
    
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
    
    public Boolean getActif() {
        return actif;
    }
    
    public void setActif(Boolean actif) {
        this.actif = actif;
    }
}
