package abdaty_technologie.API_Invest.Entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.Getter;
import lombok.Setter;

@MappedSuperclass
@Getter
@Setter
public abstract class BaseEntity {
  @Id @GeneratedValue(strategy = GenerationType.UUID)
  private String id;

  @Column(name = "created_at", nullable=false, updatable=false) 
  private Instant creation;

  @Column(name = "updated_at", nullable=false) 
  private Instant modification;

  @PrePersist
  protected void onCreate() {

    Instant now = Instant.now();
    if (this.creation == null) {
      this.creation = now;
    }
    if (this.modification == null) {
      this.modification = now;
    }

  }

  @PreUpdate
  protected void onUpdate() {


    this.modification = Instant.now();

  }
}
