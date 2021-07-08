<template>
  <v-expansion-panels
    :value="value"
    @change="openPanel"
    accordion
    flat
  >
    <v-expansion-panel :key="0">
      <v-expansion-panel-header class="px-0">
        <template v-slot:default="{ open }">
          <v-row no-gutters>
            <v-col cols="4">
              Currency
            </v-col>
            <v-col
              cols="8"
              class="text--secondary text-right"
            >
              <v-fade-transition leave-absolute>
                <span
                  v-if="open"
                  key="0"
                >
                  Select a new currency
                </span>
                <span
                  v-else
                  key="1"
                >
                  {{ account.settings.currency.symbol }}
                </span>
              </v-fade-transition>
            </v-col>
          </v-row>
        </template>
      </v-expansion-panel-header>
      <v-expansion-panel-content color="grey lighten-5">
        <v-select
          name="currency"
          persistent-hint
          return-object
          :value="currentCurrency"
          :hint="currentCurrency.country"
          :items="currencies"
          item-text="symbol"
          @input="selectCurrency"
          single-line
        >
          <template slot="item" slot-scope="data">
            <span class="pr-2">{{ data.item.symbol }}</span>
            <span class="text-subtitle-2">{{ data.item.country }}</span>
          </template>
        </v-select>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel :key="1">
      <v-expansion-panel-header class="px-0">
        <template v-slot:default="{ open }">
          <v-row no-gutters>
            <v-col cols="10">
              Show future transactions
            </v-col>
            <v-col
              cols="2"
              class="text--secondary text-right"
            >
              <span
                v-if="!open"
                key="0"
              >
                  {{ showFutureTransactions ? 'Yes' : 'No' }}
                </span>
            </v-col>
          </v-row>
        </template>
      </v-expansion-panel-header>
      <v-expansion-panel-content color="grey lighten-5">
        <v-switch
          hide-details
          v-model="showFutureTransactions"
          :label="showFutureTransactions ? 'Yes' : 'No'"
          color="primary"
        ></v-switch>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
const CURRENCIES = [
  { code: 'GBP', symbol: '£', country: 'United Kingdom' },
  { code: 'USD', symbol: '$', country: 'United States' }
]

export default {
  name: 'InterfaceSettings',
  props: {
    account: {
      type: Object,
      required: true
    },
    value: {
      type: Number,
      require: true
    }
  },
  data: () => ({
    currencies: CURRENCIES,
    showFutureTransactions: true
  }),
  computed: {
    currentCurrency () {
      return this.currencies.find(c => c.code === this.account.settings.currency.code)
    }
  },
  methods: {
    selectCurrency (newCurrency) {
      console.log(newCurrency)
    },
    openPanel (panel) {
      this.$emit('input', panel)
    }
  }
}
</script>
