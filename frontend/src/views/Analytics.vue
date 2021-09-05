<template>
  <v-card
    :loading="loading"
    class="analytics mx-auto"
    elevation="2"
  >
    <v-card-title class="py-1">
      Analytics
      <v-spacer></v-spacer>
      <transactions-filter
        v-if="$store.getters.filteredCats.length"
        :categories="$store.getters.filteredCats"
        :filters="$store.state.filterBy"
        @filter="(filters) => $store.commit('filter', filters)"
      />
    </v-card-title>

    <v-card-text class="pb-0">
      <date-period-selector
        :display-date="$store.state.displayDate"
        @update="updateDisplayDate"
      />
    </v-card-text>

    <v-tabs
      class="mt-4"
      height="24"
      v-model="tab"
      grow
      slider-size="1"
    >
      <v-tab class="analytics__tab">
        Balance
      </v-tab>
      <v-tab class="analytics__tab">
        Earnings
      </v-tab>
      <v-tab class="analytics__tab">
        Spendings
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item
        :key="0"
      >
        <balance-analysis
          :key="$store.state.displayDate.text"
          :window-height="windowHeight"
          :dark="$vuetify.theme.dark"
          :display-date="$store.state.displayDate"
          :currency="$store.state.user.settings.currency"
          :income-transactions="$store.getters.incomeTransactions"
          :expense-transactions="$store.getters.expenseTransactions"
          :total-earned="$store.getters.totalEarned"
          :total-spent="$store.getters.totalSpent"
        />
      </v-tab-item>

      <v-tab-item
        :key="1"
      >
        <category-analysis
          :key="$store.state.displayDate.text"
          kind="income"
          :currency="$store.state.user.settings.currency"
          :window-height="windowHeight"
          :categories="$store.getters.catsByIds"
          :total-amount="$store.getters.totalEarned"
          :transactions="$store.getters.incomeTransactions"
          :dark="$vuetify.theme.dark"
        />
      </v-tab-item>

      <v-tab-item
        :key="2"
      >
        <category-analysis
          :key="$store.state.displayDate.text"
          kind="expense"
          :currency="$store.state.user.settings.currency"
          :window-height="windowHeight"
          :categories="$store.getters.catsByIds"
          :total-amount="$store.getters.totalSpent"
          :transactions="$store.getters.expenseTransactions"
          :dark="$vuetify.theme.dark"
        />
      </v-tab-item>
    </v-tabs-items>

    <v-card-actions class="py-0">
      <v-spacer></v-spacer>
      <new-transaction-dialog
        :currency="$store.state.user.settings.currency"
        :expense-cats="$store.getters.expenseCats"
        :income-cats="$store.getters.incomeCats"
        @save="create"
      />
    </v-card-actions>
  </v-card>
</template>

<script>
import DatePeriodSelector from '@/components/DatePeriodSelector'
import NewTransactionDialog from '@/components/transactions/NewTransactionDialog'
import TransactionsFilter from '@/components/transactions/TransactionsFilter'
import CategoryAnalysis from '@/components/analytics/CategoryAnalysis'
import BalanceAnalysis from '@/components/analytics/BalanceAnalysis'

export default {
  name: 'Analytics',
  components: {
    BalanceAnalysis,
    CategoryAnalysis,
    DatePeriodSelector,
    NewTransactionDialog,
    TransactionsFilter
  },
  data: () => ({
    loading: false,
    tab: 0
  }),
  computed: {
    windowHeight () {
      const height = this.$vuetify.breakpoint.height
      return this.$vuetify.breakpoint.xs ? height : (height - 100)
    }
  },
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

<style lang="scss" scoped>
.analytics {
  &__tab {
    width: 20px;
  }
}
</style>
