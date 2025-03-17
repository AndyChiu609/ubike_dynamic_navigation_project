// src/services/map/MapboxPopup.js
import mapboxgl from 'mapbox-gl';

class MapboxPopup {
  constructor(options = {}) {
    this.options = options;
    this.popupInstance = new mapboxgl.Popup({
      closeButton: options.closeButton !== false,
      closeOnClick: options.closeOnClick !== false,
      offset: options.offset || 15,
      className: options.className || '',
      maxWidth: options.maxWidth || '300px'
    });
    
    this.map = null;
    console.log('Popup created');
  }

  // 設置彈出窗口的位置
  setLngLat(lngLat) {
    this.popupInstance.setLngLat(lngLat);
    return this;
  }

  // 設置彈出窗口的 HTML 內容
  setHTML(html) {
    console.log('Setting popup HTML content');
    this.popupInstance.setHTML(html);
    return this;
  }

  // 設置彈出窗口的文本內容
  setText(text) {
    this.popupInstance.setText(text);
    return this;
  }

  // 添加到地圖
  addTo(map) {
    try {
      this.map = map;
      this.popupInstance.addTo(map.getMapInstance());
      console.log('Popup added to map');
    } catch (error) {
      console.error('Failed to add popup to map:', error);
    }
    return this;
  }

  // 移除彈出窗口
  remove() {
    try {
      this.popupInstance.remove();
      this.map = null;
      console.log('Popup removed');
    } catch (error) {
      console.error('Failed to remove popup:', error);
    }
    return this;
  }

  // 從站點數據生成 HTML 內容
  setStationInfo(station) {
    try {
      if (!station) {
        console.warn('No station data provided for popup');
        return this;
      }
      
      // 獲取站點名稱（移除前綴）
      const name = station.sna ? station.sna.replace('YouBike2.0_', '') : '';
      
      // 獲取資訊
      const sbi = parseInt(station.sbi || 0);
      const tot = parseInt(station.tot || 0);
      const bemp = parseInt(station.bemp || 0);
      
      // 格式化更新時間
      let updateTime = station.mday || '';
      if (updateTime && !updateTime.includes('-') && updateTime.length === 14) {
        const year = updateTime.substring(0, 4);
        const month = updateTime.substring(4, 6);
        const day = updateTime.substring(6, 8);
        const hour = updateTime.substring(8, 10);
        const minute = updateTime.substring(10, 12);
        const second = updateTime.substring(12, 14);
        updateTime = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
      }
      
      const html = `
        <div class="station-popup">
          <h4>${name}</h4>
          <p>地址: ${station.ar || ''}</p>
          <p class="${sbi > 0 ? 'bike-available' : 'bike-unavailable'}">
            可借車輛: ${sbi} / ${tot}
          </p>
          <p>可還空位: ${bemp}</p>
          <p>更新時間: ${updateTime}</p>
        </div>
      `;
      
      this.setHTML(html);
      console.log('Station info set to popup:', name);
    } catch (error) {
      console.error('Failed to set station info to popup:', error);
    }
    
    return this;
  }
}

export default MapboxPopup;