<template>
  <v-card
    elevation="2"
    outlined
    class="mx-auto"
  >
    <v-card-title>Categories</v-card-title>

    <v-card-text>
      <category-list
        name="EXPENSE"
        :items="expenseCats"
      />
    </v-card-text>

    <v-card-text>
      <category-list
        name="INCOME"
        :items="incomeCats"
      />
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>

      <v-btn
        color="primary"
        small
        absolute
        bottom
        right
        fab
      >
        <v-icon dark>mdi-plus</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import CategoryList from '@/components/categories/CategoryList'

export default {
  name: 'Categories',
  props: {
    items: {
      type: Array,
      required: true
    }
  },
  components: {
    CategoryList
  },
  data: () => ({
    selectedItem: null
  }),
  computed: {
    expenseCats () {
      return this.items.filter(c => c.kind === 'expense')
    },
    incomeCats () {
      return this.items.filter(c => c.kind === 'income')
    }
  }
}
</script>
