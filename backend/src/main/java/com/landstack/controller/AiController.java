package com.landstack.controller;

import com.landstack.dto.AiRiskScoreDTO;
import com.landstack.dto.AiSearchResponseDTO;
import com.landstack.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @GetMapping("/parcel-risk/{ulpin}")
    public ResponseEntity<AiRiskScoreDTO> getParcelRiskScore(@PathVariable String ulpin) {
        return ResponseEntity.ok(aiService.computeParcelRisk(ulpin));
    }

    @PostMapping("/nl-search")
    public ResponseEntity<AiSearchResponseDTO> naturalLanguageSearch(@RequestBody Map<String, String> body) {
        String query = body.getOrDefault("query", "");
        return ResponseEntity.ok(aiService.processNaturalLanguageSearch(query));
    }
}
