<template>
  <page>
    <v-card
      :loading="loading"
      class="analytics mx-auto"
    >
      <v-card-title>
        Analytics
      </v-card-title>

      <v-card-text>
        <date-period-selector
          :display-date="$store.state.displayDate"
          @update="updateDisplayDate"
        />
        <transactions-chart
          :display-date="$store.state.displayDate"
          :currency="$store.state.account.settings.currency"
          :categories="$store.getters.catsByIds"
          :current-items="$store.getters.expenseTransactions.current"
          :previous-items="$store.getters.expenseTransactions.previous"
          :total-amount="$store.getters.totalSpent.current"
          :previous-total-amount="$store.getters.totalSpent.previous"
        />
        <p class="text-subtitle-2 ml-2 mb-0 mt-1">Spending breakdown</p>
        <transactions-breakdown
          :currency="$store.state.account.settings.currency"
          :categories="$store.getters.catsByIds"
          :items="$store.getters.expenseTransactions.current"
          :total-amount="$store.getters.totalSpent.current"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <new-transaction-dialog
          :currency="$store.state.account.settings.currency"
          :expense-cats="$store.getters.expenseCats"
          :income-cats="$store.getters.incomeCats"
          @save="create"
        />
      </v-card-actions>
    </v-card>
  </page>
</template>

<script>
import Page from '@/components/Page'
import DatePeriodSelector from '@/components/DatePeriodSelector'
import TransactionsChart from '@/components/analytics/TransactionsChart'
import TransactionsBreakdown from '@/components/analytics/TransactionsBreakdown'
import NewTransactionDialog from '@/components/transactions/NewTransactionDialog'

export default {
  name: 'Analytics',
  components: {
    Page,
    DatePeriodSelector,
    TransactionsBreakdown,
    TransactionsChart,
    NewTransactionDialog
  },
  data: () => ({
    loading: false
  }),
  methods: {
    dispatchAction (name, arg) {
      this.loading = true
      return this.$store
        .dispatch(name, arg)
        .catch(() => {})
        .then(() => {
          this.loading = false
        })
    },
    create (newTransaction) {
      this.dispatchAction('createTransaction', newTransaction)
    },
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
