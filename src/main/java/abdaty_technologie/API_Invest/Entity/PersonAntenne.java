package abdaty_technologie.API_Invest.Entity;

import abdaty_technologie.API_Invest.Entity.Enum.AntenneAgents;
import jakarta.persistence.*;
@Entity
@Table(name = "person_antennes")
public class PersonAntenne extends BaseEntity {
    
    @ManyToOne
    @JoinColumn(name = "person_id", nullable = false)
    private Persons person;
    
    @Column(name = "antenne", nullable = false)
    @Enumerated(EnumType.STRING)
    private AntenneAgents antenne;
    
    @Column(name = "actif", nullable = false)
    private Boolean actif = true;
    
    // Getters and Setters
    public Persons getPerson() { return person; }
    public void setPerson(Persons person) { this.person = person; }
    
    public AntenneAgents getAntenne() { return antenne; }
    public void setAntenne(AntenneAgents antenne) { this.antenne = antenne; }
    
    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
}
