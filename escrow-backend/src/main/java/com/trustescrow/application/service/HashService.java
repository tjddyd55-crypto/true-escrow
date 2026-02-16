package com.trustescrow.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Hash Service for Registry Extension.
 * Generates SHA-256 hashes for asset content.
 */
@Service
@Slf4j
public class HashService {
    
    private static final String ALGORITHM = "SHA-256";
    
    /**
     * Generate SHA-256 hash from byte array.
     * Returns hex string (64 characters).
     */
    public String generateHash(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance(ALGORITHM);
            byte[] hashBytes = digest.digest(content);
            return bytesToHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            log.error("SHA-256 algorithm not available", e);
            throw new IllegalStateException("Hash algorithm not available", e);
        }
    }
    
    /**
     * Generate SHA-256 hash from string.
     * Returns hex string (64 characters).
     */
    public String generateHash(String content) {
        return generateHash(content.getBytes(StandardCharsets.UTF_8));
    }
    
    /**
     * Convert byte array to hex string.
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(2 * bytes.length);
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
