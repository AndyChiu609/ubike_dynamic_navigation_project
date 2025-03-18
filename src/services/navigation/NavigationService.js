// src/services/navigation/NavigationService.js
import mapboxgl from 'mapbox-gl';
import GeoUtils from '@/services/utils/GeoUtils';

class NavigationService {
  constructor() {
    this.mapInstance = null;
    this.mapFactory = null;
    this.startPoint = null;
    this.endPoint = null;
    this.startMarker = null;
    this.endMarker = null;
    this.currentPositionMarker = null;
    this.routeCoordinates = [];
    this.routeSource = 'route-source';
    this.routeLayer = 'route-layer';
    this.listeners = {};
    
    // 模擬移動相關
    this.simulationActive = false;
    this.simulationPaused = false;
    this.simulationInterval = null;
    this.currentPathIndex = 0;
    this.simulationSpeed = 1000; // 毫秒/點
    this.pointsToInsert = 3; // 插值點數
    this.totalDistance = 0;
    this.duration = 0;
    
    // 事件監聽器
    this._moveEndListener = null;
  }

  // 初始化服務
  initialize(mapInstance, mapFactory) {
    this.mapInstance = mapInstance;
    this.mapFactory = mapFactory;
    this.initializeRouteLayers();
    return this;
  }

  // 初始化路線圖層
  initializeRouteLayers() {
    const mapInstance = this.mapInstance.getMapInstance();
    
    if (mapInstance.loaded()) {
      this._addRouteLayers();
    } else {
      mapInstance.on('load', () => this._addRouteLayers());
    }
  }

