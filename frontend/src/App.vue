<template>
  <v-app>
    <v-app-bar
      v-if="!isAuthenticated || !$vuetify.breakpoint.xsOnly"
      clipped-left
      app
      dense
    >
      <v-btn to="/" text>
        <v-app-bar-title>Expense-tracker</v-app-bar-title>
      </v-btn>
      <v-spacer/>

      <v-btn
        v-if="isAuthenticated"
        icon
        class="mr-2"
        @click="logout"
      >
        <v-icon>mdi-logout</v-icon>
      </v-btn>
      <template v-else>
        <v-btn
          icon
          class="mr-2"
          to="/register"
        >
          <v-icon>mdi-account-plus</v-icon>
        </v-btn>
        <v-btn
          icon
          class="mr-2"
          to="/login"
        >
          <v-icon>mdi-login</v-icon>
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <page
        :navbar="$route.meta.navbar"
        :loading="$store.state.isLoading"
        :wide="$route.meta.wide"
        :slim="$route.meta.slim"
        :alert="$store.state.alert"
        :nav-links="navLinks"
        @clear-alert="$store.commit('clearAlert')"
      >
        <router-view/>
      </page>
    </v-main>

    <v-bottom-navigation
      v-if="isAuthenticated"
      class="d-flex d-sm-none"
      app
      shift
    >
      <template v-for="link in navLinks">
        <v-btn
          :key="link.to"
          :to="link.to"
          icon
        >
          <span>{{link.name}}</span>
          <v-icon class="mr-1">{{link.icon}}</v-icon>
        </v-btn>
      </template>
    </v-bottom-navigation>
  </v-app>
</template>

<script>
import Page from '@/components/Page'
import { VueOfflineMixin } from 'vue-offline'

export default {
  name: 'App',
  mixins: [VueOfflineMixin],
  components: {
    Page
  },
  mounted () {
    this.setTheme(this.darkMode)
    if (!this.userId) {
      this.$store.commit('loading')
    }
    this.$store.dispatch('getUser')
  },
  data: () => ({
    navLinks: [
      { to: '/analytics', name: 'Analytics', icon: 'mdi-chart-bar' },
      { to: '/transactions', name: 'Transactions', icon: 'mdi-bank-transfer' },
      { to: '/categories', name: 'Categories', icon: 'mdi-shape' },
      { to: '/settings', name: 'Settings', icon: 'mdi-account-cog' }
    ]
  }),
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    },
    darkMode () {
      return this.$store.state.user?.settings?.darkMode
    },
    userId () {
      return this.$store.state.user?.id
    }
  },
  watch: {
    isOnline (newVal) {
      this.$store.commit('setOnline', newVal)
    },
    isAuthenticated (newVal) {
      if (newVal === true) {
        this.$router.push('/analytics')
      }
      if (newVal === false) {
        this.$router.push('/login')
      }
    },
    darkMode (newVal) {
      this.setTheme(newVal)
    }
  },
  methods: {
    logout () {
      this.$store.dispatch('logout')
    },
    setTheme (newVal) {
      if (typeof newVal === 'boolean') {
        this.$vuetify.theme.dark = newVal
      } else {
        this.$vuetify.theme.dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      }
    }
  }
}
</script>
