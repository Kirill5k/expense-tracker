<template>
  <v-form
    ref="signInForm"
    v-model="valid"
    lazy-validation
  >
    <v-text-field
      type="email"
      tabindex="1"
      name="email"
      autocomplete="email"
      outlined
      v-model="email"
      label="Email"
      :rules="emailRules"
      required
      placeholder=" "
      persistent-placeholder
    />

    <v-text-field
      tabindex="2"
      name="password"
      autocomplete="password"
      placeholder=" "
      persistent-placeholder
      outlined
      v-model="password"
      :rules="passwordRules"
      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
      :type="showPassword ? 'text' : 'password'"
      label="Password"
      hint="At least 8 characters"
      required
      @click:append="showPassword = !showPassword"
    />

    <v-btn
      tabindex="3"
      color="success"
      @click="signIn"
      :disabled="disabled"
    >
      Log in
    </v-btn>

    <v-btn
      tabindex="4"
      class="mt-1 pl-0 pr-0"
      :style="{textTransform: 'unset'}"
      right
      absolute
      small
      text
      color="primary"
      @click="resetPassword"
    >
      Forgot password?
    </v-btn>
  </v-form>
</template>

<script>
export default {
  name: 'SignIn',
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    valid: true,
    email: '',
    emailRules: [
      v => !!v || 'Please enter your email',
      v => /.+@.+\..+/.test(v) || 'Email must be valid'
    ],
    password: '',
    passwordRules: [
      v => !!v || 'Please enter your password'
    ],
    showPassword: false
  }),
  methods: {
    signIn () {
      if (this.$refs.signInForm.validate()) {
        const credentials = {
          email: this.email,
          password: this.password
        }
        this.$emit('sign-in', credentials)
      }
    },
    resetPassword () {
      this.$emit('reset-password')
    }
  }
}
</script>
