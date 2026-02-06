package abdaty_technologie.API_Invest.Entity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
@Entity
public class Utilisateurs extends BaseEntity {
    
  @Column(name="utilisateur", nullable = false, unique = true)
  private String utilisateur; 
  
  @Column(name="motdepasse", nullable = false)
  private String motdepasse;
  
  @OneToOne(optional = false)
  @JoinColumn(name = "personne_id")
  private Persons personne;
  
  @Column(name="est_actif", nullable = false)
  private Boolean estActif = true;
  
  // Getters and Setters
  public String getUtilisateur() { return utilisateur; }
  public void setUtilisateur(String utilisateur) { this.utilisateur = utilisateur; }
  
  public String getMotdepasse() { return motdepasse; }
  public void setMotdepasse(String motdepasse) { this.motdepasse = motdepasse; }
  
  public String getMotDePasse() { return motdepasse; }
  public void setMotDePasse(String motDePasse) { this.motdepasse = motDePasse; }
  
  public Persons getPersonne() { return personne; }
  public void setPersonne(Persons personne) { this.personne = personne; }
  
  public Boolean getEstActif() { return estActif; }
  public void setEstActif(Boolean estActif) { this.estActif = estActif; }
}

