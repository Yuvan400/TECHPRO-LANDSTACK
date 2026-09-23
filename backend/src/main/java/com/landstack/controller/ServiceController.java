package com.landstack.controller;

import com.landstack.dto.ServiceDTO;
import com.landstack.service.GovernmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final GovernmentService governmentService;

    @GetMapping
    public ResponseEntity<List<ServiceDTO>> getActiveServices() {
        return ResponseEntity.ok(governmentService.getAllActiveServices());
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ServiceDTO>> getAllServicesAdmin() {
        return ResponseEntity.ok(governmentService.getAllServicesAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceDTO> getServiceById(@PathVariable Long id) {
        return ResponseEntity.ok(governmentService.getServiceById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServiceDTO> createService(@Valid @RequestBody ServiceDTO dto) {
        return new ResponseEntity<>(governmentService.createService(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ServiceDTO> updateService(@PathVariable Long id, @Valid @RequestBody ServiceDTO dto) {
        return ResponseEntity.ok(governmentService.updateService(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        governmentService.deleteService(id);
        return ResponseEntity.noContent().build();
    }
}
