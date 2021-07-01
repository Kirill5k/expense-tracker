<template>
  <v-container
    class="register"
    fluid
  >
    <v-row
      justify="center"
    >
      <v-col
        cols="12"
        xs="9"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          :loading="loading"
          class="mx-auto"
        >
          <v-card-title>
            Create new account
          </v-card-title>

          <v-card-text>
            <sign-up
              :disabled="loading"
              @sign-up="register"
            />
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
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import SignUp from '@/components/auth/SignUp'

export default {
  name: 'Register',
  components: { SignUp },
  data: () => ({
    loading: false
  }),
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    }
  },
  methods: {
    login () {
      this.$store.commit('clearAlert')
      this.$router.push('/login')
    },
    register (account) {
      this.loading = true
      this.$store.commit('clearAlert')
      this.$store
        .dispatch('createAccount', account)
        .then(() => {
          const alert = {
            type: 'success',
            message: 'Account has been successfully created! Redirecting to the sign in page.'
          }
          this.$store.commit('setAlert', alert)
          setTimeout(() => this.login(), 1750)
        })
        .catch(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style lang="scss">
.register {

}
</style>
