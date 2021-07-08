<template>
  <v-form
    ref="signUpForm"
    v-model="valid"
    lazy-validation
  >
    <v-text-field
      tabindex="1"
      name="firstName"
      autocomplete="given-name"
      v-model="firstName"
      :rules="rules.firstName"
      label="First name"
      required
    />

    <v-text-field
      tabindex="2"
      name="lastName"
      autocomplete="family-name"
      v-model="lastName"
      :rules="rules.lastName"
      label="Last name"
      required
    />

    <v-text-field
      tabindex="3"
      name="email"
      v-model="email"
      :rules="rules.email"
      label="Email"
      required
      autocomplete="email"
    />

    <v-text-field
      tabindex="4"
      name="password"
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
      tabindex="5"
      name="confirmPassword"
      autocomplete="new-password"
      v-model="confirmPassword"
      :rules="rules.confirmPassword"
      type="password"
      label="Confirm password"
      required
    />

    <v-checkbox
      tabindex="6"
      class="mb-1"
      dense
      v-model="accept"
      :rules="rules.accept"
      required
    >
      <template v-slot:label>
        <div @click.stop="">
          I accept
          <terms-and-conditions/>
        </div>
      </template>
    </v-checkbox>

    <v-btn
      tabindex="7"
      color="success"
      @click="signUp"
      :disabled="disabled"
    >
      Register
    </v-btn>
  </v-form>
</template>

<script>
import TermsAndConditions from '@/components/auth/TermsAndConditions'

export default {
  name: 'SignUp',
  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  },
  components: {
    TermsAndConditions
  },
  data: () => ({
    tsAndCs: false,
    valid: true,
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
    accept: false
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
          v => /[A-Z].*\d|\d.*[A-Z]/.test(v) || 'Must contain at least 1 digit and 1 uppercase letter',
          v => v.length < 60 || 'Your password is too long'
        ],
        confirmPassword: [
          v => !!v || 'Please enter your password',
          v => v === this.password || 'Passwords do not match'
        ],
        accept: [v => !!v || 'You must agree to our terms and conditions to continue!']
      }
    }
  },
  methods: {
    signUp () {
      if (this.$refs.signUpForm.validate()) {
        const newAccount = {
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          password: this.password
        }
        this.$emit('sign-up', newAccount)
      }
    }
  }
}
</script>
