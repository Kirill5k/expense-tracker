<template>
  <div>
      <v-card
        :loading="loading"
        class="transactions mx-auto"
        elevation="2"
      >
        <v-card-title class="py-1">
          Transactions
          <v-spacer></v-spacer>
          <transactions-sorter
            :sort-by="$store.state.sortBy"
            @sort="(sortBy) => $store.commit('sort', sortBy)"
            :disabled="loading"
          />
          <transactions-filter
            v-if="$store.getters.filteredCats.length"
            :categories="$store.getters.filteredCats"
            :filters="$store.state.filterBy"
            @filter="(filters) => $store.commit('filter', filters)"
            :disabled="loading"
          />
        </v-card-title>

        <v-card-text class="pb-0 px-0 px-sm-4">
          <date-period-selector
            :display-date="$store.state.displayDate"
            @update="updateDisplayDate"
            :disabled="loading"
          />

          <transaction-list
            :items="transactions"
            :window-height="windowHeight"
            @edit="edit"
            @delete="remove"
            @copy="copy"
          />
          <v-divider v-if="transactions.length"></v-divider>
        </v-card-text>

        <v-card-actions class="py-0">
          <div
            v-if="transactions.length"
            class="transactions__summary ml-16"
          >
            <v-chip
              small
              class="mx-2 px-4"
              color="success"
              outlined
            >
              <v-icon size="12">
                mdi-currency-{{currency.code.toLowerCase()}}
              </v-icon>
              <span>{{ $store.getters.totalEarned }}</span>
            </v-chip>

            <v-chip
              small
              class="mx-2 px-4"
              color="error"
              outlined
            >
              <v-icon size="12">
                mdi-currency-{{currency.code.toLowerCase()}}
              </v-icon>
              <span>{{ $store.getters.totalSpent }}</span>
            </v-chip>
          </div>

          <new-transaction-dialog
            ref="newTransactionDialog"
            :currency="currency"
            :expense-cats="$store.getters.expenseCats"
            :income-cats="$store.getters.incomeCats"
            :tags="$store.getters.tags"
            @save="(newTx) => dispatchAction('createTransaction', newTx)"
            @update="(tx) => dispatchAction('updateTransaction', tx)"
          />
        </v-card-actions>
      </v-card>
      <v-snackbar
        v-model="undoOp"
      >
        The transaction has been deleted
        <template v-slot:action="{ attrs }">
          <v-btn
            color="primary"
            text
            v-bind="attrs"
            @click="undoRemove"
          >
            Undo
          </v-btn>
          <v-btn
            color="success"
            text
            v-bind="attrs"
            @click="undoOp = null"
          >
            Close
          </v-btn>
        </template>
      </v-snackbar>
  </div>
</template>

<script>
import TransactionList from '@/components/transactions/TransactionList'
import TransactionsSorter from '@/components/transactions/TransactionsSorter'
import TransactionsFilter from '@/components/transactions/TransactionsFilter'
import NewTransactionDialog from '@/components/transactions/NewTransactionDialog'
import DatePeriodSelector from '@/components/DatePeriodSelector'
import ActionDispatcher from '@/mixins/dispatcher'
import DisplayAdjuster from '@/mixins/display'

export default {
  name: 'Transactions',
  components: {
    TransactionList,
    TransactionsSorter,
    NewTransactionDialog,
    DatePeriodSelector,
    TransactionsFilter
  },
  mixins: [ActionDispatcher, DisplayAdjuster],
  data: () => ({
    lastDeletedId: null
  }),
  computed: {
    transactions () {
      return this.$store.getters.displayedTransactions
    },
    currency () {
      return this.$store.state.user.settings.currency
    }
  },
  methods: {
    remove (id) {
      this
        .dispatchAction('hideTransaction', { id, hidden: true })
        .then(() => {
          this.lastDeletedId = id
          this.undoOp = true
        })
    },
    undoRemove () {
      if (this.lastDeletedId) {
        this.dispatchAction('hideTransaction', { id: this.lastDeletedId, hidden: false })
        this.lastDeletedId = null
      }
    },
    edit (transaction) {
      this.$refs.newTransactionDialog.update(transaction)
    },
    copy (transaction) {
      this.edit({ ...transaction, id: undefined })
    },
    updateDisplayDate (newRange) {
      this.$store.commit('setDisplayDate', newRange)
    }
  }
}
</script>

<style lang="scss">
.transactions {
  overflow: inherit;

  &__summary {
    width: 100%;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
}
</style>
