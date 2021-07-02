import Vue from 'vue'
import VueRouter from 'vue-router'
import Analytics from '@/views/Analytics'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: Analytics,
    meta: {
      authAccess: true,
      unAuthAccess: false
    }
  },
  {
    path: '/transactions',
    name: 'transactions',
    component: () => import(/* webpackChunkName: "about" */ '../views/Transactions.vue'),
    meta: {
      authAccess: true,
      unAuthAccess: false
    }
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import(/* webpackChunkName: "about" */ '../views/Categories.vue'),
    meta: {
      authAccess: true,
      unAuthAccess: false
    }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import(/* webpackChunkName: "about" */ '../views/Login.vue'),
    meta: {
      authAccess: false,
      unAuthAccess: true
    }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import(/* webpackChunkName: "about" */ '../views/Register.vue'),
    meta: {
      authAccess: false,
      unAuthAccess: true
    }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
