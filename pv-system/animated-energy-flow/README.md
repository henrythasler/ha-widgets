# PV-System Energy Flow Card

## Installation

Use the following configuration and replace the sensor-entities with your sensor:

```yaml
type: custom:energy-flow-svg-card
svg: https://blog.cyclemap.link/ha-widgets/pv-system/animated-energy-flow/energy-flow.svg
entities:
  p_pv:
    entity: sensor.erzeugung
  p_load:
    entity: sensor.electrical_load
  p_akku:
    entity: sensor.p_akku
  p_grid:
    entity: sensor.p_grid
  soc:
    entity: sensor.battery_soc

```