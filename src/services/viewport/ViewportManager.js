// src/services/viewport/ViewportManager.js
export default class ViewportManager {
    constructor(mapFactory, ubikeService) {
      this.mapFactory = mapFactory;
      this.ubikeService = ubikeService;
      this.navigationStationMarkers = [];
    }
  
    // 更新視野範圍內的站點
    updateViewportStations(mapInstance, navigationActive, simulationActive) {
      // 只在導航模式下執行
      if (!navigationActive || !simulationActive) {
        return [];
      }
      
      // 清除之前的站點標記
      this.clearNavigationStationMarkers();
      
      // 查找視野範圍內的站點
      const viewportStations = this.findStationsInViewport(
        this.ubikeService.stations,
        mapInstance.getMapInstance()
      );
      
      // 添加站點標記
      this.addNavigationStationMarkers(viewportStations, mapInstance);
      
      return viewportStations;
    }
  
    // 查找視野範圍內的站點
    findStationsInViewport(stations, mapInstance) {
      if (!stations || !Array.isArray(stations) || stations.length === 0) {
        console.warn('沒有站點資料可供搜尋');
        return [];
      }
      
      // 獲取當前地圖視野的邊界
      const bounds = mapInstance.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      
      // 使用純數學比較方法篩選在視野範圍內的站點
      const stationsInView = stations.filter(station => {
        try {
          const stationLng = parseFloat(station.lng || station.longitude);
          const stationLat = parseFloat(station.lat || station.latitude);
          
          if (isNaN(stationLng) || isNaN(stationLat)) {
            return false;
          }
          
          // 簡單的邊界框檢查 - 判斷點是否在矩形內
          let isLngInRange = false;
          
          if (sw.lng <= ne.lng) {
            // 正常情況
            isLngInRange = (stationLng >= sw.lng && stationLng <= ne.lng);
          } else {
            // 跨越 180 度經線的情況
            isLngInRange = (stationLng >= sw.lng || stationLng <= ne.lng);
          }
          
          const isLatInRange = (stationLat >= sw.lat && stationLat <= ne.lat);
          
          return isLngInRange && isLatInRange;
        } catch (error) {
          console.error('處理站點時出錯:', error);
          return false;
        }
      });
      
      console.log(`視野範圍內找到 ${stationsInView.length} 個站點`);
      return stationsInView;
    }
  
    // 添加導航過程中的站點標記
    addNavigationStationMarkers(stations, mapInstance) {
      stations.forEach(station => {
        try {
          const stationLat = parseFloat(station.lat);
          const stationLng = parseFloat(station.lng);
          
          if (isNaN(stationLat) || isNaN(stationLng)) {
            return;
          }
          
          const sbi = parseInt(station.sbi || 0);
          const tot = parseInt(station.tot || 0);
          
          // 根據可借用車輛百分比決定顏色
          const bikeAvailability = tot > 0 ? (sbi / tot * 100) : 0;
          let markerColor = '#AAAAAA'; // 預設灰色（普通）
          
          if (bikeAvailability < 20) {
            markerColor = '#FF0000'; // 紅色 - 很難借到車
          } else if (bikeAvailability < 40) {
            markerColor = '#FF7F7F'; // 淺紅色 - 較難借到車
          } else if (bikeAvailability > 70) {
            markerColor = '#00AA00'; // 綠色 - 很容易借到車
          } else if (bikeAvailability > 50) {
            markerColor = '#7FFF7F'; // 淺綠色 - 比較容易借到車
          }
          
          // 創建自定義 Ubike 站點標記元素
          const ubikeMarkerElement = document.createElement('div');
          ubikeMarkerElement.className = 'ubike-marker';
          ubikeMarkerElement.style.backgroundColor = markerColor;
          ubikeMarkerElement.innerHTML = `<div class="ubike-icon">U</div>`;
          
          const marker = this.mapFactory.createMarker([stationLng, stationLat], {
            element: ubikeMarkerElement,
            data: station
          });
          
          marker.addTo(mapInstance);
          this.navigationStationMarkers.push(marker);
        } catch (error) {
          console.error('Failed to add navigation station marker:', error);
        }
      });
    }
  
    // 清除導航過程中的站點標記
    clearNavigationStationMarkers() {
      this.navigationStationMarkers.forEach(marker => marker.remove());
      this.navigationStationMarkers = [];
    }
  
    // 清理資源
    cleanup() {
      this.clearNavigationStationMarkers();
    }
  }