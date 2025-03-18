// src/services/utils/GeoUtils.js

/**
 * 地理位置相關工具類，用於處理經緯度計算等功能
 */
export default class GeoUtils {
    /**
     * 使用 Haversine 公式計算兩點間的距離（公尺）
     * @param {number} lat1 - 第一點緯度
     * @param {number} lon1 - 第一點經度
     * @param {number} lat2 - 第二點緯度
     * @param {number} lon2 - 第二點經度
     * @returns {number} 距離（公尺）
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371000; // 地球半徑（公尺）
      const dLat = GeoUtils.deg2rad(lat2 - lat1);
      const dLon = GeoUtils.deg2rad(lon2 - lon1);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(GeoUtils.deg2rad(lat1)) * Math.cos(GeoUtils.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }
  
    /**
     * 角度轉弧度
     * @param {number} deg - 角度
     * @returns {number} 弧度
     */
    static deg2rad(deg) {
      return deg * (Math.PI / 180);
    }
  
    /**
     * 尋找指定範圍內的站點
     * @param {Array} stations - 站點資料陣列
     * @param {Array} center - 中心點座標 [lng, lat]
     * @param {number} radius - 半徑（公尺）
     * @returns {Array} 範圍內的站點
     */
    static findStationsInRadius(stations, center, radius) {
      if (!stations || !Array.isArray(stations) || stations.length === 0) {
        console.warn('沒有站點資料可供搜尋');
        return [];
      }
  
      return stations.filter(station => {
        try {
          const stationLng = parseFloat(station.lng || station.longitude);
          const stationLat = parseFloat(station.lat || station.latitude);
          
          if (isNaN(stationLng) || isNaN(stationLat)) {
            return false;
          }
          
          const distance = GeoUtils.calculateDistance(
            center[1], center[0],
            stationLat, stationLng
          );
          
          return distance <= radius;
        } catch (error) {
          console.error('處理站點時出錯:', error);
          return false;
        }
      });
    }
  
    /**
     * 格式化時間顯示（秒 -> 分:秒）
     * @param {number} seconds - 秒數
     * @returns {string} 格式化後的時間字串
     */
    static formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes} 分 ${remainingSeconds} 秒`;
    }
    
    /**
     * 格式化距離（米 -> 公里）
     * @param {number} meters - 公尺
     * @returns {string} 格式化後的距離字串
     */
    static formatDistance(meters) {
      return `${(meters / 1000).toFixed(2)} 公里`;
    }
  }