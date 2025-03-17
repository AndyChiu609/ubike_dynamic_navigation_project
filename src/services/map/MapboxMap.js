import mapboxgl from 'mapbox-gl';

// Mapbox 地圖實現
class MapboxMap {
  constructor(containerId, options) {
    mapboxgl.accessToken = options.accessToken || mapboxgl.accessToken;
    
    this.mapInstance = new mapboxgl.Map({
      container: containerId,
      style: options.style || 'mapbox://styles/mapbox/streets-v12',
      center: options.center || [121.5654, 25.0330],
      zoom: options.zoom || 12,
      minZoom: options.minZoom || 12,
      maxZoom: options.maxZoom || 18,
      attributionControl: true
    });
    this.eventListeners = {};
  }

  getMapInstance() { return this.mapInstance; }
  
  setStyle(styleUrl) {
    this.mapInstance.setStyle(styleUrl);
    return this;
  }

  setCenter(center) {
    this.mapInstance.setCenter(center);
    return this;
  }

  setZoom(zoom) {
    this.mapInstance.setZoom(zoom);
    return this;
  }

  on(event, callback) {
    this.eventListeners[event] = callback;
    this.mapInstance.on(event, callback);
    return this;
  }

  off(event) {
    if (this.eventListeners[event]) {
      this.mapInstance.off(event, this.eventListeners[event]);
      delete this.eventListeners[event];
    }
    return this;
  }
}

export default MapboxMap;