<template>
  <v-card
    :loading="loading"
    class="analytics mx-auto"
    elevation="8"
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
      class="mt-2"
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
        Spending
      </v-tab>
    </v-tabs>

    <v-card-text class="pt-0">
      <v-tabs-items v-model="tab">
        <v-tab-item
          :key="0"
        >
          <transactions-chart
            :window-height="$vuetify.breakpoint.height"
            :dark="$vuetify.theme.dark"
            v-if="$store.state.displayDate.previous"
            :key="$store.state.displayDate.text"
            :display-date="$store.state.displayDate"
            :currency="$store.state.user.settings.currency"
            :categories="$store.getters.catsByIds"
            :current-items="$store.getters.expenseTransactions.current"
            :previous-items="$store.getters.expenseTransactions.previous"
            :total-amount="$store.getters.totalSpent"
          />
          <p class="text-subtitle-2 ml-2 mb-0 mt-1">Spending breakdown</p>
          <transactions-breakdown
            :window-height="$vuetify.breakpoint.height"
            :currency="$store.state.user.settings.currency"
            :categories="$store.getters.catsByIds"
            :items="$store.getters.expenseTransactions.current"
            :total-amount="$store.getters.totalSpent"
          />
        </v-tab-item>

        <v-tab-item
          :key="1"
        >
          <p>Earnings</p>
        </v-tab-item>

        <v-tab-item
          :key="2"
        >
          <p>Spending</p>
        </v-tab-item>
      </v-tabs-items>
    </v-card-text>

    <v-card-actions>
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
import TransactionsChart from '@/components/analytics/TransactionsChart'
import TransactionsBreakdown from '@/components/analytics/TransactionsBreakdown'
import NewTransactionDialog from '@/components/transactions/NewTransactionDialog'
import TransactionsFilter from '@/components/transactions/TransactionsFilter'

export default {
  name: 'Analytics',
  components: {
    DatePeriodSelector,
    TransactionsBreakdown,
    TransactionsChart,
    NewTransactionDialog,
    TransactionsFilter
  },
  data: () => ({
    loading: false,
    tab: 0
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

<style lang="scss" scoped>
.analytics {
  &__tab {
    width: 20px;
  }
}
</style>
