// src/services/map/MapboxCircle.js
import * as turf from '@turf/turf';
import GeoUtils from '@/services/utils/GeoUtils';

class MapboxCircle {
  constructor(center, radius, options = {}) {
    this.center = center;
    this.radius = radius; // 以米為單位
    this.options = options;
    this.id = options.id || `circle-${Date.now()}`;
    this.sourceId = `${this.id}-source`;
    this.circleId = `${this.id}-layer`;
    this.map = null;
    this.mapInstance = null;
  }

  addTo(map) {
    this.map = map;
    this.mapInstance = map.getMapInstance();
    
    try {
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
      
      console.log('Circle added to map successfully');
    } catch (error) {
      console.error('Failed to add circle to map:', error);
    }
    
    return this;
  }

  // 使用 GeoUtils 計算範圍內的站點
  findStationsInCircle(stations) {
    console.log(`Searching for stations within ${this.radius}m radius from [${this.center}]...`);
    console.log(`Total stations available: ${stations ? stations.length : 0}`);
    
    return GeoUtils.findStationsInRadius(stations, this.center, this.radius);
  }

  remove() {
    if (this.mapInstance) {
      try {
        if (this.mapInstance.getLayer(this.circleId)) {
          this.mapInstance.removeLayer(this.circleId);
        }
        if (this.mapInstance.getSource(this.sourceId)) {
          this.mapInstance.removeSource(this.sourceId);
        }
      } catch (error) {
        console.error('Error removing circle:', error);
      }
    }
    
    this.map = null;
    this.mapInstance = null;
    
    return this;
  }

  getCenter() {
    return this.center;
  }

  getRadius() {
    return this.radius;
  }
}

export default MapboxCircle;