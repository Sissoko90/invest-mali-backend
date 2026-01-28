package abdaty_technologie.API_Invest.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class ReferenceSequence {

    @Id
    @Column(name = "`year`", nullable = false)
    private Integer year;

    @Column(name = "last_number", nullable = false)
    private Integer lastNumber;

    @Version
    private Long version;
}
