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

            <v-menu
              v-model="datePicker"
              :close-on-content-click="false"
              :nudge-right="40"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  name="date"
                  v-model="formattedDate"
                  :rules="rules.date"
                  label="Date"
                  prepend-icon="mdi-calendar"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                />
              </template>
              <v-date-picker
                v-model="newTransaction.date"
                @input="datePicker = false"
                min="2000-01-01"
              />
            </v-menu>

            <v-select
              name="category"
              v-model="newTransaction.categoryId"
              :rules="rules.category"
              :items="selectItems"
              label="Category"
              required
            >
              <template slot="selection" slot-scope="data">
                <span class="mt-1 mb-1">
                  <v-icon class="mr-2">{{data.item.text.icon}}</v-icon>{{ data.item.text.name }}
                </span>
              </template>
              <template slot="item" slot-scope="data">
                <span>
                  <v-icon class="mr-2">{{data.item.text.icon}}</v-icon>{{ data.item.text.name }}
                </span>
              </template>
            </v-select>

            <v-text-field
              label="Amount"
              v-model="newTransaction.amount"
              type="number"
              :prefix="currencySymbol"
              :rules="rules.amount"
            />

            <v-textarea
              rows="2"
              counter
              label="Note"
              v-model="newTransaction.note"
              :rules="rules.note"
            ></v-textarea>
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
  categoryId: null,
  amount: null,
  date: new Date().toISOString().slice(0, 10),
  kind: 'expense',
  note: null
}

export default {
  name: 'NewTransactionDialog',
  props: {
    expenseCats: {
      type: Array,
      default: () => []
    },
    incomeCats: {
      type: Array,
      default: () => []
    },
    currencySymbol: {
      type: String,
      default: '$'
    },
    currencyName: {
      type: String,
      default: 'USD'
    }
  },
  data: () => ({
    dialog: false,
    datePicker: false,
    valid: true,
    newTransaction: { ...DEFAULT_TRANSACTION },
    rules: {
      category: [v => !!v || 'Please select a category'],
      date: [v => !!v || 'Please select the date when this transaction has occurred'],
      amount: [v => !!v || 'Please specify the amount'],
      note: [v => v === null || v.length <= 84 || 'Max 84 characters']
    }
  }),
  computed: {
    selectItems () {
      const raw = this.newTransaction.kind === 'expense' ? this.expenseCats : this.incomeCats
      return raw.map(c => ({ value: c.id, text: { ...c } }))
    },
    formattedDate () {
      if (this.newTransaction.date) {
        const [year, month, day] = this.newTransaction.date.split('-')
        return `${month}/${day}/${year}`
      } else {
        return null
      }
    }
  },
  watch: {
    'newTransaction.kind' () {
      this.newTransaction.categoryId = null
    }
  },
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
      if (this.$refs.newTransactionForm.validate()) {
        const newTx = { ...this.newTransaction, amount: { value: Number(this.newTransaction.amount), currency: this.currencyName } }
        if (newTx.id) {
          this.$emit('update', newTx)
        } else {
          this.$emit('save', newTx)
        }
        this.close()
      }
    }
  }
}
</script>
