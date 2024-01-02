import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import VueOffline from 'vue-offline'
import VueAwesomeSwiper from 'vue-awesome-swiper'
import 'swiper/css/swiper.css'

Vue.config.productionTip = false

router.beforeEach((to, from, next) => {
  store.commit('clearAlert')
  if (to.matched.some(record => record.meta.authAccess)) {
    if (!store.state.isAuthenticated) {
      next({ path: '/' })
    } else {
      next()
    }
  } else if (to.matched.some(record => record.meta.unAuthAccess)) {
    if (store.state.isAuthenticated) {
      next({ path: '/analytics' })
    } else {
      next()
    }
  } else {
    next()
  }
})

Vue.use(VueOffline, { mixin: false })
Vue.use(VueAwesomeSwiper, {})

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
