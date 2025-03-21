// src/services/ubike/UbikeService.js
import GeoUtils from '@/services/utils/GeoUtils';

// UbikeService 類別：負責獲取和處理 Ubike 站點資料
class UbikeService {
    constructor() {
      this.apiUrl = 'https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json';
      this.stations = [];
    }
  
    async fetchStations() {
      try {
        console.log('正在取得 Ubike 站點資料...');
        const response = await fetch(this.apiUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!response.ok) throw new Error(`HTTP 錯誤: ${response.status}`);
        
        const data = await response.json();
        console.log(`成功取得 ${data.length} 個站點`);
        
        // 處理站點資料
        this.stations = data.map(station => this.normalizeStationData(station));
        console.log(`處理後保留 ${this.stations.length} 個有效站點資料`);
        return this.stations;
      } catch (error) {
        console.error('無法取得 Ubike 站點資料:', error);
        this.stations = this.getTestData();
        return this.stations;
      }
    }
  
    // 標準化站點資料格式
    normalizeStationData(station) {
      // 處理座標
      station.lat = station.latitude || station.lat;
      station.lng = station.longitude || station.lng;
      
      // 處理可借還車輛數據
      station.sbi = station.available_rent_bikes || station.sbi;
      station.bemp = station.available_return_bikes || station.bemp;
      station.tot = station.total || station.tot;
      
      return station;
    }
  
    // 測試資料
    getTestData() {
      return [
        {
          "sno": "500101001", "sna": "YouBike2.0_捷運市政府站(3號出口)",
          "tot": 40, "sbi": 15, "sarea": "信義區", "mday": "20220523181004",
          "lat": "25.0408578889", "lng": "121.5677805556",
          "ar": "忠孝東路/松仁路(東南側)", "bemp": 25, "act": "1"
        },
        // 為簡潔起見，我省略了其他測試站點數據
      ];
    }
  
    findStationsWithinRadius(center, radius) {
      console.log(`搜尋以 [${center}] 為中心，半徑 ${radius} 公尺內的站點`);
      
      return GeoUtils.findStationsInRadius(this.stations, center, radius);
    }
  }
  
  export default UbikeService;