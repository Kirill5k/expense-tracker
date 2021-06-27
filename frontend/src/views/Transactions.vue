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
          <v-card-title>
            Transactions
          </v-card-title>

          <v-card-text>
            <transaction-list
              :categories="catsByIds"
              :items="transactions"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import TransactionList from '@/components/transactions/TransactionList'

export default {
  name: 'Transactions',
  components: {
    TransactionList
  },
  data: () => ({
    loading: false
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
