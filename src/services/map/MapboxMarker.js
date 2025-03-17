// src/services/map/MapboxMarker.js
import mapboxgl from 'mapbox-gl';

class MapboxMarker {
  constructor(lngLat, options = {}) {
    this.lngLat = lngLat;
    this.options = options;
    this.eventListeners = {};
    this.data = options.data || null;
    
    // 創建 mapbox marker 實例
    if (options.element) {
      this.markerInstance = new mapboxgl.Marker({
        element: options.element,
        anchor: options.anchor || 'bottom',
        offset: options.offset || [0, 0],
        draggable: options.draggable || false
      }).setLngLat(lngLat);
    } else {
      this.markerInstance = new mapboxgl.Marker(options).setLngLat(lngLat);
    }
    
    console.log(`Marker created at [${lngLat}]`);
  }

  // 添加到地圖
  addTo(map) {
    this.map = map;
    this.markerInstance.addTo(map.getMapInstance());
    console.log('Marker added to map');
    return this;
  }

  // 設置經緯度位置
  setLngLat(lngLat) {
    this.lngLat = lngLat;
    this.markerInstance.setLngLat(lngLat);
    return this;
  }

  // 獲取經緯度位置
  getLngLat() {
    return this.markerInstance.getLngLat();
  }
  
  // 設置數據
  setData(data) {
    this.data = data;
    return this;
  }
  
  // 獲取數據
  getData() {
    return this.data;
  }

  // 添加事件監聽器
  on(event, callback) {
    try {
      console.log(`Adding ${event} event listener to marker`);
      // 保存事件監聽器引用以便於移除
      this.eventListeners[event] = callback;
      const element = this.markerInstance.getElement();
      element.addEventListener(event, callback);
    } catch (error) {
      console.error(`Failed to add ${event} event to marker:`, error);
    }
    return this;
  }

  // 移除事件監聽器
  off(event) {
    try {
      if (this.eventListeners[event]) {
        this.markerInstance.getElement().removeEventListener(event, this.eventListeners[event]);
        delete this.eventListeners[event];
      }
    } catch (error) {
      console.error(`Failed to remove ${event} event from marker:`, error);
    }
    return this;
  }

  // 獲取標記元素
  getElement() {
    return this.markerInstance.getElement();
  }

  // 移除標記
  remove() {
    try {
      // 移除所有事件監聽器
      Object.keys(this.eventListeners).forEach(event => {
        this.off(event);
      });
      
      this.markerInstance.remove();
      this.map = null;
      console.log('Marker removed');
    } catch (error) {
      console.error('Failed to remove marker:', error);
    }
    
    return this;
  }
}

export default MapboxMarker;