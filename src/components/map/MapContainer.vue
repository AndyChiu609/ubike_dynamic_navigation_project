<template>
  <div>
    <div id="map" class="map-container"></div>
    <div class="map-overlay">
      <h3>台北 Ubike 2.0 站點地圖</h3>
      <p>點擊地圖位置以尋找附近 500 公尺內的 Ubike 站點</p>
      <div id="station-count">{{ stationCountText }}</div>
      <p><small>若要使用導航功能，請點擊右上角的「開始導航模式」按鈕</small></p>
    </div>
    <div id="loading" v-if="loading">載入中...</div>
    <div id="station-info" class="station-info" ref="stationInfo" :style="stationInfoStyle">
      <div v-if="selectedStation">
        <h4>{{ getStationName(selectedStation) }}</h4>
        <p>地址: {{ selectedStation.ar }}</p>
        <p :class="selectedStation.sbi > 0 ? 'bike-available' : 'bike-unavailable'">
          可借車輛: {{ selectedStation.sbi }} / {{ selectedStation.tot }}
        </p>
        <p>可還空位: {{ selectedStation.bemp }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
// import { useStore } from 'vuex';
import mapboxgl from 'mapbox-gl';
import MapboxFactory from '@/services/map/MapboxFactory';
import UbikeService from '@/services/ubike/UbikeService';

export default {
  name: 'MapContainer',
  setup() {
    // const store = useStore();
    const loading = ref(true);
    const stationsInView = ref([]);
    const mapInstance = ref(null);
    const mapFactory = ref(null);
    const markers = ref([]);
    const currentCircle = ref(null);
    const ubikeService = new UbikeService();
    const selectedStation = ref(null);
    const stationInfo = ref(null);
    const stationInfoStyle = ref({
      display: 'none',
      left: '0px',
      top: '0px'
    });
    
    // 設置 mapbox token
    mapboxgl.accessToken = 'pk.eyJ1IjoiYW5keWNoaXU2MDkiLCJhIjoiY20xaWxjemc1MGVoZzJqb2NyZ2M2enE1aSJ9.PBoFruvUCgE-xt0MbTYmkg';
    
    const stationCountText = computed(() => {
      return stationsInView.value.length > 0 
        ? `找到 ${stationsInView.value.length} 個站點` 
        : '';
    });

    // 清除所有標記
    const clearMarkers = () => {
      markers.value.forEach(marker => marker.remove());
      markers.value = [];
    };
    
    // 獲取站點名稱 (移除前綴)
    const getStationName = (station) => {
      return station.sna ? station.sna.replace('YouBike2.0_', '') : '';
    };
    
    // 顯示站點信息
    const showStationInfo = (marker, event) => {
      const station = marker.getData();
      if (!station) return;
      
      selectedStation.value = station;
      
      // 設置位置
      stationInfoStyle.value = {
        display: 'block',
        left: `${event.pageX + 15}px`,
        top: `${event.pageY - 20}px`
      };
    };
    
    // 隱藏站點信息
    const hideStationInfo = () => {
      stationInfoStyle.value.display = 'none';
    };
    
    onMounted(async () => {
      try {
        // 初始化地圖
        mapFactory.value = new MapboxFactory(mapboxgl.accessToken);
        mapInstance.value = mapFactory.value.createMap('map', {
          center: [121.5654, 25.0330],
          zoom: 12,
          style: 'mapbox://styles/mapbox/streets-v12'
        });
        
        // 等待地圖載入
        mapInstance.value.on('load', async () => {
          console.log('地圖載入完成');
          
          // 加載站點資料
          await ubikeService.fetchStations();
          
          // 顯示初始區域站點（台北市政府附近）
          setTimeout(() => {
            handleMapClick({ lngLat: { lng: 121.5654, lat: 25.0330 } });
          }, 1000);
          
          loading.value = false;
        });
        
        // 綁定地圖點擊事件
        mapInstance.value.on('click', handleMapClick);
        
      } catch (error) {
        console.error('地圖初始化失敗:', error);
        loading.value = false;
      }
    });

    // 處理地圖點擊
    const handleMapClick = (e) => {
      const center = [e.lngLat.lng, e.lngLat.lat];
      const radius = 500; // 500 公尺
      
      try {
        // 清除之前的標記和圓圈
        clearMarkers();
        if (currentCircle.value) {
          currentCircle.value.remove();
          currentCircle.value = null;
        }
        
        // 新增點擊中心標記
        const centerMarkerElement = document.createElement('div');
        centerMarkerElement.className = 'click-marker';
        centerMarkerElement.innerHTML = `
          <div class="pulse"></div>
          <div class="center-point"></div>
        `;
        
        const centerMarker = mapFactory.value.createMarker(center, {
          element: centerMarkerElement,
          anchor: 'center',
          data: { isClickPoint: true }
        });
        
        centerMarker.addTo(mapInstance.value);
        markers.value.push(centerMarker);

        // 新增圓圈
        currentCircle.value = mapFactory.value.createCircle(center, radius, {
          id: 'search-radius',
          fillColor: 'rgba(0, 100, 255, 0.2)',
          strokeColor: 'rgba(0, 100, 255, 0.8)'
        });
        currentCircle.value.addTo(mapInstance.value);
        
        // 查找範圍內站點
        const nearbyStations = ubikeService.findStationsWithinRadius(center, radius);
        stationsInView.value = nearbyStations;
        console.log(`找到 ${nearbyStations.length} 個站點`);
        
        // 添加站點標記
        addStationMarkers(nearbyStations);
        
      } catch (error) {
        console.error('查找站點時出錯:', error);
      }
    };
    
    // 添加站點標記
    const addStationMarkers = (stations) => {
      stations.forEach(station => {
        try {
          const stationLat = parseFloat(station.lat);
          const stationLng = parseFloat(station.lng);
          
          if (isNaN(stationLat) || isNaN(stationLng)) {
            console.warn('站點座標無效:', station);
            return; // 跳過無效座標
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
            markerColor = '#00FF00'; // 綠色 - 很容易借到車
          } else if (bikeAvailability > 50) {
            markerColor = '#7FFF7F'; // 淺綠色 - 比較容易借到車
          }

          // 創建自定義 Ubike 站點標記元素
          const ubikeMarkerElement = document.createElement('div');
          ubikeMarkerElement.className = 'ubike-marker';
          ubikeMarkerElement.style.backgroundColor = markerColor;
          ubikeMarkerElement.innerHTML = `<div class="ubike-icon">U</div>`;

          const marker = mapFactory.value.createMarker([stationLng, stationLat], {
            element: ubikeMarkerElement,
            data: station
          });
          
          // 添加事件處理
          marker.on('mouseenter', e => showStationInfo(marker, e));
          marker.on('mouseleave', hideStationInfo);
          
          marker.addTo(mapInstance.value);
          markers.value.push(marker);
        } catch (error) {
          console.error('添加站點標記失敗:', error, station);
        }
      });
    };

    return {
      loading,
      stationCountText,
      selectedStation,
      stationInfoStyle,
      stationInfo,
      getStationName
    };
  }
}
</script>

<style>
/* 點擊位置標記樣式 */
.click-marker {
  width: 30px;
  height: 30px;
  position: relative;
}

.center-point {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: red;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  border: 2px solid white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.pulse {
  position: absolute;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(255, 0, 0, 0.4);
  opacity: 0.6;
  animation: pulse 2s infinite;
  top: 0;
  left: 0;
}

@keyframes pulse {
  0% {
    transform: scale(0.5);
    opacity: 0.6;
  }
  50% {
    transform: scale(1);
    opacity: 0.3;
  }
  100% {
    transform: scale(0.5);
    opacity: 0.6;
  }
}

/* Ubike 站點標記樣式 */
.ubike-marker {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  border: 2px solid white;
}

.ubike-icon {
  color: white;
  font-weight: bold;
  font-size: 14px;
}

/* 站點信息樣式 */
.station-info {
  position: absolute;
  display: none;
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 2;
  max-width: 250px;
  pointer-events: none;
}

.station-info h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
}

.station-info p {
  margin: 5px 0;
  font-size: 12px;
}

.bike-available {
  color: green;
  font-weight: bold;
}

.bike-unavailable {
  color: red;
  font-weight: bold;
}
</style>