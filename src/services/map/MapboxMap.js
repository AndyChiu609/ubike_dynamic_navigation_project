// src/services/map/MapboxMap.js
import mapboxgl from 'mapbox-gl';

// Mapbox 地圖實現
class MapboxMap {
  constructor(containerId, options) {
    mapboxgl.accessToken = options.accessToken || mapboxgl.accessToken;
    
    // 檢查是否使用本地 tile 服務
    const useLocalTiles = options.useLocalTiles !== undefined ? options.useLocalTiles : false;
    const tileServerUrl = options.tileServerUrl || 'http://localhost:8082/data/zoom12-18';
    
    const mapOptions = {
      container: containerId,
      center: options.center || [121.5654, 25.0330],
      zoom: options.zoom || 12,
      minZoom: options.minZoom || 12,
      maxZoom: options.maxZoom || 18,
      attributionControl: true
    };
    
    // 如果使用本地 tile 服務，設置自定義樣式
    if (useLocalTiles) {
      mapOptions.style = {
        version: 8,
        sources: {
          'taipei-osm': {
            type: 'raster',
            tiles: [`${tileServerUrl}/{z}/{x}/{y}.png`],
            tileSize: 256,
            maxzoom: 18,
            minzoom: 12,
            bounds: [121.447, 24.9606, 121.67, 25.2158],
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#f8f4f0'
            }
          },
          {
            id: 'taipei-osm-layer',
            type: 'raster',
            source: 'taipei-osm',
            minzoom: 0,
            maxzoom: 24
          }
        ]
      };
    } else {
      // 否則使用 Mapbox 預設樣式
      mapOptions.style = options.style || 'mapbox://styles/mapbox/streets-v12';
    }
    
    this.mapInstance = new mapboxgl.Map(mapOptions);
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

  flyTo(options) {
    this.mapInstance.flyTo(options);
    return this;
  }

  addSource(id, source) {
    if (!this.mapInstance.getSource(id)) {
      this.mapInstance.addSource(id, source);
    }
    return this;
  }

  addLayer(layer) {
    if (!this.mapInstance.getLayer(layer.id)) {
      this.mapInstance.addLayer(layer);
    }
    return this;
  }

  removeLayer(id) {
    if (this.mapInstance.getLayer(id)) {
      this.mapInstance.removeLayer(id);
    }
    return this;
  }

  removeSource(id) {
    if (this.mapInstance.getSource(id)) {
      this.mapInstance.removeSource(id);
    }
    return this;
  }

  cleanup() {
    Object.keys(this.eventListeners).forEach(event => this.off(event));
  }
}

export default MapboxMap;