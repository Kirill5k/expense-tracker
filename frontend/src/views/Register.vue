<template>
  <v-container fluid>
    <v-card
      :loading="loading"
      class="mx-auto"
      max-width="450"
    >
      <v-card-title>
        Create new account
      </v-card-title>

      <v-card-text>
        <sign-up />
      </v-card-text>

      <v-divider></v-divider>

      <v-card-subtitle>
        Already have an account?
        <v-btn
          class="pl-0 pr-0"
          :style="{textTransform: 'unset'}"
          small
          color="primary"
          text
          @click="login"
        >
          Sign in.
        </v-btn>
      </v-card-subtitle>
    </v-card>
  </v-container>
</template>

<script>
import SignUp from '@/components/auth/SignUp'

export default {
  name: 'Register',
  components: { SignUp },
  created () {
    if (this.isAuthenticated) {
      this.$router.push('home')
    }
  },
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    }
  },
  methods: {
    login () {
      this.$router.push('login')
    }
  }
}
</script>
