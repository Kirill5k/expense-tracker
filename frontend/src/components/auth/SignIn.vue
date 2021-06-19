<template>
  <v-form
    ref="form"
    v-model="valid"
    lazy-validation
  >
    <v-text-field
      v-model="email"
      :error-messages="emailErrors"
      label="E-mail"
      :rules="emailRules"
      required
      @input="$v.email.$touch()"
      @blur="$v.email.$touch()"
    />

    <v-text-field
      v-model="password"
      :error-messages="emailErrors"
      :rules="passwordRules"
      label="Password"
      required
      @input="$v.email.$touch()"
      @blur="$v.email.$touch()"
    />

    <v-checkbox
      v-model="rememberMe"
      :error-messages="checkboxErrors"
      label="Remember me"
      required
      @change="$v.checkbox.$touch()"
      @blur="$v.checkbox.$touch()"
    ></v-checkbox>

    <v-btn
      color="primary"
      @click="submit"
    >
      Login
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
      v => !!v || 'Please enter your e-mail',
      v => /.+@.+\..+/.test(v) || 'E-mail must be valid'
    ],
    password: '',
    passwordRules: [
      v => !!v || 'Please enter your password'
    ],
    rememberMe: false
  }),
  methods: {
    submit () {
      this.$refs.form.validate()
    }
  }
}
</script>
