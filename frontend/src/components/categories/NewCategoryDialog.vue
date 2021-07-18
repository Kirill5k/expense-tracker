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
          x-small
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
                  <v-row class="text-center" no-gutters>
                    <v-col
                      v-for="icon in item"
                      :key="icon.value"
                      cols="2"
                    >
                      <v-btn
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
  </v-row>
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
  { header: 'Bills', divider: true },
  { value: 'mdi-antenna', text: 'antenna', disable: false },
  { value: 'mdi-flash', text: 'flash', disable: false },
  { value: 'mdi-fire', text: 'fire', disable: false },
  { value: 'mdi-home', text: 'home', disable: false },
  { value: 'mdi-lightbulb', text: 'lightbulb', disable: false },
  { value: 'mdi-umbrella', text: 'umbrella', disable: false },
  { value: 'mdi-water-pump', text: 'water-pump', disable: false },
  { value: 'mdi-web', text: 'web', disable: false },
  { value: 'mdi-wifi', text: 'wifi', disable: false },
  { header: 'Food, drink', divider: true },
  { value: 'mdi-beer', text: 'beer', disable: false },
  { value: 'mdi-bottle-soda', text: 'bottle-soda', disable: false },
  { value: 'mdi-bowl-mix', text: 'bowl-mix', disable: false },
  { value: 'mdi-coffee', text: 'coffee', disable: false },
  { value: 'mdi-cookie', text: 'cookie', disable: false },
  { value: 'mdi-cup', text: 'cup', disable: false },
  { value: 'mdi-cupcake', text: 'cupcake', disable: false },
  { value: 'mdi-fish', text: 'fish', disable: false },
  { value: 'mdi-food-fork-drink', text: 'food-fork-drink', disable: false },
  { value: 'mdi-glass-cocktail', text: 'glass-cocktail', disable: false },
  { value: 'mdi-grill', text: 'grill', disable: false },
  { value: 'mdi-hamburger', text: 'hamburger', disable: false },
  { header: 'Entertainment', divider: true },
  { value: 'mdi-camera', text: 'camera', disable: false },
  { value: 'mdi-cellphone', text: 'cellphone', disable: false },
  { value: 'mdi-guitar-acoustic', text: 'guitar-acoustic', disable: false },
  { value: 'mdi-headphones', text: 'headphones', disable: false },
  { value: 'mdi-microphone', text: 'microphone', disable: false },
  { value: 'mdi-monitor', text: 'monitor', disable: false },
  { value: 'mdi-music', text: 'music', disable: false },
  { value: 'mdi-piano', text: 'piano', disable: false },
  { value: 'mdi-tablet', text: 'tablet', disable: false },
  { value: 'mdi-television', text: 'television', disable: false },
  { value: 'mdi-watch', text: 'watch', disable: false },
  { header: 'Holiday', divider: true },
  { value: 'mdi-bed-double', text: 'bed-double', disable: false },
  { value: 'mdi-cake', text: 'cake', disable: false },
  { value: 'mdi-coffin', text: 'coffin', disable: false },
  { value: 'mdi-firework', text: 'firework', disable: false },
  { value: 'mdi-food-turkey', text: 'food-turkey', disable: false },
  { value: 'mdi-gift', text: 'gift', disable: false },
  { value: 'mdi-halloween', text: 'halloween', disable: false },
  { value: 'mdi-party-popper', text: 'party-popper', disable: false },
  { value: 'mdi-pine-tree', text: 'pine-tree', disable: false },
  { value: 'mdi-snowflake', text: 'snowflake', disable: false },
  { header: 'Money', divider: true },
  { value: 'mdi-account-cash', text: 'account-cash', disable: false },
  { value: 'mdi-bank', text: 'bank', disable: false },
  { value: 'mdi-bitcoin', text: 'bitcoin', disable: false },
  { value: 'mdi-cash', text: 'cash', disable: false },
  { value: 'mdi-credit-card', text: 'credit-card', disable: false },
  { value: 'mdi-currency-eur', text: 'currency-eur', disable: false },
  { value: 'mdi-currency-gbp', text: 'currency-gbp', disable: false },
  { value: 'mdi-currency-usd', text: 'currency-usd', disable: false },
  { value: 'mdi-finance', text: 'finance', disable: false },
  { value: 'mdi-piggy-bank', text: 'piggy-bank', disable: false },
  { value: 'mdi-safe', text: 'safe', disable: false },
  { value: 'mdi-wallet', text: 'wallet', disable: false },
  { header: 'Shopping', divider: true },
  { value: 'mdi-basket', text: 'basket', disable: false },
  { value: 'mdi-cart', text: 'cart', disable: false },
  { value: 'mdi-cash-register', text: 'cash-register', disable: false },
  { value: 'mdi-shopping', text: 'shopping', disable: false },
  { value: 'mdi-store', text: 'store', disable: false },
  { value: 'mdi-wallet-giftcard', text: 'wallet-giftcard', disable: false },
  { header: 'Sport', divider: true },
  { value: 'mdi-basketball', text: 'basketball', disable: false },
  { value: 'mdi-bike', text: 'bike', disable: false },
  { value: 'mdi-bowling', text: 'bowling', disable: false },
  { value: 'mdi-dumbbell', text: 'dumbbell', disable: false },
  { value: 'mdi-run', text: 'run', disable: false },
  { value: 'mdi-soccer', text: 'soccer', disable: false },
  { value: 'mdi-tennis', text: 'tennis', disable: false },
  { value: 'mdi-trophy', text: 'trophy', disable: false },
  { value: 'mdi-yoga', text: 'yoga', disable: false },
  { header: 'Travel', divider: true },
  { value: 'mdi-airplane', text: 'airplane', disable: false },
  { value: 'mdi-ambulance', text: 'ambulance', disable: false },
  { value: 'mdi-bag-carry-on', text: 'bag-carry-on', disable: false },
  { value: 'mdi-bag-suitcase', text: 'bag-suitcase', disable: false },
  { value: 'mdi-bus', text: 'bus', disable: false },
  { value: 'mdi-car', text: 'car', disable: false },
  { value: 'mdi-rocket', text: 'rocket', disable: false },
  { value: 'mdi-train', text: 'train', disable: false },
  { value: 'mdi-tram', text: 'tram', disable: false },
  { value: 'mdi-walk', text: 'walk', disable: false },
  { value: 'mdi-van-passenger', text: 'van-passenger', disable: false },
  { value: 'mdi-van-utility', text: 'van-utility', disable: false }
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
        .filter(i => i.divider !== true)
        .reduce((res, item, index) => {
          const chunkIndex = Math.floor(index / 6)
          if (!res[chunkIndex]) {
            res[chunkIndex] = []
          }
          res[chunkIndex].push(item)
          return res
        }, [])
    }
  },
  methods: {
    formatIconName (icon) {
      return icon.charAt(0).toUpperCase() + icon.slice(1).replaceAll('-', ' ')
    },
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
