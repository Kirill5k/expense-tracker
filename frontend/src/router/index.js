import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '@/views/Home'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: {
      wide: true,
      authAccess: false,
      unAuthAccess: true
    }
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: () => import(/* webpackChunkName: "about" */ '../views/Analytics.vue'),
    meta: {
      navbar: true,
      slim: false,
      authAccess: true,
      unAuthAccess: false
    }
  },
  {
    path: '/transactions',
    name: 'transactions',
    component: () => import(/* webpackChunkName: "about" */ '../views/Transactions.vue'),
    meta: {
      navbar: true,
      slim: false,
      authAccess: true,
      unAuthAccess: false
    }
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import(/* webpackChunkName: "about" */ '../views/Categories.vue'),
    meta: {
      navbar: true,
      slim: false,
      authAccess: true,
      unAuthAccess: false
    }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import(/* webpackChunkName: "about" */ '../views/Settings.vue'),
    meta: {
      navbar: true,
      slim: false,
      authAccess: true,
      unAuthAccess: false
    }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import(/* webpackChunkName: "about" */ '../views/Login.vue'),
    meta: {
      slim: true,
      authAccess: false,
      unAuthAccess: true
    }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import(/* webpackChunkName: "about" */ '../views/Register.vue'),
    meta: {
      slim: true,
      authAccess: false,
      unAuthAccess: true
    }
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
