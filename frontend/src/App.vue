<template>
  <v-app>
    <v-app-bar
      clipped-left
      class="d-none d-md-block"
      app
      dense
    >
      <v-app-bar-title>Expense-tracker</v-app-bar-title>
      <v-spacer/>

      <v-btn
        icon
        class="mr-2"
        @click="logout"
      >
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main class="pt-0 pt-sm-12">
      <page
        :loading="$store.state.isLoading"
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
      class="d-flex d-md-none"
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

export default {
  name: 'App',
  components: {
    Page
  },
  created () {
    this.$store.dispatch('getAccount')
  },
  data: () => ({
    navLinks: [
      { to: '/', name: 'Analytics', icon: 'mdi-chart-bar' },
      { to: '/transactions', name: 'Transactions', icon: 'mdi-bank-transfer' },
      { to: '/categories', name: 'Categories', icon: 'mdi-shape' },
      { to: '/account', name: 'Settings', icon: 'mdi-account-cog' }
    ]
  }),
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    },
    darkMode () {
      return this.$store.state.account?.settings?.darkMode
    }
  },
  watch: {
    isAuthenticated (newVal) {
      if (newVal === true) {
        this.$router.push('/')
      }
      if (newVal === false) {
        this.$router.push('/login')
      }
    },
    darkMode (newVal) {
      if (typeof newVal === 'boolean') {
        this.$vuetify.theme.dark = newVal
      }
    }
  },
  methods: {
    logout () {
      this.$store.dispatch('logout')
    }
  }
}
</script>
