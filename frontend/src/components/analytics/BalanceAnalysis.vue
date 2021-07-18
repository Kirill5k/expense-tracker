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
    <v-card-title class="balance-analysis__current-balance py-0">
      {{sign}}{{currency.symbol}}{{balance}}
    </v-card-title>
    <v-card-subtitle class="text-subtitle-2 font-weight-light pb-1 pt-2">
      Balance for this period
    </v-card-subtitle>
    <v-card-text class="py-1">
      <v-divider></v-divider>
    </v-card-text>
    <div class="d-flex justify-space-between align-content-end">
      <v-card-subtitle class="py-0">
        Earned {{currency.symbol}}{{totalEarned}}
      </v-card-subtitle>
      <v-card-subtitle class="py-0">
        Spent {{currency.symbol}}{{totalSpent}}
      </v-card-subtitle>
    </div>
  </div>
</template>

<script>
import TransactionsChart from '@/components/analytics/TransactionsChart'

export default {
  name: 'BalanceAnalysis',
  components: {
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
    sign () {
      if (this.totalSpent > this.totalEarned) {
        return '-'
      } else {
        return ''
      }
    },
    balance () {
      return Math.abs(Number(this.totalEarned) - Number(this.totalSpent))
    }
  }
}
</script>

<style lang="scss">
.balance-analysis {

  &__current-balance {
    margin-top: -30px;
  }
}
</style>
