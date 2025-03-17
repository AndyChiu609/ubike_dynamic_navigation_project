// src/services/search/SearchManager.js
export default class SearchManager {
    constructor(mapFactory, ubikeService, stationManager) {
      this.mapFactory = mapFactory;
      this.ubikeService = ubikeService;
      this.stationManager = stationManager;
      this.currentCircle = null;
      this.centerMarker = null;
    }
  
    // 搜尋指定位置附近的站點
    searchNearbyStations(center, radius, mapInstance) {
      try {
        // 清除之前的標記和圓圈
        this.stationManager.clearMarkers();
        this.clearSearchMarkers();
        
        // 新增點擊中心標記
        this.addCenterMarker(center, mapInstance);
  
        // 新增圓圈
        this.addSearchCircle(center, radius, mapInstance);
        
        // 使用圓圈尋找範圍內站點
        const nearbyStations = this.currentCircle.findStationsInCircle(this.ubikeService.stations);
        console.log(`找到 ${nearbyStations.length} 個站點`);
        
        // 添加站點標記
        this.stationManager.addStationMarkers(nearbyStations, mapInstance);
        
        return nearbyStations;
      } catch (error) {
        console.error('Error searching nearby stations:', error);
        return [];
      }
    }
  
    // 添加搜尋中心標記
    addCenterMarker(center, mapInstance) {
      const centerMarkerElement = document.createElement('div');
      centerMarkerElement.className = 'click-marker';
      centerMarkerElement.innerHTML = `
        <div class="pulse"></div>
        <div class="center-point"></div>
      `;
      
      this.centerMarker = this.mapFactory.createMarker(center, {
        element: centerMarkerElement,
        anchor: 'center',
        data: { isClickPoint: true }
      });
      
      this.centerMarker.addTo(mapInstance);
    }
  
    // 添加搜尋範圍圓圈
    addSearchCircle(center, radius, mapInstance) {
      this.currentCircle = this.mapFactory.createCircle(center, radius, {
        id: 'search-radius',
        fillColor: 'rgba(0, 100, 255, 0.2)',
        strokeColor: 'rgba(0, 100, 255, 0.8)'
      });
      this.currentCircle.addTo(mapInstance);
    }
  
    // 清除搜尋標記
    clearSearchMarkers() {
      if (this.centerMarker) {
        this.centerMarker.remove();
        this.centerMarker = null;
      }
      
      if (this.currentCircle) {
        this.currentCircle.remove();
        this.currentCircle = null;
      }
    }
  
    // 清理資源
    cleanup() {
      this.clearSearchMarkers();
    }
  }