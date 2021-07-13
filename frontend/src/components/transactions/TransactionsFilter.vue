<template>
  <v-menu
    class="transactions-filter"
    nudge-bottom="24"
    bottom
    left
    rounded="md"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        class="mr-1"
        elevation="2"
        x-small
        text
        rounded
        plain
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>
          mdi-filter-menu-outline
        </v-icon>
      </v-btn>
    </template>

    <v-list
      class="transactions-filter__categories-select"
      dense
    >
      <v-subheader class="transactions-filter__menu-header ml-2 pb-0">Filter by</v-subheader>
      <v-virtual-scroll
        :bench="3"
        item-height="34"
        height="200"
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
    </v-list>
  </v-menu>
</template>

<script>

export default {
  name: 'TransactionsFilter',
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
    }
  },
  methods: {
    exclude (catId) {
      this.$emit('filter', this.filters.filter(c => c !== catId))
    },
    include (catId) {
      this.$emit('filter', [...this.filters, catId])
    }
  }
}
</script>

<style lang="scss">
.transactions-filter {
  &__menu-header {
    margin-bottom: -10px;
  }

  &__categories-select {
    width: 176px;
  }
}
</style>
