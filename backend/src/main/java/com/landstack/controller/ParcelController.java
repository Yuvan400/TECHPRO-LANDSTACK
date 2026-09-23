package com.landstack.controller;

import com.landstack.dto.ParcelDTO;
import com.landstack.service.ParcelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parcels")
@RequiredArgsConstructor
public class ParcelController {

    private final ParcelService parcelService;

    @GetMapping
    public ResponseEntity<List<ParcelDTO>> getAllParcels() {
        return ResponseEntity.ok(parcelService.getAllParcels());
    }

    @GetMapping("/{ulpin}")
    public ResponseEntity<ParcelDTO> getParcelByUlpin(@PathVariable String ulpin) {
        return ResponseEntity.ok(parcelService.getParcelByUlpin(ulpin));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ParcelDTO>> searchParcels(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(parcelService.searchParcels(q));
    }
}
