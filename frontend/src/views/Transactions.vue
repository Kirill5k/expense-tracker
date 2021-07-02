<template>
  <page>
    <v-card
      :loading="loading"
      class="transactions mx-auto"
    >
      <v-card-title>
        Transactions
        <v-spacer></v-spacer>
        <v-btn
          class="mr-1"
          elevation="2"
          x-small
          text
          rounded
          plain
        >
          <v-icon>
            mdi-sort
          </v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pb-0">
        <date-period-selector
          :display-date="this.$store.state.displayDate"
          @update="updateDisplayDate"
        />

        <transaction-list
          :categories="$store.getters.catsByIds"
          :items="transactions"
          :editable="editable"
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
              mdi-currency-{{currencyName.toLowerCase()}}
            </v-icon>
            <span>{{ totalEarned }}</span>
          </v-chip>

          <v-chip
            small
            class="ma-2 px-4"
            color="pink"
            outlined
          >
            <v-icon>
              mdi-currency-{{currencyName.toLowerCase()}}
            </v-icon>
            <span>{{ totalSpent }}</span>
          </v-chip>

        </div>
        <v-spacer></v-spacer>
        <new-transaction-dialog
          ref="newTransactionDialog"
          :currency-name="currencyName"
          :expense-cats="$store.getters.expenseCats"
          :income-cats="$store.getters.incomeCats"
          @save="create"
          @update="update"
        />
      </v-card-actions>

    </v-card>
  </page>
</template>

<script>
import Page from '@/components/Page'
import TransactionList from '@/components/transactions/TransactionList'
import NewTransactionDialog from '@/components/transactions/NewTransactionDialog'
import DatePeriodSelector from '@/components/DatePeriodSelector'

export default {
  name: 'Transactions',
  components: {
    Page,
    TransactionList,
    NewTransactionDialog,
    DatePeriodSelector
  },
  data: () => ({
    loading: false,
    editable: false,
    currencyName: 'USD'
  }),
  computed: {
    transactions () {
      return this.$store.getters.displayedTransactions
    },
    totalSpent () {
      return this.getTotalAmount(this.transactions.filter(t => t.kind === 'expense'))
    },
    totalEarned () {
      return this.getTotalAmount(this.transactions.filter(t => t.kind === 'income'))
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
    remove (id) {
      this.dispatchAction('deleteTransaction', id)
    },
    update (updatedTransaction) {
      this.dispatchAction('updateTransaction', updatedTransaction)
    },
    edit (transaction) {
      this.$refs.newTransactionDialog.update(transaction)
    },
    updateDisplayDate (newRange) {
      this.editable = false
      this.$store.commit('setDisplayDate', newRange)
    },
    getTotalAmount (txs) {
      return txs.map(t => t.amount.value).reduce((acc, i) => acc + i, 0)
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
