<template>
  <v-dialog
    bottom
    transition="dialog-bottom-transition"
    v-model="dialog"
    max-width="400px"
    @click:outside="reset"
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
      >
        <v-icon dark>mdi-plus</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        {{newCategory.id ? 'Edit category' : 'New category'}}
      </v-card-title>
      <v-card-text class="pb-0">
        <v-form
          ref="newCategoryForm"
          v-model="valid"
          lazy-validation
        >
          <v-btn-toggle
            borderless
            dense
            tile
            v-model="newCategory.kind"
            mandatory
          >
            <v-btn small value="expense">
              Expense
            </v-btn>
            <v-btn small value="income">
              Income
            </v-btn>
          </v-btn-toggle>
          <v-text-field
            name="name"
            v-model="newCategory.name"
            :rules="rules.name"
            label="Name"
            required
            counter
          />
          <v-color-picker
            v-model="newCategory.color"
            width="100%"
            dot-size="22"
            hide-inputs
            hide-canvas
            hide-mode-switch
            mode="hexa"
            swatches-max-height="250"
          />
          <v-input
            :value="newCategory.icon"
            class="pt-2"
            :rules="rules.icon"
          >
            <v-virtual-scroll
              :bench="1"
              :items="groupedIcons"
              height="120"
              item-height="40"
            >
              <template v-slot:default="{ item }">
                <v-row v-if="item.length" class="text-center" no-gutters>
                  <v-col
                    v-for="icon in item"
                    :key="icon.value"
                    cols="2"
                  >
                    <v-btn
                      :color="newCategory.icon === icon.value ? newCategory.color : ''"
                      :dark="newCategory.icon === icon.value"
                      :light="newCategory.icon !== icon.value"
                      elevation="2"
                      fab
                      x-small
                      :value="newCategory.icon"
                      @click="newCategory.icon = icon.value"
                    >
                      <v-icon>
                        {{ icon.value }}
                      </v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
                <v-row v-else no-gutters>
                  <v-card-text class="py-1">
                    <p class="text-subtitle-2 mb-0">{{ item.header }}</p>
                    <v-divider class="my-1"></v-divider>
                  </v-card-text>
                </v-row>
              </template>
            </v-virtual-scroll>
          </v-input>
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
const DEFAULT_CATEGORY = {
  id: undefined,
  icon: '',
  name: '',
  kind: 'expense',
  color: '#6200EE'
}

