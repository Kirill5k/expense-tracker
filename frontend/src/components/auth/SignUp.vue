<template>
  <v-form
    ref="signUpForm"
    v-model="valid"
    lazy-validation
  >
    <v-text-field
      v-model="firstName"
      :rules="rules.firstName"
      label="First name"
      required
    />

    <v-text-field
      v-model="lastName"
      :rules="rules.lastName"
      label="Last name"
      required
    />

    <v-text-field
      v-model="email"
      :rules="rules.email"
      label="Email"
      required
      autocomplete="new"
    />

    <v-text-field
      autocomplete="new-password"
      v-model="password"
      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
      :rules="rules.password"
      :type="showPassword ? 'text' : 'password'"
      label="Password"
      @click:append="showPassword = !showPassword"
      hint="Must be at least 8 characters including a number and an uppercase letter"
    />

    <v-text-field
      autocomplete="new"
      v-model="confirmPassword"
      :rules="rules.confirmPassword"
      type="password"
      label="Confirm password"
    />

    <v-btn
      color="success"
      @click="submit"
    >
      Register
    </v-btn>
  </v-form>
</template>

<script>
export default {
  name: 'SignUp',
  data: () => ({
    valid: true,
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  }),
  computed: {
    rules () {
      return {
        firstName: [v => !!v || 'Please enter your first name'],
        lastName: [v => !!v || 'Please enter your last name'],
        email: [
          v => !!v || 'Please enter your email',
          v => /.+@.+\..+/.test(v) || 'Email must be valid'
        ],
        password: [
          v => !!v || 'Please enter your password',
          v => v.length >= 8 || 'Must be at least 8 characters in length',
          v => /[A-Z].*\d|\d.*[A-Z]/.test(v) || 'Must contain at least 1 digit and 1 uppercase letter'
        ],
        confirmPassword: [v => v === this.password || 'Passwords do not match']
      }
    }
  },
  methods: {
    submit () {
      this.$refs.signUpForm.validate()
    }
  }
}
</script>
