package com.cae.visualizer.model;

import java.util.List;

public class SimulationResult {

    private double maxStress;
    private boolean isSafe;
    private List<Double> distribution;

    public SimulationResult() {
    }

    public SimulationResult(double maxStress, boolean isSafe, List<Double> distribution) {
        this.maxStress = maxStress;
        this.isSafe = isSafe;
        this.distribution = distribution;
    }

    public double getMaxStress() {
        return maxStress;
    }

    public void setMaxStress(double maxStress) {
        this.maxStress = maxStress;
    }

    public boolean isSafe() {
        return isSafe;
    }

    public void setSafe(boolean safe) {
        isSafe = safe;
    }

    public List<Double> getDistribution() {
        return distribution;
    }

    public void setDistribution(List<Double> distribution) {
        this.distribution = distribution;
    }
}
