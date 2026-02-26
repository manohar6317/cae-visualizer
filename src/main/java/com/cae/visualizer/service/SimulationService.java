package com.cae.visualizer.service;

import com.cae.visualizer.model.SimulationPayload;
import com.cae.visualizer.model.SimulationResult;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SimulationService {

    private static final double GRAVITY = 9.81;

    public SimulationResult simulate(SimulationPayload payload) {
        double length = payload.getLength();
        double width = payload.getWidth();
        double height = payload.getHeight();
        double loadInKg = payload.getLoadInKg();
        double yieldStrength = payload.getMaterialYieldStrength();

        // Convert load mass to force (Newtons)
        double loadForce = loadInKg * GRAVITY;

        // Max Bending Moment (M) for simply supported beam with center point load: (Load * Length) / 4
        double maxBendingMoment = (loadForce * length) / 4.0;

        // Section Modulus (Z): (Width * Height^2) / 6
        double sectionModulus = (width * Math.pow(height, 2)) / 6.0;

        // Max Stress: M / Z
        double maxStress = maxBendingMoment / sectionModulus;

        // Determine if safe
        boolean isSafe = maxStress <= yieldStrength;

        // Calculate stress distribution along the beam (simplified linear mapping)
        // For a simply supported beam with a center point load, the bending moment
        // (and thus the stress) increases linearly from 0 at the supports to Max at the center.
        List<Double> distribution = new ArrayList<>();
        int segments = 100; // Generate 100 points along the beam
        for (int i = 0; i <= segments; i++) {
            double positionRatio = (double) i / segments; // 0.0 to 1.0 along the length
            double stressAtPoint;
            if (positionRatio <= 0.5) {
                // Left half: increases linearly from 0 to maxStress
                stressAtPoint = maxStress * (positionRatio / 0.5);
            } else {
                // Right half: decreases linearly from maxStress to 0
                stressAtPoint = maxStress * ((1.0 - positionRatio) / 0.5);
            }
            distribution.add(stressAtPoint);
        }

        return new SimulationResult(maxStress, isSafe, distribution);
    }
}
