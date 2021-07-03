<template>
  <div class="transactions-chart">
  </div>
</template>

<script>

export default {
  name: 'TransactionsChart',
  props: {
    items: {
      type: Array,
      required: true
    },
    categories: {
      type: Object,
      required: true
    },
    currencyName: {
      type: String,
      required: true
    }
  },
  data: () => ({})
}
</script>

<style lang="scss">
.transactions-chart {

}
</style>
