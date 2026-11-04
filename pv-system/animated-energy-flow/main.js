class TemperatureSvgCard extends HTMLElement {
    async setConfig(config) {
        if (!config.entity) {
            throw new Error("Please define a temperature entity");
        }

        this.config = config;
        const response = await fetch(config.svg);
        const svgText = await response.text();

        this.innerHTML = `
    <ha-card>
      <div style="padding: 12px;">
        ${svgText}
      </div>
    </ha-card>
  `;

    }

    set hass(hass) {
        this._hass = hass;

        if (!this.config) return;

        const state = hass.states[this.config.entity];

        if (!state) return;

        const temperature = Number(state.state);

        if (!Number.isFinite(temperature)) return;

        const svg = this.querySelector("svg");
        const text = svg.getElementById("temperature");
        const mercury = svg.getElementById("mercury");
        const bulb = svg.getElementById("bulb");

        // Display temperature
        text.textContent = `${temperature.toFixed(1)} °C`;

        // Choose color based on temperature
        let color = "#03a9f4";

        if (temperature >= 25) {
            color = "#f44336";
        } else if (temperature >= 20) {
            color = "#ff9800";
        }

        mercury.setAttribute("fill", color);
        bulb.setAttribute("fill", color);
    }

    getCardSize() {
        return 3;
    }
}

customElements.define(
    "temperature-svg-card",
    TemperatureSvgCard
);