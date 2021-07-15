<template>
  <div
    class="balance-analysis"
  >
    <transactions-chart
      :key="displayDate.text"
      :display-date="displayDate"
      :window-height="windowHeight"
      :dark="dark"
      :currency="currency"
      :income-transactions="incomeTransactions"
      :expense-transactions="expenseTransactions"
    />
    <balance-breakdown
      :window-height="windowHeight"
      :dark="dark"
      :currency="currency"
      :total-earned="totalEarned"
      :total-spent="totalSpent"
    />
  </div>
</template>

<script>
import TransactionsChart from '@/components/analytics/TransactionsChart'
import BalanceBreakdown from '@/components/analytics/BalanceBreakdown'

export default {
  name: 'BalanceAnalysis',
  components: {
    BalanceBreakdown,
    TransactionsChart
  },
  props: {
    dark: {
      type: Boolean,
      required: true
    },
    windowHeight: {
      type: Number,
      required: true
    },
    currency: {
      type: Object,
      required: true
    },
    incomeTransactions: {
      type: Array,
      required: true
    },
    expenseTransactions: {
      type: Array,
      required: true
    },
    totalSpent: {
      type: String,
      required: true
    },
    totalEarned: {
      type: String,
      required: true
    },
    displayDate: {
      type: Object,
      required: true
    }
  },
  computed: {
  }
}
</script>

<style lang="scss">
.balance-analysis {

}
</style>
