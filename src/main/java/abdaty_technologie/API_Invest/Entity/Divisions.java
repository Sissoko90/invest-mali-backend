package abdaty_technologie.API_Invest.Entity;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import abdaty_technologie.API_Invest.Entity.Enum.DivisionType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
@Entity
public class Divisions extends BaseEntity {

  @Column(name="code", nullable = false, unique = true)
  private String code; 
  
  @Column(name="nom", nullable = false)
  private String nom;

  @Column(name="type_division", nullable = false, length = 20)
  @Enumerated(EnumType.STRING) 
  private DivisionType divisionType;

  // Relation hiérarchique parent-enfant
  @ManyToOne(optional = true)
  @JoinColumn(name = "parent_id")
  private Divisions parent;

  @JsonIgnore
  @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
  private List<Divisions> enfants = new ArrayList<>();

  @JsonIgnore
  @OneToMany(mappedBy = "division", cascade = CascadeType.ALL) 
  private List<Persons> personne = new ArrayList<>();

  @JsonIgnore
  @OneToMany(mappedBy = "division", cascade = CascadeType.ALL) 
  private List<Entreprise> entreprise = new ArrayList<>();
  
  // Getters and Setters
  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }
  
  public String getNom() { return nom; }
  public void setNom(String nom) { this.nom = nom; }
  
  public DivisionType getDivisionType() { return divisionType; }
  public void setDivisionType(DivisionType divisionType) { this.divisionType = divisionType; }
  
  public Divisions getParent() { return parent; }
  public void setParent(Divisions parent) { this.parent = parent; }
  
  public List<Divisions> getEnfants() { return enfants; }
  public void setEnfants(List<Divisions> enfants) { this.enfants = enfants; }
  
  public List<Persons> getPersonne() { return personne; }
  public void setPersonne(List<Persons> personne) { this.personne = personne; }
  
  public List<Entreprise> getEntreprise() { return entreprise; }
  public void setEntreprise(List<Entreprise> entreprise) { this.entreprise = entreprise; }
}
