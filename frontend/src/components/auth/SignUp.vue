<template>
  <v-form
    ref="signInForm"
    v-model="valid"
    lazy-validation
  >
  </v-form>
</template>

<script>
export default {
  name: 'SignUp',
  data: () => ({
    valid: true
  })
}
</script>
