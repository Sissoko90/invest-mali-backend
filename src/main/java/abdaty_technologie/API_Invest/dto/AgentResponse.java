package abdaty_technologie.API_Invest.dto;

import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import java.time.LocalDateTime;

public class AgentResponse {
    
    private String id;
    private String prenom;
    private String nom;
    private String email;
    private Roles role;
    private AntenneAgents antenneAgent;
    private String telephone;
    private String adresse;
    private Boolean actif;
    private LocalDateTime dateCreation;
    private LocalDateTime dateModification;
    
    // Constructeurs
    public AgentResponse() {}
    
    public AgentResponse(String id, String prenom, String nom, String email, 
                        Roles role, AntenneAgents antenneAgent, Boolean actif) {
        this.id = id;
        this.prenom = prenom;
        this.nom = nom;
        this.email = email;
        this.role = role;
        this.antenneAgent = antenneAgent;
        this.actif = actif;
    }
    
    // Getters et Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
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
    
    public LocalDateTime getDateCreation() {
        return dateCreation;
    }
    
    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
    
    public LocalDateTime getDateModification() {
        return dateModification;
    }
    
    public void setDateModification(LocalDateTime dateModification) {
        this.dateModification = dateModification;
    }
}
