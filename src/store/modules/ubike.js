import UbikeService from '@/services/ubike/UbikeService';

const ubikeService = new UbikeService();

export default {
  namespaced: true,
  state: {
    stations: [],
    loading: false,
    selectedStation: null,
    stationsInView: []
  },
  mutations: {
    SET_STATIONS(state, stations) {
      state.stations = stations;
    },
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    SET_SELECTED_STATION(state, station) {
      state.selectedStation = station;
    },
    SET_STATIONS_IN_VIEW(state, stations) {
      state.stationsInView = stations;
    }
  },
  actions: {
    async fetchStations({ commit }) {
      commit('SET_LOADING', true);
      try {
        const stations = await ubikeService.fetchStations();
        commit('SET_STATIONS', stations);
        commit('SET_LOADING', false);
        return stations;
      } catch (error) {
        console.error('無法取得 Ubike 站點資料:', error);
        commit('SET_LOADING', false);
        throw error;
      }
    },
    setSelectedStation({ commit }, station) {
      commit('SET_SELECTED_STATION', station);
    },
    setStationsInView({ commit }, stations) {
      commit('SET_STATIONS_IN_VIEW', stations);
    },
    findStationsWithinRadius(_, { center, radius }) {
      return ubikeService.findStationsWithinRadius(center, radius);
    }
  },
  getters: {
    getStations: state => state.stations,
    isLoading: state => state.loading,
    getSelectedStation: state => state.selectedStation,
    getStationsInView: state => state.stationsInView
  }
};