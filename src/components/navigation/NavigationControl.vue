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
import GeoUtils from '@/services/utils/GeoUtils';

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
      // 如果當前處於激活狀態，則調用退出導航
      if (active.value) {
        exitNavigation();
        return;
      }
      
      // 進入導航模式
      active.value = true;
      status.value = '請選擇起點';
      emit('navigation-toggle', true);
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
    
    // 更新路線資訊 - 使用 GeoUtils 進行格式化
    const updateRouteInfo = (distance, duration) => {
      routeCalculated.value = true;
      // 使用 GeoUtils 進行距離格式化
      distanceInfo.value = `總距離: ${GeoUtils.formatDistance(distance)}`;
      // 使用 GeoUtils 進行時間格式化
      timeInfo.value = `預計時間: ${GeoUtils.formatTime(duration)}`;
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
    
    // 更新剩餘信息 - 使用 GeoUtils 進行格式化
    const updateRemainingInfo = (remainingDistance, remainingTime) => {
      // 使用 GeoUtils 進行距離格式化
      distanceInfo.value = `剩餘距離: ${GeoUtils.formatDistance(remainingDistance)}`;
      // 使用 GeoUtils 進行時間格式化
      timeInfo.value = `剩餘時間: ${GeoUtils.formatTime(remainingTime)}`;
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