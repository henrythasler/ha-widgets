class EnergyFlowSvgCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity || !config.svg) {
      throw new Error("Please define entity and svg");
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

    for (const [key, config] of Object.entries(this.config.entities)) {
      const state = this._hass.states[config.entity];
      if (!state) {
        console.warn(`Entity not found: ${config.entity}`);
        continue;
      }
      const value = Number(state.state);
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