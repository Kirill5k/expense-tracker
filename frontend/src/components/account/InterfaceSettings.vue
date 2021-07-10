<template>
  <v-expansion-panels
    :value="value"
    @change="openPanel"
    accordion
    flat
  >
    <v-expansion-panel :key="0">
      <v-expansion-panel-header
        class="px-0"
      >
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
                  {{ settings.currency.symbol }}
                </span>
              </v-fade-transition>
            </v-col>
          </v-row>
        </template>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-select
          class="pt-0 mt-0"
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
              Hide future transactions
            </v-col>
            <v-col
              cols="2"
              class="text--secondary text-right"
            >
              <span
                v-if="!open"
                key="0"
              >
                  {{ settings.hideFutureTransactions ? 'Yes' : 'No' }}
                </span>
            </v-col>
          </v-row>
        </template>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-switch
          class="pt-0 mt-0"
          :input-value="settings.hideFutureTransactions"
          :true-value="true"
          :false-value="false"
          hide-details
          :value="settings.hideFutureTransactions"
          :label="settings.hideFutureTransactions ? 'Yes' : 'No'"
          color="primary"
          @change="updateFutureTransactionsDisplay"
        ></v-switch>
      </v-expansion-panel-content>
    </v-expansion-panel>

    <v-expansion-panel :key="2">
      <v-expansion-panel-header class="px-0">
        <template v-slot:default="{ open }">
          <v-row no-gutters>
            <v-col cols="10">
              Dark mode
            </v-col>
            <v-col
              cols="2"
              class="text--secondary text-right"
            >
              <span
                v-if="!open"
                key="0"
              >
                  {{ settings.darkMode ? 'On' : 'Off' }}
                </span>
            </v-col>
          </v-row>
        </template>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-switch
          class="pt-0 mt-0"
          :input-value="settings.darkMode"
          :true-value="true"
          :false-value="false"
          hide-details
          :value="settings.darkMode"
          :label="settings.darkMode ? 'Yes' : 'No'"
          color="primary"
          @change="toggleDarkMode"
        ></v-switch>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
const CURRENCIES = [
  { country: 'United States dollar', code: 'USD', symbol: '$' },
  { country: 'Euro', code: 'EUR', symbol: '€' },
  { country: 'Pound sterling', code: 'GBP', symbol: '£' },
  { country: 'Japanese yen', code: 'JPY', symbol: '¥' },
  { country: 'South Korean won', code: 'KRW', symbol: '₩' },
  { country: 'Indian rupee', code: 'INR', symbol: '₹' },
  { country: 'Russian ruble', code: 'RUB', symbol: '₽' },
  { country: 'Turkish lira', code: 'TRY', symbol: '₺' }
]

export default {
  name: 'InterfaceSettings',
  props: {
    settings: {
      type: Object,
      required: true
    },
    value: {
      type: Number
    }
  },
  data: () => ({
    currencies: CURRENCIES
  }),
  computed: {
    currentCurrency () {
      return this.currencies.find(c => c.code === this.settings.currency.code)
    }
  },
  methods: {
    openPanel (panel) {
      this.$emit('input', panel)
    },
    selectCurrency (newCurrency) {
      this.$emit('update', { ...this.settings, currency: newCurrency })
    },
    updateFutureTransactionsDisplay (newValue) {
      this.$emit('update', { ...this.settings, hideFutureTransactions: newValue })
    },
    toggleDarkMode (newValue) {
      this.$emit('update', { ...this.settings, darkMode: newValue })
    }
  }
}
</script>
