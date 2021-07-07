<template>
  <div
    class="loading-spinner d-flex justify-center align-center"
    style="height: 70%"
  >
    <v-progress-circular
      size="70"
      width="7"
      color="primary"
      indeterminate
    />
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner'
}
</script>

<style lang="scss">
.loading-spinner {

}
</style>
