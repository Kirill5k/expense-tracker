<template>
  <v-row justify="center">
    <v-dialog
      transition="dialog-top-transition"
      v-model="dialog"
      max-width="400px"
      @click:outside="reset"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          color="primary"
          small
          absolute
          bottom
          right
          fab
          v-bind="attrs"
          v-on="on"
        >
          <v-icon dark>mdi-plus</v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-card-title>
          New transaction
        </v-card-title>
        <v-card-text>
          <v-form
            ref="newTransactionForm"
            v-model="valid"
            lazy-validation
          >
            <v-radio-group
              dense
              v-model="newTransaction.kind"
              row
            >
              <v-radio
                label="Expense"
                value="expense"
              ></v-radio>
              <v-radio
                label="Income"
                value="income"
              ></v-radio>
            </v-radio-group>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue darken-1"
            text
            @click="close"
          >
            Close
          </v-btn>
          <v-btn
            color="blue darken-1"
            text
            @click="save"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
const DEFAULT_TRANSACTION = {
  id: undefined,
  transactionId: null,
  amount: {},
  date: null,
  kind: 'expense'
}

export default {
  name: 'NewTransactionDialog',
  data: () => ({
    dialog: false,
    valid: true,
    newTransaction: { ...DEFAULT_TRANSACTION }
  }),
  methods: {
    reset () {
      this.newTransaction = { ...DEFAULT_TRANSACTION }
      this.valid = true
      this.$refs.newTransactionForm.resetValidation()
    },
    close () {
      this.reset()
      this.dialog = false
    },
    save () {
      console.log('save')
    }
  }
}
</script>
