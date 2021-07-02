<template>
  <v-container
    class="page mb-0 pb-0"
    fluid
  >
    <v-row justify="center">
      <v-col
        cols="12"
        xs="9"
        sm="6"
        md="5"
        lg="4"
      >
        <slot></slot>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'Page'
}
</script>

<style lang="scss">
.page {

}
</style>