const ICONS = [
  { header: 'Banking', divider: true },
  { value: 'mdi-bank-transfer' },
  { value: 'mdi-bank-transfer-in' },
  { value: 'mdi-bank-transfer-out' },
  { value: 'mdi-account-cash' },
  { value: 'mdi-credit-card' },
  { value: 'mdi-bank' },
  { value: 'mdi-cash' },
  { value: 'mdi-chart-areaspline' },
  { value: 'mdi-finance' },
  { value: 'mdi-piggy-bank' },
  { value: 'mdi-safe' },
  { value: 'mdi-wallet' },
  { value: 'mdi-send' },
  { value: 'mdi-currency-eur' },
  { value: 'mdi-currency-gbp' },
  { value: 'mdi-currency-usd' },
  { value: 'mdi-bitcoin' },
  { header: 'Entertainment', divider: true },
  { value: 'mdi-camera' },
  { value: 'mdi-cellphone' },
  { value: 'mdi-guitar-acoustic' },
  { value: 'mdi-headphones' },
  { value: 'mdi-microphone' },
  { value: 'mdi-monitor' },
  { value: 'mdi-music' },
  { value: 'mdi-piano' },
  { value: 'mdi-tablet' },
  { value: 'mdi-television' },
  { value: 'mdi-google-controller' },
  { value: 'mdi-watch' },
  { header: 'Food, drink', divider: true },
  { value: 'mdi-beer' },
  { value: 'mdi-bottle-soda' },
  { value: 'mdi-bowl-mix' },
  { value: 'mdi-coffee' },
  { value: 'mdi-cookie' },
  { value: 'mdi-cup' },
  { value: 'mdi-cupcake' },
  { value: 'mdi-fish' },
  { value: 'mdi-food-fork-drink' },
  { value: 'mdi-glass-cocktail' },
  { value: 'mdi-grill' },
  { value: 'mdi-silverware' },
  { value: 'mdi-hamburger' },
  { value: 'mdi-pizza' },
  { header: 'Holiday', divider: true },
  { value: 'mdi-bed-double' },
  { value: 'mdi-cake' },
  { value: 'mdi-coffin' },
  { value: 'mdi-firework' },
  { value: 'mdi-food-turkey' },
  { value: 'mdi-gift' },
  { value: 'mdi-halloween' },
  { value: 'mdi-party-popper' },
  { value: 'mdi-pine-tree' },
  { value: 'mdi-snowflake' },
  { header: 'Household', divider: true },
  { value: 'mdi-antenna' },
  { value: 'mdi-water' },
  { value: 'mdi-flash' },
  { value: 'mdi-fire' },
  { value: 'mdi-home' },
  { value: 'mdi-lightbulb' },
  { value: 'mdi-umbrella' },
  { value: 'mdi-water-pump' },
  { value: 'mdi-web' },
  { value: 'mdi-wifi' },
  { value: 'mdi-baby-carriage' },
  { value: 'mdi-shield-car' },
  { value: 'mdi-garage' },
  { value: 'mdi-cog' },
  { value: 'mdi-wrench' },
  { value: 'mdi-hammer' },
  { header: 'Shopping', divider: true },
  { value: 'mdi-basket' },
  { value: 'mdi-hanger' },
  { value: 'mdi-cart' },
  { value: 'mdi-cash-register' },
  { value: 'mdi-shopping' },
  { value: 'mdi-store' },
  { value: 'mdi-wallet-giftcard' },
  { value: 'mdi-pill' },
  { value: 'mdi-tag' },
  { header: 'Sport', divider: true },
  { value: 'mdi-basketball' },
  { value: 'mdi-bike' },
  { value: 'mdi-bowling' },
  { value: 'mdi-dumbbell' },
  { value: 'mdi-run' },
  { value: 'mdi-soccer' },
  { value: 'mdi-tennis' },
  { value: 'mdi-trophy' },
  { value: 'mdi-yoga' },
  { header: 'Transport, travel', divider: true },
  { value: 'mdi-ticket' },
  { value: 'mdi-airplane' },
  { value: 'mdi-ambulance' },
  { value: 'mdi-bag-carry-on' },
  { value: 'mdi-bag-suitcase' },
  { value: 'mdi-bus' },
  { value: 'mdi-car' },
  { value: 'mdi-rocket' },
  { value: 'mdi-train' },
  { value: 'mdi-tram' },
  { value: 'mdi-walk' },
  { value: 'mdi-van-passenger' },
  { value: 'mdi-van-utility' },
  { value: 'mdi-gas-station' },
  { value: 'mdi-taxi' },
  { value: 'mdi-palm-tree' }
]

export default {
  name: 'NewCategoryDialog',
  data: () => ({
    dialog: false,
    valid: true,
    icons: ICONS,
    rules: {
      name: [
        v => !!v || 'Please enter a name for the new category',
        v => v.length <= 25 || 'Max 25 characters'
      ],
      icon: [v => !!v || 'Please select an icon']
    },
    newCategory: {
      ...DEFAULT_CATEGORY
    }
  }),
  computed: {
    groupedIcons () {
      return this.icons
        .reduce((res, item) => {
          if (item.divider === true) {
            res.push(item)
          } else {
            const pos = res.length - 1
            if (!res[pos]) {
              res[pos] = []
            }
            if (res[pos].length < 6) {
              res[pos].push(item)
            } else {
              res.push([item])
            }
          }
          return res
        }, [])
    }
  },
  methods: {
    reset () {
      this.newCategory = { ...DEFAULT_CATEGORY }
      this.valid = true
      this.$refs.newCategoryForm.resetValidation()
    },
    close () {
      this.reset()
      this.dialog = false
    },
    save () {
      if (this.$refs.newCategoryForm.validate()) {
        if (this.newCategory.id) {
          this.$emit('update', this.newCategory)
        } else {
          this.$emit('save', this.newCategory)
        }
        this.close()
      }
    },
    update (category) {
      this.newCategory = { ...category }
      this.dialog = true
    }
  }
}
</script>
