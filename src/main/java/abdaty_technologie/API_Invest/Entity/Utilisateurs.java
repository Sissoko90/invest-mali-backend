package abdaty_technologie.API_Invest.Entity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Utilisateurs extends BaseEntity {
    
  @Column(name="utilisateur", nullable = false, unique = true)
  private String utilisateur; 
  
 
  @Column(name="motdepasse", nullable = false)
  private String motdepasse;
  
  @OneToOne(optional = false)
  @JoinColumn(name = "personne_id")
  private Persons personne;
}

