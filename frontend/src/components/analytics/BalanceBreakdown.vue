<template>
  <div></div>
</template>

<script>
export default {
  name: 'BalanceBreakdown',
  props: {
    totalSpent: {
      type: String,
      required: true
    },
    totalEarned: {
      type: String,
      required: true
    },
    currency: {
      type: Object,
      required: true
    },
    windowHeight: {
      type: Number,
      required: true
    }
  },
  computed: {
    height () {
      if (this.windowHeight < 600) {
        return 170
      } else if (this.windowHeight < 700) {
        return 195
      } else if (this.windowHeight < 800) {
        return 220
      } else {
        return 290
      }
    },
    balance () {
      return Number(this.totalEarned) - Number(this.totalSpent)
    }
  }
}
</script>

<style lang="scss" scoped>
.balance-breakdown {

}
</style>
