// src/services/station/StationManager.js
export default class StationManager {
    constructor(mapFactory, ubikeService) {
      this.mapFactory = mapFactory;
      this.ubikeService = ubikeService;
      this.markers = [];
      this.infoWindow = null;
    }
  
    // 添加站點標記
    addStationMarkers(stations, mapInstance) {
      console.log(`Adding ${stations.length} station markers`);
      
      stations.forEach(station => {
        try {
          const stationLat = parseFloat(station.lat);
          const stationLng = parseFloat(station.lng);
          
          if (isNaN(stationLat) || isNaN(stationLng)) {
            console.warn('Invalid station coordinates:', station);
            return;
          }
          
          const marker = this.createStationMarker(station, [stationLng, stationLat]);
          marker.addTo(mapInstance);
          this.markers.push(marker);
        } catch (error) {
          console.error('Failed to add station marker:', error, station);
        }
      });
      
      console.log(`Added ${this.markers.length} markers to map`);
      return this.markers;
    }
  
    // 創建站點標記
    createStationMarker(station, coordinates) {
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
  
      const marker = this.mapFactory.createMarker(coordinates, {
        element: ubikeMarkerElement,
        data: station
      });
      
      // 綁定事件
      marker.on('mouseenter', () => this.showStationInfo(marker));
      marker.on('mouseleave', () => this.hideStationInfo());
      
      return marker;
    }
  
    // 顯示站點信息
    showStationInfo(marker) {
      const station = marker.getData();
      if (!station) {
        console.warn('No station data available for marker');
        return;
      }
      
      console.log('Showing station info:', station.sna);
      
      // 如果已經有信息窗口，先移除
      if (this.infoWindow) {
        this.infoWindow.remove();
      }
      
      // 創建新的自定義信息窗口
      this.infoWindow = this.mapFactory.createInfoWindow({
        offset: { x: 0, y: -15 }
      });
      
      // 設置信息窗口內容和位置
      this.infoWindow.setStationInfo(station);
      this.infoWindow.setLngLat(marker.getLngLat());
      this.infoWindow.addTo(marker.map);
    }
  
    // 隱藏站點信息
    hideStationInfo() {
      if (this.infoWindow) {
        this.infoWindow.remove();
        this.infoWindow = null;
      }
    }
  
    // 清除所有標記
    clearMarkers() {
      console.log(`Clearing ${this.markers.length} markers`);
      this.markers.forEach(marker => marker.remove());
      this.markers = [];
    }
  
    // 清理資源
    cleanup() {
      this.clearMarkers();
      this.hideStationInfo();
    }
  }