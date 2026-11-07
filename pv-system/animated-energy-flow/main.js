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

      importedSvg.style.width = "100%";
      importedSvg.style.height = "auto";
      importedSvg.style.display = "block";

      // Replace existing content
      container.replaceChildren(importedSvg);

      this._svgReady = true;

      // Apply current Home Assistant values
      this.updateEnergyFlow();

    } catch (error) {
      console.error("SVG loading error:", error);

      container.textContent = "Unable to load SVG";
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.updateEnergyFlow();
  }

  updateEnergyFlow() {
    if (!this._hass || !this.config) return;

    const state = this._hass.states[this.config.entity];

    if (!state || !Number.isFinite(Number(state.state))) {
      return;
    }

    const energy = Number(state.state);

    const svg = this.querySelector("#svg-container svg");

    // SVG may not have loaded yet
    if (!svg) return;

    // const text = svg.querySelector("#temperature");
    // const mercury = svg.querySelector("#mercury");
    // const bulb = svg.querySelector("#bulb");

    // if (text) {
    //   text.textContent = `${temperature.toFixed(1)} °C`;
    // }

    // let color = "#03a9f4";

    // if (temperature >= 25) {
    //   color = "#f44336";
    // } else if (temperature >= 20) {
    //   color = "#ff9800";
    // }

    // if (mercury) mercury.setAttribute("fill", color);
    // if (bulb) bulb.setAttribute("fill", color);
  }

  getCardSize() {
    return 3;
  }
}

customElements.define(
  "energy-flow-svg-card",
  EnergyFlowSvgCard
);