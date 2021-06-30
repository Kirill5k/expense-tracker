<template>
  <v-container
    class="transactions"
    fluid
  >
    <v-row
      justify="center"
    >
      <v-col
        cols="12"
        xs="9"
        sm="6"
        md="5"
        lg="4"
      >
        <v-card
          :loading="loading"
          class="mx-auto"
        >

          <v-btn
            v-if="transactions.length"
            class="mt-5 mr-1"
            elevation="2"
            right
            x-small
            text
            absolute
            rounded
            plain
            @click="editable = !editable"
          >
            {{ editable ? 'Done' : 'Edit' }}
          </v-btn>

          <v-card-title>
            Transactions
          </v-card-title>

          <v-card-text>
            <date-period-selector
              current-date="July"
              :current-range="currentRange"
              @reset="resetRange"
            />
          </v-card-text>

          <v-card-text>
            <transaction-list
              :categories="catsByIds"
              :items="transactions"
              :editable="editable"
            />
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <new-transaction-dialog
              ref="newTransactionDialog"
              :expense-cats="expenseCats"
              :income-cats="incomeCats"
              @save="create"
              @edit="edit"
            />
          </v-card-actions>

        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import TransactionList from '@/components/transactions/TransactionList'
import NewTransactionDialog from '@/components/transactions/NewTransactionDialog'
import DatePeriodSelector from '@/components/DatePeriodSelector'

export default {
  name: 'Transactions',
  components: {
    TransactionList,
    NewTransactionDialog,
    DatePeriodSelector
  },
  data: () => ({
    loading: false,
    editable: false,
    currentRange: 'monthly'
  }),
  computed: {
    expenseCats () {
      return this.$store.getters.expenseCats
    },
    incomeCats () {
      return this.$store.getters.incomeCats
    },
    catsByIds () {
      return this.$store.getters.catsByIds
    },
    transactions () {
      return this.$store.state.transactions
    }
  },
  methods: {
    dispatchAction (name, arg) {
      this.loading = true
      return this.$store
        .dispatch(name, arg)
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
    resetRange (newRange) {
      this.currentRange = newRange
    }
  }
}
</script>

<style lang="scss">
.transactions {

}
</style>
