<template>
  <div class="home">
    <MapContainer />
  </div>
</template>

<script>
import MapContainer from '@/components/map/MapContainer.vue';

export default {
  name: 'HomeView',
  components: {
    MapContainer
  }
}
</script>

<style scoped>
.home {
  height: 100%;
  width: 100%;
}
</style>