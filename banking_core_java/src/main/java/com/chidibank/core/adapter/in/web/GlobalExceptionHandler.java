package com.chidibank.core.adapter.in.web;
import com.chidibank.core.application.exception.BusinessException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessExceptions(BusinessException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("status", ex.getStatus().value());
        body.put("code", ex.getCode());
        body.put("message", ex.getMessage());
        return new ResponseEntity<>(body, ex.getStatus());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .orElse("Invalid request payload");
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("code", "VALIDATION_ERROR");
        body.put("message", message);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("code", "VALIDATION_ERROR");
        body.put("message", ex.getMessage());
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NoResourceFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("code", "NOT_FOUND");
        body.put("error", "Not Found");
        body.put("message", "Đường dẫn không tồn tại: " + ex.getResourcePath());
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("code", "INTERNAL_ERROR");
        body.put("error", "Internal Server Error");
        body.put("message", "Internal server error");
        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("status", HttpStatus.UNAUTHORIZED.value());
        body.put("code", "AUTH_INVALID_CREDENTIALS");
        body.put("error", "Unauthorized");
        body.put("message", "Invalid email or password");
        
        return new ResponseEntity<>(body, HttpStatus.UNAUTHORIZED);
    }
}
