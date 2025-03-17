import * as turf from '@turf/turf';

// Mapbox 圓圈實現
class MapboxCircle {
  constructor(center, radius, options = {}) {
    this.center = center;
    this.radius = radius;
    this.options = options;
    this.id = options.id || `circle-${Date.now()}`;
    this.sourceId = `${this.id}-source`;
    this.circleId = `${this.id}-layer`;
  }

  addTo(map) {
    this.map = map;
    this.mapInstance = map.getMapInstance(); // 獲取底層的 mapboxgl.Map 實例
    
    // 創建一個具有指定半徑的圓
    const point = turf.point(this.center);
    const buffered = turf.buffer(point, this.radius, {units: 'meters'});
    
    // 添加源
    this.mapInstance.addSource(this.sourceId, {
      type: 'geojson',
      data: buffered
    });
    
    // 添加圓層
    this.mapInstance.addLayer({
      id: this.circleId,
      type: 'fill',
      source: this.sourceId,
      paint: {
        'fill-color': this.options.fillColor || 'rgba(0, 100, 255, 0.2)',
        'fill-outline-color': this.options.strokeColor || 'rgba(0, 100, 255, 0.8)'
      }
    });
    
    return this;
  }

  remove() {
    if (this.mapInstance) {
      if (this.mapInstance.getLayer(this.circleId)) {
        this.mapInstance.removeLayer(this.circleId);
      }
      if (this.mapInstance.getSource(this.sourceId)) {
        this.mapInstance.removeSource(this.sourceId);
      }
    }
    return this;
  }
}

export default MapboxCircle;