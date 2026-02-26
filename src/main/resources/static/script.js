document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('simulation-form');
    const simulateBtn = document.getElementById('simulate-btn');
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const resultsPanel = document.getElementById('results-panel');
    const resStatus = document.getElementById('res-status');
    const resStress = document.getElementById('res-stress');
    const canvas = document.getElementById('beam-canvas');
    const ctx = canvas.getContext('2d');

    // Handle canvas resize
    function resizeCanvas() {
        // Pixel ratio for sharp rendering on high DPI displays
        const ratio = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
        ctx.scale(ratio, ratio);

        // Initial drawing if no results yet
        if (!window.latestResult) {
            drawInitialSetup();
        } else {
            drawSimulation(window.latestResult);
        }
    }

    window.addEventListener('resize', resizeCanvas);
    // Initial setup
    setTimeout(resizeCanvas, 100);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI Loading state
        btnText.textContent = 'Simulating...';
        btnLoader.classList.remove('hidden');
        simulateBtn.disabled = true;

        const payload = {
            length: parseFloat(document.getElementById('length').value),
            width: parseFloat(document.getElementById('width').value),
            height: parseFloat(document.getElementById('height').value),
            loadInKg: parseFloat(document.getElementById('loadInKg').value),
            materialYieldStrength: parseFloat(document.getElementById('materialYieldStrength').value)
        };

        console.log("SENDING PAYLOAD:", payload);

        try {
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Simulation API failed');
            }

            const data = await response.json();

            console.log("RECEIVED RESPONSE:", data);

            // Artificial delay to show smooth loading state
            setTimeout(() => {
                updateUI(data, payload);
                window.latestResult = { data, payload };
                drawSimulation(window.latestResult);

                // Reset UI
                btnText.textContent = 'Run Simulation';
                btnLoader.classList.add('hidden');
                simulateBtn.disabled = false;
            }, 600);

        } catch (error) {
            console.error('Simulation error:', error);
            alert('Failed to run simulation. Check console for details.');
            btnText.textContent = 'Run Simulation';
            btnLoader.classList.add('hidden');
            simulateBtn.disabled = false;
        }
    });

    function updateUI(data, payload) {
        resultsPanel.classList.remove('hidden');

        // Max Stress in MPa
        const stressMPa = data.maxStress / 1e6;
        resStress.textContent = `${stressMPa.toFixed(2)} MPa`;

        if (data.safe) {
            resStatus.textContent = 'SAFE';
            resStatus.className = 'status-safe';
        } else {
            resStatus.textContent = 'CRITICAL FAILURE';
            resStatus.className = 'status-fail';
        }
    }

    function drawInitialSetup() {
        const rect = canvas.getBoundingClientRect();
        const cw = rect.width;
        const ch = rect.height;
        ctx.clearRect(0, 0, cw, ch);

        // Calculate visual dimensions
        const beamW = cw * 0.7; // 70% of canvas width
        const beamH = 40;
        const startX = (cw - beamW) / 2;
        const startY = ch / 2 - beamH / 2;

        // Draw blank beam
        ctx.fillStyle = '#334155'; // Neutral cool grey
        ctx.fillRect(startX, startY, beamW, beamH);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, startY, beamW, beamH);

        // Draw supports
        drawSupport(startX, startY + beamH);
        drawSupport(startX + beamW, startY + beamH);

        // Grid
        drawGrid(cw, ch);
    }

    function drawSimulation({ data, payload }) {
        const rect = canvas.getBoundingClientRect();
        const cw = rect.width;
        const ch = rect.height;
        ctx.clearRect(0, 0, cw, ch);

        drawGrid(cw, ch);

        // Make beam aspect ratio dynamic based on length and height
        const baseAspect = payload.length / payload.height;
        // Limit aspect ratio so it doesn't get ridiculously thin or thick (min 5:1, max 40:1)
        const displayAspect = Math.max(5, Math.min(baseAspect, 40));

        const beamW = cw * 0.8;
        const beamH = beamW / displayAspect;
        const startX = (cw - beamW) / 2;
        const startY = ch / 2 - beamH / 2;

        // Draw mapped beam with gradient representing stress distribution
        // For accurate representation, we iterate over the beam segments and draw
        const segLen = beamW / (data.distribution.length - 1);
        const maxStress = data.maxStress;
        const yieldStrength = payload.materialYieldStrength;

        for (let i = 0; i < data.distribution.length - 1; i++) {
            const stress = data.distribution[i];
            const nextStress = data.distribution[i + 1];

            // Map stress to color (Green matching 'safe' -> Red approaching yield/failure)
            // 0 -> Green, Yield -> Red
            const ratio1 = Math.min(stress / yieldStrength, 1);
            const ratio2 = Math.min(nextStress / yieldStrength, 1);

            const color1 = getColorForRatio(ratio1);
            const color2 = getColorForRatio(ratio2);

            const grd = ctx.createLinearGradient(startX + (i * segLen), startY, startX + ((i + 1) * segLen), startY);
            grd.addColorStop(0, color1);
            grd.addColorStop(1, color2);

            // Draw this segment
            ctx.fillStyle = grd;

            // Add subtle deflection to Y. Center point has max deflection.
            // Simplified parabolic deflection
            const def1 = getDeflection(i, data.distribution.length, ratio1);
            const def2 = getDeflection(i + 1, data.distribution.length, ratio2);

            ctx.beginPath();
            ctx.moveTo(startX + (i * segLen), startY + def1);
            ctx.lineTo(startX + ((i + 1) * segLen), startY + def2);
            ctx.lineTo(startX + ((i + 1) * segLen), startY + beamH + def2);
            ctx.lineTo(startX + (i * segLen), startY + beamH + def1);
            ctx.closePath();
            ctx.fill();
        }

        // Beam outline
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, startY, beamW, beamH);

        // Dimensions text
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`L = ${payload.length}m`, startX + beamW / 2, startY + beamH + 40);
        ctx.textAlign = 'right';
        ctx.fillText(`H = ${payload.height}m`, startX - 20, startY + beamH / 2 + 4);

        // Supports
        drawSupport(startX, startY + beamH);
        drawSupport(startX + beamW, startY + beamH);

        // Load Arrow
        // The max deflection is right in the center, so arrow should point there
        const centerDeflection = getDeflection(data.distribution.length / 2, data.distribution.length, Math.min(data.maxStress / yieldStrength, 1));
        drawLoadArrow(cw / 2, startY + centerDeflection - 20, payload.loadInKg);
    }

    function getDeflection(index, total, stressRatio) {
        // Parabola mapping max deflection factor of 20 pixels if approaching yield
        // stressRatio is 0 to 1
        const maxDeflectionPixel = 30 * stressRatio;
        // x is normalized from -1 to 1
        const x = (index / (total - 1)) * 2 - 1;
        // parabola y = 1 - x^2 (1 at center, 0 at edges)
        return maxDeflectionPixel * (1 - x * x);
    }

    function getColorForRatio(ratio) {
        // Green: hsl(142, 71%, 45%)
        // Yellow: hsl(45, 93%, 47%)
        // Red: hsl(0, 84%, 60%)

        let h;
        if (ratio < 0.5) {
            // green to yellow
            // h from 142 down to 45
            const subRatio = ratio / 0.5;
            h = 142 - (subRatio * (142 - 45));
        } else {
            // yellow to red
            // h from 45 down to 0
            const subRatio = (ratio - 0.5) / 0.5;
            h = 45 - (subRatio * 45);
        }

        return `hsl(${h}, 84%, 55%)`;
    }

    function drawSupport(x, y) {
        const size = 20;
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        // Triangle pointing up
        ctx.moveTo(x, y);
        ctx.lineTo(x - size / 2, y + size);
        ctx.lineTo(x + size / 2, y + size);
        ctx.closePath();
        ctx.fill();

        // ground line
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - size, y + size);
        ctx.lineTo(x + size, y + size);
        ctx.stroke();

        // Rollers (just minimal circles for style)
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(x - size / 2.5, y + size + 4, 3, 0, Math.PI * 2);
        ctx.arc(x + size / 2.5, y + size + 4, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawLoadArrow(x, tipY, loadInKg) {
        const height = 60;
        const arrowW = 14;
        const tailY = tipY - height;

        ctx.fillStyle = '#ef4444'; // Red arrow

        // Arrow shaft
        ctx.fillRect(x - 3, tailY, 6, height - arrowW);

        // Arrow head
        ctx.beginPath();
        ctx.moveTo(x, tipY);
        ctx.lineTo(x - arrowW, tipY - arrowW);
        ctx.lineTo(x + arrowW, tipY - arrowW);
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`F = ${loadInKg} kg`, x, tailY - 10);
    }

    function drawGrid(w, h) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const step = 40;

        ctx.beginPath();
        for (let x = 0; x <= w; x += step) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        for (let y = 0; y <= h; y += step) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
        ctx.stroke();
    }
});
