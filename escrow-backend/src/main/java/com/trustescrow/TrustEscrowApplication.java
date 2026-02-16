package com.trustescrow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TrustEscrowApplication {
    public static void main(String[] args) {
        SpringApplication.run(TrustEscrowApplication.class, args);
    }
}