  // 添加路線圖層
  _addRouteLayers() {
    try {
      const mapInstance = this.mapInstance.getMapInstance();
      
      if (!mapInstance.getSource(this.routeSource)) {
        mapInstance.addSource(this.routeSource, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });

        mapInstance.addLayer({
          id: this.routeLayer,
          type: 'line',
          source: this.routeSource,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3887be', 'line-width': 5, 'line-opacity': 0.75 }
        });
      }
    } catch (error) {
      console.error('初始化路線圖層失敗:', error);
    }
  }

  // 設置起點
  setStartPoint(coordinates) {
    this.startPoint = coordinates;
    
    // 創建起點標記
    if (this.startMarker) {
      this.startMarker.remove();
    }
    
    const startElement = document.createElement('div');
    startElement.className = 'nav-marker start-marker';
    startElement.innerHTML = '<span>起</span>';
    
    this.startMarker = this.mapFactory.createMarker(coordinates, {
      element: startElement
    });
    this.startMarker.addTo(this.mapInstance);
    
    // 觸發事件
    this._triggerEvent('startPointSet', coordinates);
    
    return coordinates;
  }

  // 設置終點
  setEndPoint(coordinates) {
    this.endPoint = coordinates;
    
    // 創建終點標記
    if (this.endMarker) {
      this.endMarker.remove();
    }
    
    const endElement = document.createElement('div');
    endElement.className = 'nav-marker end-marker';
    endElement.innerHTML = '<span>終</span>';
    
    this.endMarker = this.mapFactory.createMarker(coordinates, {
      element: endElement
    });
    this.endMarker.addTo(this.mapInstance);
    
    // 觸發事件
    this._triggerEvent('endPointSet', coordinates);
    
    return coordinates;
  }

  // 計算路線
  async calculateRoute() {
    if (!this.startPoint || !this.endPoint) {
      console.warn('起點或終點未設置');
      return null;
    }
    
    try {
      // 觸發事件
      this._triggerEvent('routeCalculationStart');
      
      // 調用 Mapbox Direction API
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${this.startPoint[0]},${this.startPoint[1]};${this.endPoint[0]},${this.endPoint[1]}?steps=true&geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
      
      const response = await fetch(directionsUrl);
      if (!response.ok) {
        throw new Error('網路請求錯誤，無法取得路線');
      }
      
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const originalCoordinates = route.geometry.coordinates;
        
        // 使用插值增加路線平滑度
        this.routeCoordinates = this.interpolateRoutePoints(originalCoordinates, this.pointsToInsert);
        this.totalDistance = route.distance; // 以米為單位
        this.duration = route.duration; // 以秒為單位
        
        // 顯示路線
        this.displayRoute();
        
        // 觸發事件
        this._triggerEvent('routeCalculated', {
          coordinates: this.routeCoordinates,
          distance: this.totalDistance,
          duration: this.duration
        });
        
        return {
          coordinates: this.routeCoordinates,
          distance: this.totalDistance,
          duration: this.duration
        };
      } else {
        throw new Error('未取得有效路線');
      }
    } catch (error) {
      console.error('計算路線失敗:', error);
      this._triggerEvent('routeCalculationError', error);
      return null;
    }
  }

  // 在相鄰點之間插入額外的點
  interpolateRoutePoints(originalCoordinates, pointsToInsertBetween = 1) {
    if (originalCoordinates.length < 2) return originalCoordinates;
    
    const interpolatedPoints = [originalCoordinates[0]];
    
    for (let i = 0; i < originalCoordinates.length - 1; i++) {
      const startPoint = originalCoordinates[i];
      const endPoint = originalCoordinates[i + 1];
      
      // 在兩點之間插入指定數量的點
      for (let j = 1; j <= pointsToInsertBetween; j++) {
        const ratio = j / (pointsToInsertBetween + 1);
        const interpolatedPoint = [
          startPoint[0] + (endPoint[0] - startPoint[0]) * ratio,
          startPoint[1] + (endPoint[1] - startPoint[1]) * ratio
        ];
        interpolatedPoints.push(interpolatedPoint);
      }
      
      // 添加終點（除非是最後一段）
      if (i < originalCoordinates.length - 2) {
        interpolatedPoints.push(endPoint);
      }
    }
    
    // 添加原始路徑的最後一個點
    interpolatedPoints.push(originalCoordinates[originalCoordinates.length - 1]);
    
    return interpolatedPoints;
  }

  // 顯示路線
  displayRoute() {
    try {
      const mapInstance = this.mapInstance.getMapInstance();
      
      if (mapInstance.getSource(this.routeSource)) {
        mapInstance.getSource(this.routeSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: this.routeCoordinates
          }
        });
      }
    } catch (error) {
      console.error('顯示路線失敗:', error);
    }
  }

  // 清除路線
  clearRoute() {
    try {
      const mapInstance = this.mapInstance.getMapInstance();
      
      if (mapInstance.getSource(this.routeSource)) {
        mapInstance.getSource(this.routeSource).setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        });
      }
      
      this.routeCoordinates = [];
    } catch (error) {
      console.error('清除路線失敗:', error);
    }
  }

  // 開始模擬移動
  startSimulation() {
    if (this.routeCoordinates.length === 0) {
      console.warn('沒有路線，無法開始模擬移動');
      return false;
    }
    
    this.simulationActive = true;
    this.simulationPaused = false;
    this.currentPathIndex = 0;
    
    // 移除之前的用戶位置標記
    if (this.currentPositionMarker) {
      this.currentPositionMarker.remove();
    }
    
    // 創建用戶位置標記
    const userElement = document.createElement('div');
    userElement.className = 'user-marker';
    userElement.innerHTML = '<div class="user-dot"></div>';
    
    const startPosition = this.routeCoordinates[0];
    
    this.currentPositionMarker = this.mapFactory.createMarker(startPosition, {
      element: userElement,
      anchor: 'center'
    });
    
    this.currentPositionMarker.addTo(this.mapInstance);
    
    // 計算路線的邊界框，以確保整個路線在視圖中
    const bounds = new mapboxgl.LngLatBounds();
    
    // 將起點和終點添加到邊界框
    bounds.extend(this.startPoint);
    bounds.extend(this.endPoint);
    
    // 先飛到可以看到整個路線的視圖
    this.mapInstance.getMapInstance().fitBounds(bounds, {
      padding: 100, // 在邊界外添加一些填充
      duration: 1000
    });
    
    // 添加地圖移動結束事件監聽
    const mapInstance = this.mapInstance.getMapInstance();
    
    // 移除之前可能存在的監聽器
    if (this._moveEndListener) {
      mapInstance.off('moveend', this._moveEndListener);
    }
    
    // 創建新的監聽器
    this._moveEndListener = () => {
      this._triggerEvent('mapMoveEnd');
    };
    
    // 添加監聽器
    mapInstance.on('moveend', this._moveEndListener);
    
    // 等待視圖調整完成後，再飛到起點位置並放大
    setTimeout(() => {
      this.mapInstance.getMapInstance().flyTo({
        center: startPosition,
        zoom: 16,
        duration: 1000
      });
      
      // 啟動模擬移動
      setTimeout(() => {
        this.simulationInterval = setInterval(() => this.updateSimulation(), this.simulationSpeed);
        this._triggerEvent('simulationStarted');
      }, 1200);
    }, 1500);
    
    return true;
  }
  
  // 更新模擬位置
  updateSimulation() {
    if (!this.simulationActive || this.simulationPaused) {
      return;
    }
    
    if (this.currentPathIndex >= this.routeCoordinates.length - 1) {
      this._triggerEvent('simulationCompleted');
      this.stopSimulation();
      return;
    }
    
    this.currentPathIndex++;
    
    const newPosition = this.routeCoordinates[this.currentPathIndex];
    this.currentPositionMarker.setLngLat(newPosition);
    
    // 計算進度
    const progressRatio = this.currentPathIndex / (this.routeCoordinates.length - 1);
    const remainingDistance = this.totalDistance * (1 - progressRatio);
    const remainingTime = this.duration * (1 - progressRatio);
    
    // 更新地圖視圖跟隨用戶
    this.mapInstance.setCenter(newPosition);
    
    // 觸發事件
    this._triggerEvent('positionUpdated', {
      position: newPosition,
      currentPathIndex: this.currentPathIndex,
      total: this.routeCoordinates.length,
      progressRatio,
      remainingDistance,
      remainingTime
    });
  }
  
  // 暫停模擬
  pauseSimulation() {
    if (!this.simulationActive) return false;
    
    this.simulationPaused = true;
    
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    
    this._triggerEvent('simulationPaused');
    return true;
  }
  
  // 繼續模擬
  resumeSimulation() {
    if (!this.simulationActive || !this.simulationPaused) return false;
    
    this.simulationPaused = false;
    this.simulationInterval = setInterval(() => this.updateSimulation(), this.simulationSpeed);
    
    this._triggerEvent('simulationResumed');
    return true;
  }
  
  // 停止模擬
  stopSimulation() {
    this.simulationActive = false;
    this.simulationPaused = false;
    
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    
    if (this.currentPositionMarker) {
      this.currentPositionMarker.remove();
      this.currentPositionMarker = null;
    }
    
    // 移除地圖移動事件監聽
    if (this._moveEndListener) {
      const mapInstance = this.mapInstance.getMapInstance();
      mapInstance.off('moveend', this._moveEndListener);
      this._moveEndListener = null;
    }
    
    this.currentPathIndex = 0;
    
    this._triggerEvent('simulationStopped');
    return true;
  }
  
  // 切換暫停/繼續
  togglePauseResume() {
    if (!this.simulationActive) return false;
    
    if (this.simulationPaused) {
      return this.resumeSimulation();
    } else {
      return this.pauseSimulation();
    }
  }
  
  // 設置模擬速度
  setSimulationSpeed(speed) {
    this.simulationSpeed = speed;
    
    // 如果正在模擬中，重新設置模擬間隔
    if (this.simulationActive && !this.simulationPaused && this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = setInterval(() => this.updateSimulation(), this.simulationSpeed);
    }
    
    this._triggerEvent('simulationSpeedChanged', speed);
    return speed;
  }
  
  // 設置插值點數
  setPointsToInsert(points) {
    this.pointsToInsert = points;
    this._triggerEvent('pointsToInsertChanged', points);
    return points;
  }
  
  // 重新計算路線（當插值點數改變時）
  async recalculateRoute() {
    if (!this.startPoint || !this.endPoint) return null;
    
    // 存儲當前模擬狀態
    const wasSimulating = this.simulationActive;
    const wasPaused = this.simulationPaused;
    
    // 停止當前的模擬
    this.stopSimulation();
    
    // 重新計算路線
    const result = await this.calculateRoute();
    
    // 如果之前正在模擬，則重新開始模擬
    if (wasSimulating) {
      this.startSimulation();
      
      // 如果之前是暫停狀態，則暫停
      if (wasPaused) {
        this.pauseSimulation();
      }
    }
    
    return result;
  }
  
  // 查找視野範圍內的所有 Ubike 站點
  findStationsInViewport(stations, mapInstance) {
    if (!stations || !Array.isArray(stations) || stations.length === 0) {
      console.warn('沒有站點資料可供搜尋');
      return [];
    }
    
    // 獲取當前地圖視野的邊界和中心
    const bounds = mapInstance.getBounds();
    const center = mapInstance.getCenter();
    const ne = bounds.getNorthEast();
    
    // 計算從中心到東北角的距離作為半徑（覆蓋整個視野）
    const radius = GeoUtils.calculateDistance(
      center.lat, center.lng,
      ne.lat, ne.lng
    );
    
    // 使用 GeoUtils 的查詢方法
    return GeoUtils.findStationsInRadius(stations, [center.lng, center.lat], radius);
  }
  
  // 查找圓形範圍內的站點
  findStationsInRadius(stations, center, radius) {
    return GeoUtils.findStationsInRadius(stations, center, radius);
  }
  
  // 格式化時間顯示 (秒 -> 分:秒)
  formatTime(seconds) {
    return GeoUtils.formatTime(seconds);
  }
  
  // 格式化距離 (米 -> 公里)
  formatDistance(meters) {
    return GeoUtils.formatDistance(meters);
  }

  // 重置導航
  reset() {
    this.stopSimulation();
    this.clearRoute();
    
    if (this.startMarker) {
      this.startMarker.remove();
      this.startMarker = null;
    }
    
    if (this.endMarker) {
      this.endMarker.remove();
      this.endMarker = null;
    }
    
    this.startPoint = null;
    this.endPoint = null;
    this.totalDistance = 0;
    this.duration = 0;
    
    // 觸發事件
    this._triggerEvent('reset');
  }

  // 清理資源
  cleanup() {
    this.stopSimulation();
    this.reset();
    this.listeners = {};
  }

  // 事件系統
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (this.listeners[event]) {
      if (callback) {
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
      } else {
        this.listeners[event] = [];
      }
    }
    return this;
  }

  _triggerEvent(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export default NavigationService;