package com.chidibank.core;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
@org.springframework.scheduling.annotation.EnableAsync
public class BankingCoreJavaApplication {

	public static void main(String[] args) {
		String profiles = System.getenv("SPRING_PROFILES_ACTIVE");
		if (profiles == null || !profiles.contains("prod")) {
			Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
			dotenv.entries().forEach(entry -> {
				if (System.getProperty(entry.getKey()) == null) {
					System.setProperty(entry.getKey(), entry.getValue());
				}
			});
		}
		SpringApplication.run(BankingCoreJavaApplication.class, args);
	}

}
