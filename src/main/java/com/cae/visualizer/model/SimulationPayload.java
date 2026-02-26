package com.cae.visualizer.model;

public class SimulationPayload {

    private double length;
    private double width;
    private double height;
    private double loadInKg;
    private double materialYieldStrength;

    public SimulationPayload() {
    }

    public double getLength() {
        return length;
    }

    public void setLength(double length) {
        this.length = length;
    }

    public double getWidth() {
        return width;
    }

    public void setWidth(double width) {
        this.width = width;
    }

    public double getHeight() {
        return height;
    }

    public void setHeight(double height) {
        this.height = height;
    }

    public double getLoadInKg() {
        return loadInKg;
    }

    public void setLoadInKg(double loadInKg) {
        this.loadInKg = loadInKg;
    }

    public double getMaterialYieldStrength() {
        return materialYieldStrength;
    }

    public void setMaterialYieldStrength(double materialYieldStrength) {
        this.materialYieldStrength = materialYieldStrength;
    }
}
