<template>
  <v-card
    elevation="2"
    outlined
    class="mx-auto"
  >
    <v-card-title>Categories</v-card-title>
  </v-card>
</template>

<script>
export default {
  name: 'Categories',
  props: {
    items: {
      type: Array,
      required: true
    }
  }
}
</script>
