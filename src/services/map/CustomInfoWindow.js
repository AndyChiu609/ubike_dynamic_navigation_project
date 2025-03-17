// src/services/map/CustomInfoWindow.js
class CustomInfoWindow {
    constructor(options = {}) {
      this.options = options;
      this.map = null;
      this.mapInstance = null;
      this.lngLat = null;
      this.content = '';
      this.element = null;
      this.visible = false;
      this.offset = options.offset || { x: 0, y: -10 };
      
      // 創建 DOM 元素
      this.createDOMElement();
    }
  
    // 創建 DOM 元素
    createDOMElement() {
      this.element = document.createElement('div');
      this.element.className = 'custom-info-window';
      this.element.style.cssText = `
        position: absolute;
        background: white;
        border-radius: 6px;
        padding: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
        min-width: 150px;
        max-width: 280px;
        transform: translate(-50%, -100%);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 10;
      `;
      
      // 添加小三角形指標
      const pointer = document.createElement('div');
      pointer.className = 'custom-info-window-pointer';
      pointer.style.cssText = `
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid white;
      `;
      
      this.element.appendChild(pointer);
      
      // 添加內容容器
      this.contentContainer = document.createElement('div');
      this.contentContainer.className = 'custom-info-window-content';
      this.element.appendChild(this.contentContainer);
      
      // 先隱藏元素
      this.element.style.display = 'none';
      
      // 添加到 body
      document.body.appendChild(this.element);
    }
  
    // 設置經緯度位置
    setLngLat(lngLat) {
      this.lngLat = lngLat;
      return this;
    }
  
    // 設置內容
    setContent(content) {
      this.content = content;
      this.contentContainer.innerHTML = content;
      return this;
    }
  
    // 添加到地圖
    addTo(map) {
      try {
        this.map = map;
        this.mapInstance = map.getMapInstance();
        
        // 綁定地圖移動事件
        this.mapInstance.on('move', this._updatePosition.bind(this));
        
        // 顯示信息窗口
        this.show();
        
        console.log('Custom info window added to map');
      } catch (error) {
        console.error('Failed to add custom info window to map:', error);
      }
      return this;
    }
  
    // 更新位置
    _updatePosition() {
      if (!this.visible || !this.lngLat || !this.mapInstance) return;
      
      // 將經緯度轉換為屏幕坐標
      const point = this.mapInstance.project(this.lngLat);
      
      // 設置元素位置
      this.element.style.left = `${point.x + this.offset.x}px`;
      this.element.style.top = `${point.y + this.offset.y}px`;
    }
  
    // 顯示信息窗口
    show() {
      if (!this.lngLat || !this.mapInstance) return this;
      
      this.visible = true;
      this.element.style.display = 'block';
      
      // 需要延遲一下才能讓過渡動畫生效
      setTimeout(() => {
        this.element.style.opacity = '1';
      }, 10);
      
      // 更新位置
      this._updatePosition();
      
      return this;
    }
  
    // 隱藏信息窗口
    hide() {
      this.visible = false;
      this.element.style.opacity = '0';
      
      // 需要等待過渡動畫結束後再隱藏元素
      setTimeout(() => {
        if (!this.visible) {
          this.element.style.display = 'none';
        }
      }, 200);
      
      return this;
    }
  
    // 移除信息窗口
    remove() {
      try {
        // 解綁地圖事件
        if (this.mapInstance) {
          this.mapInstance.off('move', this._updatePosition.bind(this));
        }
        
        // 隱藏元素
        this.hide();
        
        // 移除 DOM 元素
        setTimeout(() => {
          if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
          }
          this.element = null;
        }, 300);
        
        this.map = null;
        this.mapInstance = null;
        
        console.log('Custom info window removed');
      } catch (error) {
        console.error('Failed to remove custom info window:', error);
      }
      
      return this;
    }
  
    // 設置站點信息
    setStationInfo(station) {
      try {
        if (!station) {
          console.warn('No station data provided for info window');
          return this;
        }
        
        // 獲取站點名稱（移除前綴）
        const name = station.sna ? station.sna.replace('YouBike2.0_', '') : '';
        
        // 獲取資訊
        const sbi = parseInt(station.sbi || 0);
        const tot = parseInt(station.tot || 0);
        const bemp = parseInt(station.bemp || 0);
        
        // 計算可用車輛百分比
        const availablePercentage = tot > 0 ? Math.round((sbi / tot) * 100) : 0;
        
        // 根據可用百分比決定顏色
        let statusColor = '#888888'; // 預設灰色
        
        if (availablePercentage < 20) {
          statusColor = '#FF0000'; // 紅色 - 很難借到車
        } else if (availablePercentage < 40) {
          statusColor = '#FF7F7F'; // 淺紅色 - 較難借到車
        } else if (availablePercentage > 70) {
          statusColor = '#00AA00'; // 綠色 - 很容易借到車
        } else if (availablePercentage > 50) {
          statusColor = '#7FFF7F'; // 淺綠色 - 比較容易借到車
        }
        
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
        
        // 創建自定義樣式的 HTML 內容
        const html = `
          <div style="font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 4px;">${name}</h3>
            <div style="color: #666; font-size: 13px; margin-bottom: 6px;">${station.ar || ''}</div>
            
            <div style="display: flex; align-items: center; margin: 10px 0;">
              <div style="width: 100%; background-color: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="width: ${availablePercentage}%; height: 100%; background-color: ${statusColor};"></div>
              </div>
              <div style="margin-left: 8px; font-weight: bold; color: ${statusColor};">${availablePercentage}%</div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-top: 5px;">
              <div style="font-size: 12px;">
                <div style="margin-bottom: 4px;"><span style="font-weight: bold; color: ${sbi > 0 ? '#00AA00' : '#FF0000'};">可借：${sbi}</span> / ${tot}</div>
                <div>可還：${bemp}</div>
              </div>
              <div style="font-size: 11px; color: #999; text-align: right;">
                更新：${updateTime.substring(11)}
              </div>
            </div>
          </div>
        `;
        
        this.setContent(html);
        console.log('Station info set to custom info window:', name);
      } catch (error) {
        console.error('Failed to set station info to custom info window:', error);
      }
      
      return this;
    }
  }
  
  export default CustomInfoWindow;