import mapboxgl from 'mapbox-gl';

// Mapbox 彈出窗口實現
class MapboxPopup {
  constructor(options = {}) {
    this.popupInstance = new mapboxgl.Popup(options);
  }

  setLngLat(lngLat) {
    this.popupInstance.setLngLat(lngLat);
    return this;
  }

  setHTML(html) {
    this.popupInstance.setHTML(html);
    return this;
  }

  setText(text) {
    this.popupInstance.setText(text);
    return this;
  }

  addTo(map) {
    this.popupInstance.addTo(map.getMapInstance());
    return this;
  }

  remove() {
    this.popupInstance.remove();
    return this;
  }
}

export default MapboxPopup;