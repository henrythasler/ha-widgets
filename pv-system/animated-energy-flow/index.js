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
        <div id="svg-container" style="padding: 12px;">
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

      importedSvg.style.width = "auto";
      importedSvg.style.height = "100%";
      importedSvg.style.display = "block";

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

    primaryValues[0] = Number(this._hass.states[this.config.entities["p_pv"].entity]?.state) || 0;

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

    for (let i = 0; i < secondaryValues.length; i++) {
      const label = secondaryLabels[i];
      const value = secondaryValues[i];

      if (label) {
        label.textContent = `${(Math.abs(value) > 15) ? Math.floor(value) : Math.round(value * 10) / 10}`;
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