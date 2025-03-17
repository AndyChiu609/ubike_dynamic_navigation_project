import { createStore } from 'vuex'
import ubike from './modules/ubike';


export default createStore({
  state: {
    // 全局狀態
  },
  getters: {
    // 計算屬性
  },
  mutations: {
    // 同步修改狀態
  },
  actions: {
    // 異步操作
  },
  modules: {
    ubike
  }
})