package com.cae.visualizer.controller;

import com.cae.visualizer.model.SimulationPayload;
import com.cae.visualizer.model.SimulationResult;
import com.cae.visualizer.service.SimulationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SimulationController {

    private final SimulationService simulationService;

    @Autowired
    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping("/simulate")
    public SimulationResult simulateLoad(@RequestBody SimulationPayload payload) {
        return simulationService.simulate(payload);
    }
}
