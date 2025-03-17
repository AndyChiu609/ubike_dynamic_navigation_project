<!-- src/components/map/MapContainer.vue -->
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
    
    <!-- 添加導航控制組件 -->
    <navigation-control 
      ref="navControl"
      @navigation-toggle="handleNavigationToggle"
      @navigation-exit="handleNavigationExit"
      @start-simulation="startSimulation"
      @toggle-pause-resume="togglePauseResume"
      @speed-change="handleSpeedChange"
      @points-change="handlePointsChange"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import mapboxgl from 'mapbox-gl';
import MapboxFactory from '@/services/map/MapboxFactory';
import UbikeService from '@/services/ubike/UbikeService';
import NavigationService from '@/services/navigation/NavigationService';
import StationManager from '@/services/station/StationManager';
import SearchManager from '@/services/search/SearchManager';
import ViewportManager from '@/services/viewport/ViewportManager';
import NavigationControl from '@/components/navigation/NavigationControl.vue';

export default {
  name: 'MapContainer',
  components: {
    NavigationControl
  },
  setup() {
    const loading = ref(true);
    const stationsInView = ref([]);
    const mapInstance = ref(null);
    const mapFactory = ref(null);
    const navControl = ref(null);
    
    // 服務實例
    const ubikeService = new UbikeService();
    const navigationService = new NavigationService();
    let stationManager = null;
    let searchManager = null;
    let viewportManager = null;
    
    // 導航相關狀態
    const navigationActive = ref(false);
    
    // 設置 mapbox token
    mapboxgl.accessToken = 'pk.eyJ1IjoiYW5keWNoaXU2MDkiLCJhIjoiY20xaWxjemc1MGVoZzJqb2NyZ2M2enE1aSJ9.PBoFruvUCgE-xt0MbTYmkg';
    
    const stationCountText = computed(() => {
      return stationsInView.value.length > 0 
        ? `找到 ${stationsInView.value.length} 個站點` 
        : '';
    });

    // 處理導航模式開關
    const handleNavigationToggle = (active) => {
      navigationActive.value = active;
      console.log('Navigation mode:', active ? 'ON' : 'OFF');
      
      if (active) {
        // 進入導航模式
        searchManager.clearSearchMarkers();
        stationManager.clearMarkers();
        
        // 重置導航狀態
        navigationService.reset();
      } 
    };
    
    // 處理退出導航
    const handleNavigationExit = () => {
      navigationActive.value = false;
      
      // 清理導航資源
      navigationService.reset();
      
      // 清除導航過程中的站點標記
      viewportManager.clearNavigationStationMarkers();
      
      // 返回地圖初始狀態
      if (mapInstance.value) {
        mapInstance.value.setCenter([121.5654, 25.0330]);
        mapInstance.value.setZoom(12);
      }
    };
    
    // 開始模擬
    const startSimulation = () => {
      navigationService.startSimulation();
      
      // 初始顯示視野範圍內的站點
      setTimeout(() => {
        updateViewportStations();
      }, 2000); // 等待初始飛行動畫完成
    };
    
    // 切換暫停/繼續模擬
    const togglePauseResume = () => {
      navigationService.togglePauseResume();
    };
    
    // 處理速度變化
    const handleSpeedChange = (speed) => {
      navigationService.setSimulationSpeed(speed);
    };
    
    // 處理插值點數變化
    const handlePointsChange = (points) => {
      navigationService.setPointsToInsert(points);
      // 如果已經計算了路線，則重新計算
      if (navigationService.startPoint && navigationService.endPoint) {
        navigationService.recalculateRoute();
      }
    };
    
    // 更新視野範圍內的站點
    const updateViewportStations = () => {
      viewportManager.updateViewportStations(
        mapInstance.value,
        navigationActive.value,
        navigationService.simulationActive
      );
    };
    
    // 處理地圖點擊
    const handleMapClick = (e) => {
      const center = [e.lngLat.lng, e.lngLat.lat];
      
      // 如果處於導航模式，使用導航邏輯
      if (navigationActive.value) {
        handleNavigationClick(center);
        return;
      }
      
      // 普通模式處理邏輯 - 搜尋附近站點
      const radius = 500; // 500 公尺
      const nearbyStations = searchManager.searchNearbyStations(center, radius, mapInstance.value);
      stationsInView.value = nearbyStations;
    };
    
    // 處理導航模式下的點擊
    const handleNavigationClick = (coordinates) => {
      if (!navigationService.startPoint) {
        // 設置起點
        navigationService.setStartPoint(coordinates);
      } else if (!navigationService.endPoint) {
        // 設置終點
        navigationService.setEndPoint(coordinates);
        // 計算路線
        navigationService.calculateRoute();
      }
    };
    
    onMounted(async () => {
      try {
        console.log('Initializing map...');
        // 初始化地圖
        mapFactory.value = new MapboxFactory(mapboxgl.accessToken);
        mapInstance.value = mapFactory.value.createMap('map', {
          center: [121.5654, 25.0330],
          zoom: 12,
          style: 'mapbox://styles/mapbox/streets-v12'
        });
        
        // 初始化服務
        stationManager = new StationManager(mapFactory.value, ubikeService);
        searchManager = new SearchManager(mapFactory.value, ubikeService, stationManager);
        viewportManager = new ViewportManager(mapFactory.value, ubikeService);
        
        // 等待地圖載入
        mapInstance.value.on('load', async () => {
          console.log('Map loaded successfully');
          
          // 初始化導航服務
          navigationService.initialize(mapInstance.value, mapFactory.value);
          
          // 添加導航事件監聽
          navigationService.on('routeCalculated', (routeData) => {
            console.log('路線計算完成:', routeData);
            // 更新導航控制面板
            if (navControl.value) {
              navControl.value.updateRouteInfo(routeData.distance, routeData.duration);
            }
          });
          
          navigationService.on('simulationStarted', () => {
            if (navControl.value) {
              navControl.value.updateSimulationStatus(true, false);
            }
          });
          
          navigationService.on('simulationPaused', () => {
            if (navControl.value) {
              navControl.value.updateSimulationStatus(true, true);
            }
          });
          
          navigationService.on('simulationResumed', () => {
            if (navControl.value) {
              navControl.value.updateSimulationStatus(true, false);
            }
          });
          
          navigationService.on('simulationStopped', () => {
            if (navControl.value) {
              navControl.value.updateSimulationStatus(false, false);
            }
          });
          
          navigationService.on('positionUpdated', (data) => {
            if (navControl.value) {
              navControl.value.updateRemainingInfo(data.remainingDistance, data.remainingTime);
            }
          });
          
          navigationService.on('simulationCompleted', () => {
            console.log('模擬導航完成');
            if (navControl.value) {
              navControl.value.updateSimulationStatus(false, false);
              navControl.value.status = '已到達目的地';
            }
          });
          
          navigationService.on('mapMoveEnd', () => {
            // 更新視野範圍內的站點
            updateViewportStations();
          });
          
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
        console.error('Failed to initialize map:', error);
        loading.value = false;
      }
    });
    
    // 釋放資源
    onBeforeUnmount(() => {
      if (stationManager) stationManager.cleanup();
      if (searchManager) searchManager.cleanup();
      if (viewportManager) viewportManager.cleanup();
      navigationService.cleanup();
      
      if (mapInstance.value) {
        mapInstance.value.off('click');
      }
    });

    return {
      loading,
      stationCountText,
      handleNavigationToggle,
      handleNavigationExit,
      startSimulation,
      togglePauseResume,
      handleSpeedChange,
      handlePointsChange,
      updateViewportStations,
      navControl
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

/* 導航標記樣式 */
.nav-marker {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
}

.start-marker {
  background-color: #4caf50;
  border: 2px solid white;
}

.end-marker {
  background-color: #e74c3c;
  border: 2px solid white;
}

.nav-marker span {
  color: white;
  font-weight: bold;
  font-size: 14px;
}

/* 使用者當前位置標記 */
.user-marker {
  position: relative;
  width: 36px;
  height: 36px;
}

.user-dot {
  position: absolute;
  width: 16px;
  height: 16px;
  background-color: #3887be;
  border-radius: 50%;
  border: 3px solid white;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.user-marker::before {
  content: "";
  position: absolute;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(56, 135, 190, 0.4);
  opacity: 0.6;
  animation: locationPulse 2s infinite;
  top: 0;
  left: 0;
}

@keyframes locationPulse {
  0% {
    transform: scale(0.6);
    opacity: 0.8;
  }
  50% {
    transform: scale(1);
    opacity: 0.4;
  }
  100% {
    transform: scale(0.6);
    opacity: 0.8;
  }
}

#loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 3;
}
</style>