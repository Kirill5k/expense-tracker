<template>
  <v-app>
    <v-app-bar
      v-if="isAuthenticated"
      app
      color="white"
    >
      <v-chip
        color="black"
        text-color="white"
        class="mr-2"
      >
        <v-avatar
          left
          class="mr-2"
          color="primary"
        >
          <v-icon dark large>
            mdi-account-circle
          </v-icon>
        </v-avatar>
        <strong>{{ name }}</strong>
      </v-chip>

      <v-spacer/>

      <v-btn
        icon
        class="mr-2"
        @click="logout"
      >
        <v-icon>mdi-logout</v-icon>
      </v-btn>

    </v-app-bar>

    <v-main class="grey lighten-3">
      <div
        v-if="isLoading"
        class="d-flex justify-center align-center"
        style="height: 70%"
      >
        <v-progress-circular
          size="70"
          width="7"
          color="primary"
          indeterminate
        />
      </div>
      <router-view
        v-else
      />
    </v-main>

    <v-bottom-navigation
      v-if="isAuthenticated"
      app
      shift
    >
      <v-btn
        to="/"
        icon
      >
        <span>Transactions</span>
        <v-icon class="mr-1">mdi-bank-transfer</v-icon>
      </v-btn>

      <v-btn
        to="/categories"
        icon
      >
        <span>Categories</span>
        <v-icon class="mr-1">mdi-shape</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script>

export default {
  name: 'App',
  created () {
    this.$store.dispatch('getAccount')
  },
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    },
    isLoading () {
      return this.$store.state.isLoading
    },
    name () {
      return this.isAuthenticated ? this.$store.state.account.firstName : ''
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
    }
  },
  methods: {
    logout () {
      this.$store.dispatch('logout')
    }
  }
}
</script>
