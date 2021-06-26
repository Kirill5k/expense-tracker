<template>
  <v-card
    elevation="2"
    outlined
    class="mx-auto"
    :loading="loading"
  >
    <v-card-title>Transactions</v-card-title>

  </v-card>
</template>

<script>

export default {
  name: 'Transactions',
  props: {
    items: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    editable: false
  })
}
</script>
