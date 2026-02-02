package com.trustescrow.application.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

/**
 * Production guard to ensure datasource URL uses JDBC format.
 * This prevents runtime failures caused by non-jdbc URLs.
 */
@Configuration
@Profile("production")
@RequiredArgsConstructor
public class DatasourceUrlGuard {

    private final Environment environment;

    @PostConstruct
    public void validateDatasourceUrl() {
        String url = environment.getProperty("spring.datasource.url");
        if (url == null || url.isBlank()) {
            throw new IllegalStateException("Datasource URL is empty. Set SPRING_DATASOURCE_URL with jdbc: prefix.");
        }
        if (!url.startsWith("jdbc:")) {
            throw new IllegalStateException("Datasource URL must start with jdbc: (current=" + url + ")");
        }
    }
}
