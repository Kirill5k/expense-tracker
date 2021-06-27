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
            <transaction-list
              :categories="catsByIds"
              :items="transactions"
            />
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <new-transaction-dialog
              ref="newTransactionDialog"
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

export default {
  name: 'Transactions',
  components: {
    TransactionList,
    NewTransactionDialog
  },
  data: () => ({
    loading: false,
    editable: false
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
  }
}
</script>

<style lang="scss">
.transactions {

}
</style>
