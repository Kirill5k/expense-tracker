<template>
  <v-card
    :loading="loading"
    class="account mx-auto"
    elevation="8"
  >
    <v-card-title>
      Account
    </v-card-title>
  </v-card>
</template>

<script>
export default {
  name: 'Account',
  data: () => ({
    loading: false,
    editable: false
  })
}
</script>

<style lang="scss">
.account {

}
</style>
