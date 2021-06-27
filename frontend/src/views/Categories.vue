<template>
  <v-container
    class="categories"
    fluid
  >
    <v-row
      justify="center"
    >
      <v-col
        cols="12"
        xs="9"
        sm="6"
        md="5"
        lg="4"
      >
        <v-card
          :loading="loading"
          class="mx-auto"
        >
          <v-btn
            v-if="categories.length"
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
            <v-spacer></v-spacer>
            <new-category-dialog
              ref="newCategoryDialog"
              @update="update"
              @save="create"
            />
          </v-card-actions>

        </v-card>
      </v-col>
    </v-row>
  </v-container>
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
