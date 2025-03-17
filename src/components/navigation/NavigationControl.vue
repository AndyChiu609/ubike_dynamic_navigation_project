<!-- src/components/navigation/NavigationControl.vue -->
<template>
  <div>
    <button 
      class="nav-button" 
      :class="{ active: active }"
      @click="toggleNavigation"
    >
      {{ active ? '退出導航模式' : '開始導航模式' }}
    </button>
    
    <div v-if="active" class="nav-info">
      <h4>導航資訊</h4>
      <p id="nav-status">{{ status }}</p>
      
      <template v-if="routeCalculated">
        <p>{{ distanceInfo }}</p>
        <p>{{ timeInfo }}</p>
        
        <div class="slider-container">
          <label for="speed-slider">
            移動速度 (毫秒/點): <span>{{ simulationSpeed }}</span>
          </label>
          <input 
            type="range" 
            id="speed-slider" 
            min="100" 
            max="2000" 
            step="100" 
            v-model="simulationSpeed"
            @input="handleSpeedChange"
          >
        </div>
        
        <div class="slider-container">
          <label for="points-slider">
            插值點數: <span>{{ pointsToInsert }}</span>
          </label>
          <input 
            type="range" 
            id="points-slider" 
            min="0" 
            max="10" 
            step="1" 
            v-model="pointsToInsert"
            @input="handlePointsChange"
          >
        </div>
        
        <button 
          v-if="!simulationActive && routeCalculated" 
          @click="startSimulation" 
          class="control-button start"
        >
          開始導航
        </button>
        
        <button 
          v-if="simulationActive" 
          @click="togglePauseResume" 
          class="control-button pause"
        >
          {{ simulationPaused ? '繼續導航' : '暫停導航' }}
        </button>
      </template>
      
      <button @click="exitNavigation" class="control-button exit">
        退出導航
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'NavigationControl',
  emits: [
    'navigation-toggle',
    'navigation-exit',
    'start-simulation',
    'toggle-pause-resume',
    'speed-change',
    'points-change'
  ],
  props: {
    navigationService: Object
  },
  setup(props, { emit }) {
    const active = ref(false);
    const status = ref('請選擇起點');
    const routeCalculated = ref(false);
    const simulationActive = ref(false);
    const simulationPaused = ref(false);
    const distanceInfo = ref('');
    const timeInfo = ref('');
    const simulationSpeed = ref(1000);
    const pointsToInsert = ref(3);
    
    // 切換導航模式
    const toggleNavigation = () => {
      active.value = !active.value;
      status.value = active.value ? '請選擇起點' : '';
      if (!active.value) {
        // 重置狀態
        routeCalculated.value = false;
        simulationActive.value = false;
        simulationPaused.value = false;
        distanceInfo.value = '';
        timeInfo.value = '';
      }
      emit('navigation-toggle', active.value);
    };
    
    // 退出導航
    const exitNavigation = () => {
      active.value = false;
      status.value = '';
      routeCalculated.value = false;
      simulationActive.value = false;
      simulationPaused.value = false;
      distanceInfo.value = '';
      timeInfo.value = '';
      emit('navigation-exit');
    };
    
    // 開始模擬
    const startSimulation = () => {
      simulationActive.value = true;
      simulationPaused.value = false;
      status.value = '模擬導航中...';
      emit('start-simulation');
    };
    
    // 暫停/繼續模擬
    const togglePauseResume = () => {
      simulationPaused.value = !simulationPaused.value;
      status.value = simulationPaused.value ? '導航已暫停' : '模擬導航中...';
      emit('toggle-pause-resume');
    };
    
    // 處理速度變化
    const handleSpeedChange = () => {
      emit('speed-change', parseInt(simulationSpeed.value));
    };
    
    // 處理插值點數變化
    const handlePointsChange = () => {
      emit('points-change', parseInt(pointsToInsert.value));
    };
    
    // 更新路線資訊
    const updateRouteInfo = (distance, duration) => {
      routeCalculated.value = true;
      distanceInfo.value = `總距離: ${formatDistance(distance)}`;
      timeInfo.value = `預計時間: ${formatTime(duration)}`;
    };
    
    // 更新模擬狀態
    const updateSimulationStatus = (active, paused) => {
      simulationActive.value = active;
      simulationPaused.value = paused;
      
      if (active) {
        status.value = paused ? '導航已暫停' : '模擬導航中...';
      } else if (routeCalculated.value) {
        status.value = '路線已計算，點擊開始導航';
      }
    };
    
    // 更新剩餘信息
    const updateRemainingInfo = (remainingDistance, remainingTime) => {
      distanceInfo.value = `剩餘距離: ${formatDistance(remainingDistance)}`;
      timeInfo.value = `剩餘時間: ${formatTime(remainingTime)}`;
    };
    
    // 格式化時間
    const formatTime = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      return `${minutes} 分 ${remainingSeconds} 秒`;
    };
    
    // 格式化距離
    const formatDistance = (meters) => {
      return `${(meters / 1000).toFixed(2)} 公里`;
    };
    
    return {
      active,
      status,
      routeCalculated,
      simulationActive,
      simulationPaused,
      distanceInfo,
      timeInfo,
      simulationSpeed,
      pointsToInsert,
      toggleNavigation,
      exitNavigation,
      startSimulation,
      togglePauseResume,
      handleSpeedChange,
      handlePointsChange,
      updateRouteInfo,
      updateSimulationStatus,
      updateRemainingInfo
    };
  }
}
</script>

<style scoped>
.nav-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s;
}

.nav-button:hover {
  background-color: #2b6fd3;
}

.nav-button.active {
  background-color: #e74c3c;
}

.nav-info {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 15;
  min-width: 250px;
  margin-top: 50px;
}

.nav-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.nav-info p {
  margin: 5px 0;
  color: #666;
}

.slider-container {
  margin: 15px 0;
}

.slider-container label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
  color: #555;
}

.slider-container input {
  width: 100%;
}

.control-button {
  background-color: #4285f4;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  font-weight: bold;
  margin-right: 5px;
}

.control-button:hover {
  background-color: #2b6fd3;
}

.control-button.exit {
  background-color: #e74c3c;
}

.control-button.exit:hover {
  background-color: #c0392b;
}

.control-button.start {
  background-color: #27ae60;
}

.control-button.start:hover {
  background-color: #219653;
}

.control-button.pause {
  background-color: #f39c12;
}

.control-button.pause:hover {
  background-color: #d68910;
}
</style>