<template>
  <v-container fluid>
    <v-card
      :loading="loading"
      class="mx-auto"
      max-width="374"
    >
      <v-card-title>
        Sign in into your account
      </v-card-title>

      <v-card-text>
        <sign-in />
      </v-card-text>

      <v-divider></v-divider>

      <v-card-subtitle>
        New?
        <v-btn
          class="pl-0 pr-0"
          :style="{textTransform: 'unset'}"
          small
          color="primary"
          text
        >
          Create an account.
        </v-btn>
      </v-card-subtitle>
    </v-card>
  </v-container>
</template>

<script>
import SignIn from '@/components/auth/SignIn'

export default {
  name: 'Login',
  components: { SignIn },
  created () {
    if (this.isAuthenticated) {
      this.$router.push('home')
    }
  },
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    }
  }
}
</script>
