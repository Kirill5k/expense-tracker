<template>
  <v-card
    :loading="loading"
    class="transactions mx-auto"
    elevation="8"
  >
    <v-card-title class="py-1">
      Transactions
      <v-spacer></v-spacer>
      <transactions-sorter
        @sort="(sortBy) => $store.commit('sort', sortBy)"
      />
      <transactions-filter
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

      <transaction-list
        :categories="$store.getters.catsByIds"
        :sort-by="$store.state.sortBy"
        :items="transactions"
        :editable="editable"
        :window-height="$store.state.windowHeight"
        @edit="edit"
        @delete="remove"
      />
    </v-card-text>

    <v-divider></v-divider>
    <v-card-actions class="py-0">

      <v-btn
        v-if="transactions.length"
        color="primary"
        x-small
        absolute
        bottom
        left
        fab
        @click="editable = !editable"
      >
        <v-icon dark>{{ editable ? 'mdi-check' : 'mdi-pencil' }}</v-icon>
      </v-btn>

      <div
        v-if="transactions.length"
        class="transactions__summary"
      >
        <v-chip
          small
          class="ma-2 px-4"
          color="success"
          outlined
        >
          <v-icon>
            mdi-currency-{{currency.code.toLowerCase()}}
          </v-icon>
          <span>{{ $store.getters.totalEarned }}</span>
        </v-chip>

        <v-chip
          small
          class="ma-2 px-4"
          color="error"
          outlined
        >
          <v-icon>
            mdi-currency-{{currency.code.toLowerCase()}}
          </v-icon>
          <span>{{ $store.getters.totalSpent }}</span>
        </v-chip>

      </div>
      <v-spacer></v-spacer>
      <new-transaction-dialog
        ref="newTransactionDialog"
        :currency="currency"
        :expense-cats="$store.getters.expenseCats"
        :income-cats="$store.getters.incomeCats"
        @save="(newTx) => dispatchAction('createTransaction', newTx)"
        @update="(tx) => dispatchAction('updateTransaction', tx)"
      />
    </v-card-actions>

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
  </v-card>
</template>

<script>
import TransactionList from '@/components/transactions/TransactionList'
import TransactionsSorter from '@/components/transactions/TransactionsSorter'
import TransactionsFilter from '@/components/transactions/TransactionsFilter'
import NewTransactionDialog from '@/components/transactions/NewTransactionDialog'
import DatePeriodSelector from '@/components/DatePeriodSelector'

export default {
  name: 'Transactions',
  components: {
    TransactionList,
    TransactionsSorter,
    NewTransactionDialog,
    DatePeriodSelector,
    TransactionsFilter
  },
  data: () => ({
    lastDeletedId: null,
    undoOp: false,
    loading: false,
    editable: false
  }),
  computed: {
    transactions () {
      return this.$store.getters.displayedTransactions.current
    },
    currency () {
      return this.$store.state.account.settings.currency
    }
  },
  methods: {
    dispatchAction (name, arg) {
      this.undoOp = false
      this.loading = true
      return this.$store
        .dispatch(name, arg)
        .catch(() => {})
        .then(() => {
          this.loading = false
        })
    },
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
    updateDisplayDate (newRange) {
      this.editable = false
      this.$store.commit('setDisplayDate', newRange)
    }
  }
}
</script>

<style lang="scss">
.transactions {

  &__summary {
    width: 100%;
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
}
</style>
