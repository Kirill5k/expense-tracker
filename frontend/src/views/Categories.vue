<template>
  <v-card
    :loading="loading"
    class="categories mx-auto"
    elevation="8"
  >
    <v-card-title>
      Categories
    </v-card-title>

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
      <v-btn
        v-if="categories.length"
        color="primary"
        x-small
        absolute
        bottom
        left
        fab
        @click="editable = !editable"
      >
        <v-icon dark>{{ editable ? 'mdi-check' : 'mdi-pencil' }}</v-icon>
      </v-btn>

      <v-spacer></v-spacer>
      <new-category-dialog
        ref="newCategoryDialog"
        @update="update"
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
  components: {
    CategoryList,
    NewCategoryDialog
  },
  data: () => ({
    loading: false,
    editable: false
  }),
  computed: {
    categories () {
      return this.$store.state.categories
    },
    expenseCats () {
      return this.$store.getters.expenseCats
    },
    incomeCats () {
      return this.$store.getters.incomeCats
    }
  },
  methods: {
    dispatchAction (name, arg) {
      this.loading = true
      return this.$store
        .dispatch(name, arg)
        .then(() => {
          this.loading = false
        })
    },
    create (newCategory) {
      this.dispatchAction('createCategory', newCategory)
    },
    remove (id) {
      this.dispatchAction('deleteCategory', id)
    },
    update (updatedCategory) {
      this.dispatchAction('updateCategory', updatedCategory)
    },
    edit (category) {
      this.$refs.newCategoryDialog.update(category)
    }
  }
}
</script>

<style lang="scss">
.categories {

}
</style>
