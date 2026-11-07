class EnergyFlowSvgCard extends HTMLElement {
  setConfig(config) {
    if (!config.svg) {
      throw new Error("Please define svg");
    }

    if (!config.entities || Object.keys(config.entities).length === 0) {
      throw new Error("Please define at least one entity in entities");
    }

    this.config = config;

    this.innerHTML = `
      <ha-card>
        <div id="svg-container"
            style="
              width: 100%;
              max-width: 100%;
              box-sizing: border-box;
              padding: 12px;
              overflow: hidden;
            ">
          Loading SVG...
        </div>
      </ha-card>
    `;

    this.loadSvg();
  }

  async loadSvg() {
    const container = this.querySelector("#svg-container");

    try {
      const response = await fetch(this.config.svg);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const svgText = await response.text();

      const parser = new DOMParser();

      const doc = parser.parseFromString(
        svgText,
        "image/svg+xml"
      );

      const svg = doc.documentElement;

      if (
        svg.localName !== "svg" ||
        doc.querySelector("parsererror")
      ) {
        throw new Error("Invalid SVG");
      }

      // Import the complete SVG document
      const importedSvg = document.importNode(svg, true);

      // Make the SVG responsive
      importedSvg.removeAttribute("width");
      importedSvg.removeAttribute("height");

      importedSvg.style.width = "100%";
      importedSvg.style.height = "auto";
      importedSvg.style.maxWidth = "480px";
      importedSvg.style.maxHeight = "80vh";
      importedSvg.style.display = "block";
      importedSvg.style.margin = "0 auto";
      importedSvg.style.objectFit = "contain";

      importedSvg.setAttribute(
        "preserveAspectRatio",
        "xMidYMid meet"
      );

      // Replace existing content
      container.replaceChildren(importedSvg);

      this._svgReady = true;

      // Apply current Home Assistant values
      this.updateEnergyFlow();

    } catch (error) {
      console.error("SVG loading error:", error);
      container.textContent = `Unable to load SVG: ${error.message}`;
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.updateEnergyFlow();
  }

  updateEnergyFlow() {
    if (!this._hass || !this.config?.entities) return;
    const svg = this.querySelector("#svg-container svg");
    if (!svg) return;

    const radius = 100;
    const circumference = 2 * Math.PI * radius;
    const primaryValues = [null, null, null, null];
    const secondaryValues = [null, null, null, null];
    const standbyState = [false, false, false, false];
    const maxValues = [6000, 6000, 5000, 0];

    const isLightTheme = this.config.theme || "light";

    // read values from Home Assistant states
    primaryValues[0] = Number(this._hass.states[this.config.entities["p_pv"].entity]?.state) || 0;
    primaryValues[1] = Number(this._hass.states[this.config.entities["p_load"].entity]?.state) || 0;
    primaryValues[2] = Number(this._hass.states[this.config.entities["p_akku"].entity]?.state) || 0;
    primaryValues[3] = Number(this._hass.states[this.config.entities["p_grid"].entity]?.state) || 0;

    secondaryValues[0] = Number(this._hass.states[this.config.entities["soc"].entity]?.state) || 0;

    // Calculate Standby state
    standbyState[0] = primaryValues[0] < 10;
    standbyState[2] = Number(this._hass.states[this.config.entities["bat_mode"].entity]?.state) == 0 || false;

    // update labels and units
    const primaryLabels = [null, null, null, null];
    const primaryUnits = [null, null, null, null];

    primaryLabels[0] = svg.getElementById('topLeftLabelValue');
    primaryUnits[0] = svg.getElementById('topLeftLabelUnit');

    primaryLabels[1] = svg.getElementById('topRightLabelValue');
    primaryUnits[1] = svg.getElementById('topRightLabelUnit');

    primaryLabels[2] = svg.getElementById('bottomRightLabelValue');
    primaryUnits[2] = svg.getElementById('bottomRightLabelUnit');

    primaryLabels[3] = svg.getElementById('bottomLeftLabelValue');
    primaryUnits[3] = svg.getElementById('bottomLeftLabelUnit');

    const secondaryLabels = [null, null, null, null];
    secondaryLabels[0] = svg.getElementById('bottomRightSecondaryLabel');

    const gap = 5;

    // iterate over primary values and update labels and units
    for (let i = 0; i < primaryValues.length; i++) {
      const label = primaryLabels[i];
      const unit = primaryUnits[i];
      const value = Math.abs(primaryValues[i]);

      if (label && unit) {
        label.textContent = (value > 1000) ? Math.round(value / 10) / 100 : Math.round(value);
        unit.textContent = (value > 1000) ? 'kW' : 'W';

        const labelWidth = label.getComputedTextLength();
        const unitWidth = unit.getComputedTextLength();
        const totalWidth = labelWidth + gap + unitWidth;
        const startX = -totalWidth / 2;

        label.setAttribute("text-anchor", "start");
        unit.setAttribute("text-anchor", "start");

        label.setAttribute("x", startX);
        unit.setAttribute("x", startX + labelWidth + gap);
      }
    }

    // iterate over secondary values and update labels
    for (let i = 0; i < secondaryValues.length; i++) {
      const label = secondaryLabels[i];
      const value = secondaryValues[i];

      if (label) {
        label.textContent = `${(Math.abs(value) > 15) ? Math.floor(value) : Math.round(value * 10) / 10}`;
      }
    }

    // update progress circles
    const progressContainer = [null, null, null, null];

    progressContainer[0] = svg.getElementById('topLeftProgress');
    progressContainer[1] = svg.getElementById('topRightProgress');
    progressContainer[2] = svg.getElementById('bottomRightProgress');
    progressContainer[3] = svg.getElementById('bottomLeftProgress');

    for (let i = 0; i < primaryValues.length; i++) {
      const container = progressContainer[i];
      const value = Math.abs(primaryValues[i]);
      if (container && value) {
        container.setAttribute("stroke-dasharray", circumference);
        container.setAttribute("stroke-dashoffset", circumference * (1 - value / maxValues[i]));
      }
    }

    // update energy node animations and radius scaling
    const energyNodes = [];
    energyNodes.push(svg.getElementById('node1'));
    energyNodes.push(svg.getElementById('node2'));
    energyNodes.push(svg.getElementById('node3'));
    energyNodes.push(svg.getElementById('node4'));
    energyNodes.push(svg.getElementById('node5'));
    energyNodes.push(svg.getElementById('node6'));
    energyNodes.push(svg.getElementById('node7'));
    energyNodes.push(svg.getElementById('node8'));

    // Energy Node animation and radius scaling
    const minRadius = 3;
    const maxRadius = 10;
    const threshold = 10; // Absolute value threshold for displaying the node

    // sum of positive values of primaryValues for scaling the radius; exclude values below the threshold
    const totalEnergy = primaryValues.reduce((acc, val) => {
      if (Math.abs(val) <= threshold) return acc; // Skip values below the threshold
      return acc + Math.max(val, 0);
    }, 0);

    for (let i = 0; i < primaryValues.length; i++) {
      const value = primaryValues[i];
      const node1 = energyNodes[i * 2];
      const node2 = energyNodes[i * 2 + 1];

      // set animation direction depending on the sign of the value
      const keyPoints = (value > 0) ? "0;1" : "1;0";
      node1.querySelector('animateMotion').setAttribute("keyPoints", keyPoints);
      node2.querySelector('animateMotion').setAttribute("keyPoints", keyPoints);

      // set area depending on the magnitude of the value as a fraction of the total energy, scaled to the range [minRadius, maxRadius]
      const area = Math.abs(value) / totalEnergy * (Math.PI * maxRadius * maxRadius);
      const radius = Math.min(Math.max(Math.sqrt(area / Math.PI), minRadius), maxRadius);

      node1.setAttribute("r", Math.abs(value) > threshold ? radius : 0);
      node2.setAttribute("r", Math.abs(value) > threshold ? radius : 0);
    }

    // update standby state for icons, glow gradients, and progress circles
    const Icons = [null, null, null, null];
    Icons[0] = svg.getElementById('topLeftIcon');
    Icons[1] = svg.getElementById('topRightIcon');
    Icons[2] = svg.getElementById('bottomRightIcon');
    Icons[3] = svg.getElementById('bottomLeftIcon');

    const glowGradients = [null, null, null, null];
    glowGradients[0] = svg.getElementById('topLeftGlow');
    glowGradients[1] = svg.getElementById('topRightGlow');
    glowGradients[2] = svg.getElementById('bottomRightGlow');
    glowGradients[3] = svg.getElementById('bottomLeftGlow');

    const standbyIcons = [null, null, null, null];
    standbyIcons[2] = svg.getElementById('bottomRightSleepIndicator');

    for (let i = 0; i < standbyState.length; i++) {
      const isStandby = standbyState[i];
      const icon = Icons[i];
      if (!icon) continue;

      // dim the icon if in standby mode
      const saturation = isStandby ? 50 : 100;
      const brightness = isStandby ? (isLightTheme ? 100 : 50) : 100;
      icon.style.filter = `saturate(${saturation}%) brightness(${brightness}%)`;

      // hide the glow gradient when the value is below a certain threshold  
      const glowGradient = glowGradients[i];
      if (glowGradient) {
        glowGradient.style.display = isStandby ? 'none' : 'block';
      }

      // hide the outer progress circle when the value is below a certain threshold
      const progressCircle = progressContainer[i];
      if (progressCircle) {
        progressCircle.style.display = isStandby ? 'none' : 'block';
      }

      // show the standby icon when in standby mode
      const standbyIcon = standbyIcons[i];
      if (standbyIcon) {
        standbyIcon.style.display = isStandby ? 'block' : 'none';
      }
    }
  }

  getCardSize() {
    return 3;
  }
}

customElements.define(
  "energy-flow-svg-card",
  EnergyFlowSvgCard
);