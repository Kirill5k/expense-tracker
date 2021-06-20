<template>
  <v-form
    ref="signInForm"
    v-model="valid"
    lazy-validation
  >
    <v-text-field
      outlined
      v-model="email"
      label="Email"
      :rules="emailRules"
      required
      @input="$v.email.$touch()"
      @blur="$v.email.$touch()"
    />

    <v-text-field
      outlined
      v-model="password"
      :rules="passwordRules"
      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
      :type="showPassword ? 'text' : 'password'"
      label="Password"
      hint="At least 8 characters"
      required
      @input="$v.email.$touch()"
      @blur="$v.email.$touch()"
      @click:append="showPassword = !showPassword"
    />

    <v-btn
      color="success"
      @click="submit"
    >
      Sign in
    </v-btn>

    <v-btn
      class="mt-1 pl-0 pr-0"
      :style="{textTransform: 'unset'}"
      right
      absolute
      small
      text
      color="primary"
    >
      Forgot password?
    </v-btn>
  </v-form>
</template>

<script>
export default {
  name: 'SignIn',
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
    rememberMe: false,
    showPassword: false
  }),
  methods: {
    submit () {
      this.$refs.signInForm.validate()
    }
  }
}
</script>
