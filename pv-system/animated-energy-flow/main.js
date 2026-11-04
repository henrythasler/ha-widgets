class TemperatureSvgCard extends HTMLElement {
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
    try {
      const response = await fetch(this.config.svg);

      if (!response.ok) {
        throw new Error(`SVG loading failed: ${response.status}`);
      }

      const svgText = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(
        svgText,
        "image/svg+xml"
      );

      const svg = doc.documentElement;

      if (
        svg.tagName !== "svg" ||
        doc.querySelector("parsererror")
      ) {
        throw new Error("Invalid SVG file");
      }

      const container = this.querySelector("#svg-container");

      container.innerHTML = "";
      container.appendChild(
        document.importNode(svg, true)
      );

      this.updateTemperature();
    } catch (error) {
      console.error("Temperature SVG Card:", error);

      this.querySelector("#svg-container").textContent =
        "Error loading SVG";
    }
  }

  set hass(hass) {
    this._hass = hass;
    this.updateTemperature();
  }

  updateTemperature() {
    if (!this._hass || !this.config) return;

    const state = this._hass.states[this.config.entity];

    if (!state || !Number.isFinite(Number(state.state))) {
      return;
    }

    const temperature = Number(state.state);

    const svg = this.querySelector("#svg-container svg");

    // SVG may not have loaded yet
    if (!svg) return;

    const text = svg.querySelector("#temperature");
    const mercury = svg.querySelector("#mercury");
    const bulb = svg.querySelector("#bulb");

    if (text) {
      text.textContent = `${temperature.toFixed(1)} °C`;
    }

    let color = "#03a9f4";

    if (temperature >= 25) {
      color = "#f44336";
    } else if (temperature >= 20) {
      color = "#ff9800";
    }

    if (mercury) mercury.setAttribute("fill", color);
    if (bulb) bulb.setAttribute("fill", color);
  }

  getCardSize() {
    return 3;
  }
}

customElements.define(
  "temperature-svg-card",
  TemperatureSvgCard
);