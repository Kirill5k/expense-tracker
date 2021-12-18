<template>
  <v-dialog
    :fullscreen="$vuetify.breakpoint.xsOnly"
    bottom
    transition="dialog-bottom-transition"
    v-model="dialog"
    max-width="400px"
    @click:outside="close"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        class="float-right mx-2 my-1"
        color="primary"
        x-small
        bottom
        right
        fab
        v-bind="attrs"
        v-on="on"
        @click="open"
      >
        <v-icon dark>mdi-plus</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        {{ newTransaction.id ? 'Edit transaction' : 'New transaction' }}
      </v-card-title>
      <v-card-text>
        <v-form
          ref="newTransactionForm"
          v-model="valid"
          lazy-validation
        >
          <v-btn-toggle
            borderless
            dense
            tile
            v-model="newTransaction.kind"
            mandatory
          >
            <v-btn small value="expense">
              Expense
            </v-btn>
            <v-btn small value="income">
              Income
            </v-btn>
          </v-btn-toggle>

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
                <v-icon class="mr-2">{{ data.item.text.icon }}</v-icon>{{ data.item.text.name }}
              </span>
            </template>
            <template slot="item" slot-scope="data">
              <span>
                <v-icon class="mr-2">{{ data.item.text.icon }}</v-icon>{{ data.item.text.name }}
              </span>
            </template>
          </v-select>

          <v-text-field
            label="Amount"
            v-model="newTransaction.amount"
            type="number"
            min="0.01"
            :prepend-icon="'mdi-currency-' + currency.code.toLowerCase()"
            :rules="rules.amount"
          />

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

          <v-container fluid class="pa-0">
            <v-combobox
              class="pt-0"
              v-model="newTransaction.tags"
              :items="tags"
              :search-input.sync="search"
              hide-selected
              label="Tags"
              multiple
              persistent-hint
              small-chips
            >
              <template v-slot:no-data v-if="search">
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title class="text-center">
                      No results matching "<strong>{{ search }}</strong>"<br>Press <kbd>enter</kbd> to create a new one
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-combobox>
          </v-container>

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
</template>

<script>
export default {
  name: 'NewTransactionDialog',
  props: {
    tags: {
      type: Array,
      default: () => []
    },
    expenseCats: {
      type: Array,
      default: () => []
    },
    incomeCats: {
      type: Array,
      default: () => []
    },
    currency: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    search: null,
    dialog: false,
    datePicker: false,
    valid: true,
    newTransaction: {},
    rules: {
      category: [v => !!v || 'Please select a category'],
      date: [v => !!v || 'Please select the date when this transaction has occurred'],
      amount: [
        v => !!v || 'Please specify the amount',
        v => v > 0 || 'The amount must be greater than 0',
        v => v < 100000000 || 'The amount must be less than 100000000'
      ],
      note: [v => !v || v.length <= 84 || 'Max 84 characters']
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
        return `${day}/${month}/${year}`
      } else {
        return null
      }
    }
  },
  watch: {
    'newTransaction.kind' () {
      const catId = this.newTransaction.categoryId
      if (catId !== null && this.selectItems.find(i => i.value === catId) === undefined) {
        this.newTransaction.categoryId = null
      }
    }
  },
  methods: {
    open () {
      this.newTransaction = {
        id: undefined,
        categoryId: null,
        amount: null,
        date: new Date().toISOString().slice(0, 10),
        kind: 'expense',
        tags: [],
        note: null
      }
    },
    close () {
      this.valid = true
      this.$refs.newTransactionForm.resetValidation()
      this.dialog = false
    },
    save () {
      if (this.$refs.newTransactionForm.validate()) {
        const amount = { value: Number(this.newTransaction.amount), currency: this.currency }
        const newTx = { ...this.newTransaction, amount }
        const event = newTx.id ? 'update' : 'save'
        this.$emit(event, newTx)
        this.close()
      }
    },
    update (tx) {
      this.newTransaction = { ...tx, amount: tx.amount.value, date: tx.date.slice(0, 10) }
      this.dialog = true
    }
  }
}
</script>
