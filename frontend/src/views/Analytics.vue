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
        <transactions-breakdown
          :currency-name="currencyName"
          :categories="$store.getters.catsByIds"
          :items="transactions.filter(t => t.kind === 'expense')"
        >

        </transactions-breakdown>
      </v-card-text>
    </v-card>
  </page>
</template>

<script>
import Page from '@/components/Page'
import DatePeriodSelector from '@/components/DatePeriodSelector'
import TransactionsBreakdown from '@/components/analytics/TransactionsBreakdown'

export default {
  name: 'Analytics',
  components: {
    Page,
    DatePeriodSelector,
    TransactionsBreakdown
  },
  data: () => ({
    currencyName: 'USD'
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
