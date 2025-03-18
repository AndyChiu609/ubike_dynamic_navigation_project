// src/services/map/MapboxFactory.js
import MapFactory from './MapFactory';
import MapboxMap from './MapboxMap';
import MapboxMarker from './MapboxMarker';
// import MapboxPopup from './MapboxPopup';
import MapboxCircle from './MapboxCircle';
import CustomInfoWindow from './CustomInfoWindow';

// Mapbox 實現工廠
class MapboxFactory extends MapFactory {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
  }

  // 創建地圖實例
  createMap(containerId, options) {
    options.accessToken = options.accessToken || this.apiKey;
    return new MapboxMap(containerId, options);
  }

  // 創建標記
  createMarker(lngLat, options) {
    return new MapboxMarker(lngLat, options);
  }

  // 創建彈出窗口
  // createPopup(options) {
  //  return new MapboxPopup(options);
  // }

  // 創建自定義信息窗口
  createInfoWindow(options) {
    return new CustomInfoWindow(options);
  }

  // 創建圓圈
  createCircle(center, radius, options) {
    return new MapboxCircle(center, radius, options);
  }
}

export default MapboxFactory;