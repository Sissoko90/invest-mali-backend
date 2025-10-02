package abdaty_technologie.API_Invest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ApiInvestApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiInvestApplication.class, args);
	}

}
