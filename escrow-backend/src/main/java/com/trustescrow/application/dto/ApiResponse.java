package com.trustescrow.application.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ApiResponse<T> {
    private boolean ok;
    private T data;
    private String error;
    private ResponseMeta meta;
    
    @Data
    @Builder
    public static class ResponseMeta {
        private String ruleVersion;
        private String idempotencyKey;
        private List<String> actionsExecuted;
    }
    
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .ok(true)
            .data(data)
            .build();
    }
    
    public static <T> ApiResponse<T> success(T data, ResponseMeta meta) {
        return ApiResponse.<T>builder()
            .ok(true)
            .data(data)
            .meta(meta)
            .build();
    }
    
    public static <T> ApiResponse<T> error(String error) {
        return ApiResponse.<T>builder()
            .ok(false)
            .error(error)
            .build();
    }
}
