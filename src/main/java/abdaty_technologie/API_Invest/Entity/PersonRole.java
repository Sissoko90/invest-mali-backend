package abdaty_technologie.API_Invest.Entity;

import abdaty_technologie.API_Invest.Entity.Enum.Roles;
import jakarta.persistence.*;
@Entity
@Table(name = "person_roles")
public class PersonRole extends BaseEntity {
    
    @ManyToOne
    @JoinColumn(name = "person_id", nullable = false)
    private Persons person;
    
    @Column(name = "role", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Roles role;
    
    @Column(name = "actif", nullable = false)
    private Boolean actif = true;
    
    // Getters and Setters
    public Persons getPerson() { return person; }
    public void setPerson(Persons person) { this.person = person; }
    
    public Roles getRole() { return role; }
    public void setRole(Roles role) { this.role = role; }
    
    public Boolean getActif() { return actif; }
    public void setActif(Boolean actif) { this.actif = actif; }
}
