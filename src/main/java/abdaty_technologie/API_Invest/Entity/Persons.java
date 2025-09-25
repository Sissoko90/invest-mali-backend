package abdaty_technologie.API_Invest.Entity;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import abdaty_technologie.API_Invest.Entity.Enum.Civilites;
import abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole;
import abdaty_technologie.API_Invest.Entity.Enum.Nationalites;
import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import abdaty_technologie.API_Invest.Entity.Enum.Sexes;
import abdaty_technologie.API_Invest.Entity.Enum.SituationMatrimoniales;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Persons extends BaseEntity {

    @Column(name="nom", nullable = false, length = 100)
    @NotEmpty
    private String nom; 
    
    @Column(name="prenom", nullable = false)
    @NotEmpty
    private String prenom; 
    
    @Column(name="email", nullable = true, unique = true)
    private String email;
    
    @Column(name="telephone1", nullable = false, unique = true)
    private String telephone1; 
    
    @Column(name="telephone2", nullable = true, unique = true)
    private String telephone2;

    @Column(name="date_naissance", nullable = true)
    private Date dateNaissance;
    
    @Column(name="lieu_naissance", nullable = true)
    private String lieuNaissance;

    @Column(name="localite", nullable = true, length = 255)
    private String localite;

    @Column(name="est_autoriser", nullable = true)
    private Boolean estAutoriser;

    @Column(name="nationalite", nullable = true)
    @Enumerated(EnumType.STRING) 
    private Nationalites nationalite;
    
    @Column(name="entreprise_role", nullable = true)

    @Enumerated(EnumType.STRING)
    private EntrepriseRole entrepriseRole;
    
    @Column(name = "antenne_agent", nullable = true)
    @Enumerated(EnumType.STRING)
    private AntenneAgents antenneAgent;
    
    @Column(name="sexe", nullable = true)
    @Enumerated(EnumType.STRING)
    private Sexes sexe;
    
    @Column(name="situation_matrimoniale", nullable = true)
    @Enumerated(EnumType.STRING)
    private SituationMatrimoniales situationMatrimoniale;
    
    @Column(name="civilite", nullable = true)
    @Enumerated(EnumType.STRING)
    private Civilites civilite;
    
    @Column(name="role", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Roles role;

    @ManyToOne(optional = true)
    @JoinColumn(name = "division_id")
    private Divisions division;

    @JsonIgnore
    @OneToMany(mappedBy = "personne", cascade = CascadeType.ALL) 
    private List<Documents> documents = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "personne", cascade = CascadeType.ALL) 
    private List<Paiement> paiements = new ArrayList<>();

    @JsonIgnore
    @OneToOne(mappedBy = "personne", cascade = CascadeType.ALL) 
    private Utilisateurs utilisateur;
    
    // Liens d'appartenance à des entreprises via la table de jointure
    @OneToMany(mappedBy = "personne", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EntrepriseMembre> entreprises = new ArrayList<>();

}

