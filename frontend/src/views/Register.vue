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
        <div class="register__alert">
          <v-alert
            v-if="alert.message"
            dense
            outlined
            :type="alert.type"
            close-text="Hide"
            dismissible
            @click="alert = {}"
          >
            {{ alert.message }}
          </v-alert>
        </div>
        <v-card
          :loading="loading"
          class="mx-auto"
        >
          <v-card-title>
            Create new account
          </v-card-title>

          <v-card-text>
            <sign-up
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
    loading: false,
    alert: {}
  }),
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    }
  },
  methods: {
    login () {
      this.$router.push('/login')
    },
    register (account) {
      this.loading = true
      this.alert = {}
      this.$store
        .dispatch('createAccount', account)
        .then(() => {
          this.alert = {
            type: 'success',
            message: 'Account has been successfully created! Redirecting to the sign in page.'
          }
          setTimeout(() => this.login(), 2500)
        })
        .catch(err => {
          this.loading = false
          this.alert = {
            message: err.toString(),
            type: 'error'
          }
        })
    }
  }
}
</script>

<style lang="scss">
.register {

  &__alert {
    display: flex;
    flex-direction: column-reverse;
    height: 100px;
  }
}
</style>
