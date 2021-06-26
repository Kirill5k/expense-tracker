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
        @delete="remove"
        @edit="edit"
      />
    </v-card-text>

    <v-card-text class="pt-0">
      <category-list
        name="INCOME"
        :items="incomeCats"
        :editable="editable"
        @delete="remove"
        @edit="edit"
      />
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <new-category-dialog
        :category="updatedCategory"
        @save="create"
      />
    </v-card-actions>
  </v-card>
</template>

<script>
import CategoryList from '@/components/categories/CategoryList'
import NewCategoryDialog from '@/components/categories/NewCategoryDialog'

export default {
  name: 'Categories',
  props: {
    items: {
      type: Array,
      required: true
    }
  },
  components: {
    CategoryList,
    NewCategoryDialog
  },
  data: () => ({
    editable: false,
    updatedCategory: null
  }),
  computed: {
    expenseCats () {
      return this.items.filter(c => c.kind === 'expense')
    },
    incomeCats () {
      return this.items.filter(c => c.kind === 'income')
    }
  },
  methods: {
    create (newCategory) {
      this.$emit('create', newCategory)
    },
    remove (id) {
      this.$emit('delete', id)
    },
    edit (category) {
      this.updatedCategory = category
    }
  }
}
</script>
