// src/services/map/MapboxCircle.js
import * as turf from '@turf/turf';

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

  // 使用原生方式計算範圍內的站點
  findStationsInCircle(stations) {
    console.log(`Searching for stations within ${this.radius}m radius from [${this.center}]...`);
    console.log(`Total stations available: ${stations ? stations.length : 0}`);
    
    if (!stations || !Array.isArray(stations) || stations.length === 0) {
      console.warn('No stations data available');
      return [];
    }
    
    // 使用 Haversine 公式計算兩點之間的距離
    const stationsWithinRadius = stations.filter(station => {
      try {
        const stationLng = parseFloat(station.lng || station.longitude);
        const stationLat = parseFloat(station.lat || station.latitude);
        
        if (isNaN(stationLng) || isNaN(stationLat)) {
          return false;
        }
        
        // 使用 Haversine 公式計算距離
        const distance = this.calculateDistance(
          this.center[1], this.center[0], 
          stationLat, stationLng
        );
        
        return distance <= this.radius;
      } catch (error) {
        console.error('Error processing station:', error, station);
        return false;
      }
    });
    
    console.log(`Found ${stationsWithinRadius.length} stations within radius`);
    return stationsWithinRadius;
  }

  // Haversine 公式計算地球上兩點之間的距離（公尺）
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 地球半徑（公尺）
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  }

  // 角度轉弧度
  deg2rad(deg) {
    return deg * (Math.PI / 180);
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