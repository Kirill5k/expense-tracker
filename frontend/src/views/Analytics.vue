<template>
  <page>
    <v-card class="analytics mx-auto">
      <v-card-title>
        Analytics
      </v-card-title>

      <v-card-text>
        <date-period-selector
          :display-date="this.$store.state.displayDate"
          @update="updateDisplayDate"
        />
        <transactions-chart
          :display-date="this.$store.state.displayDate"
          :currency="$store.state.account.settings.currency"
          :categories="$store.getters.catsByIds"
          :items="$store.getters.expenseTransactions"
          :total-amount="$store.getters.totalSpent"
        />
        <transactions-breakdown
          :currency="$store.state.account.settings.currency"
          :categories="$store.getters.catsByIds"
          :items="$store.getters.expenseTransactions"
          :total-amount="$store.getters.totalSpent"
        >

        </transactions-breakdown>
      </v-card-text>
    </v-card>
  </page>
</template>

<script>
import Page from '@/components/Page'
import DatePeriodSelector from '@/components/DatePeriodSelector'
import TransactionsChart from '@/components/analytics/TransactionsChart'
import TransactionsBreakdown from '@/components/analytics/TransactionsBreakdown'

export default {
  name: 'Analytics',
  components: {
    Page,
    DatePeriodSelector,
    TransactionsBreakdown,
    TransactionsChart
  },
  data: () => ({
    currencyName: 'USD',
    currency: '$'
  }),
  computed: {
    transactions () {
      return this.$store.getters.displayedTransactions
    }
  },
  methods: {
    updateDisplayDate (newRange) {
      this.$store.commit('setDisplayDate', newRange)
    }
  }
}
</script>

<style lang="scss">
.analytics {

}
</style>
