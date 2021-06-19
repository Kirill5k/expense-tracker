<template>
<form>
    <v-text-field
      v-model="email"
      :error-messages="emailErrors"
      label="E-mail"
      required
      @input="$v.email.$touch()"
      @blur="$v.email.$touch()"
    ></v-text-field>
    <v-text-field
      v-model="password"
      :error-messages="emailErrors"
      label="Password"
      required
      @input="$v.email.$touch()"
      @blur="$v.email.$touch()"
    ></v-text-field>
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
  </form>
</template>

<script>
import { required, digits, email, max, regex } from 'vee-validate/dist/rules'
import { extend, ValidationObserver, ValidationProvider, setInteractionMode } from 'vee-validate'

setInteractionMode('eager')

extend('required', {
  ...required,
  message: 'Please enter your {_field_}',
})

export default {
  name: 'SignIn',
  components: {
    ValidationProvider,
    ValidationObserver,
  },
  data: () => ({
    email: '',
    password: '',
    rememberMe: null
  }),
  methods: {
    submit () {
      this.$refs.observer.validate()
    }
  }
}
</script>
