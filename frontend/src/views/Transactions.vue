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
        md="4"
        lg="3"
      >
        <v-card
          :loading="loading"
          class="mx-auto"
        >
          <v-card-title>
            Transactions
          </v-card-title>

        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

export default {
  name: 'Transactions',
  data: () => ({
    loading: false
  })
}
</script>

<style lang="scss">
.transactions {

}
</style>
