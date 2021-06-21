<template>
  <v-card
    elevation="2"
    outlined
    class="mx-auto"
  >
    <v-btn
      v-if="items.length"
      class="mt-5 mr-1"
      elevation="2"
      right
      x-small
      text
      absolute
      rounded
      plain
      @click="editable = !editable"
    >
      {{ editable ? 'Done' : 'Edit' }}
    </v-btn>
    <v-card-title>Categories</v-card-title>
    <v-card-text class="pb-0">
      <category-list
        name="EXPENSE"
        :items="expenseCats"
        :editable="editable"
      />
    </v-card-text>

    <v-card-text class="pt-0">
      <category-list
        name="INCOME"
        :items="incomeCats"
        :editable="editable"
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
    editable: false
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
