<template>
  <options-selector
    class="transactions-filter"
    header="Filter by"
    icon="mdi-filter-menu-outline"
  >
    <v-list-item
      class="transactions-filter__select-all pt-0"
      :value="selectAll"
      :input-value="selectAll"
      @input="all"
    >
      <v-list-item-action class="ml-0 mr-2">
        <v-checkbox
          :input-value="selectAll"
          :value="selectAll"
          @change="all"
        />
      </v-list-item-action>
      <v-list-item-content>
        <v-list-item-title>Select all</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-divider></v-divider>

    <v-virtual-scroll
      :bench="3"
      item-height="38"
      height="160"
      :items="selections"
    >
      <template v-slot:default="{ item }">
        <v-list-item
          :key="item.id"
          :input-value="item.displayed"
          :value="item.displayed"
          @change="item.displayed ? exclude(item.id) : include(item.id)"
        >
          <v-list-item-action class="ml-0 mr-2">
            <v-checkbox
              :value="item.displayed"
              :input-value="item.displayed"
            />
          </v-list-item-action>
          <v-list-item-icon class="mb-0 mt-3">
            <v-icon
              small
              v-text="item.icon"
            />
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ item.name }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-virtual-scroll>
  </options-selector>
</template>

<script>
import OptionsSelector from '@/components/transactions/OptionsSelector'

export default {
  name: 'TransactionsFilter',
  components: { OptionsSelector },
  props: {
    categories: {
      type: Array,
      required: true
    },
    filters: {
      type: Array,
      required: true
    }
  },
  computed: {
    selections () {
      return this.categories.map(c => ({ ...c, displayed: this.filters.includes(c.id) }))
    },
    selectAll () {
      return this.filters.length === this.allCatIds.length
    },
    allCatIds () {
      return this.categories.map(c => c.id)
    }
  },
  methods: {
    all (selectAll) {
      console.log(selectAll)
      if (selectAll) {
        this.$emit('filter', this.allCatIds)
      } else {
        this.$emit('filter', [])
      }
    },
    exclude (catId) {
      this.$emit('filter', this.filters.filter(c => c !== catId))
    },
    include (catId) {
      this.$emit('filter', [...this.filters, catId])
    }
  }
}
</script>

<style lang="scss" scoped>
.transactions-filter {
  &__select-all {
    margin-top: -10px;
  }
}
</style>
