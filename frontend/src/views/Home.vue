<template>
  <v-container
    class="home"
    fluid
  >
    <v-row justify="center">
      <v-col cols="2">
        <v-card
          class="mx-auto"
          outlined
        >
          <v-list-item three-line>
            <v-list-item-content>
              <div class="text-overline mb-4">
                OVERLINE
              </div>
              <v-list-item-title class="text-h5 mb-1">
                Headline 5
              </v-list-item-title>
              <v-list-item-subtitle>Greyhound divisely hello coldly fonwderfully</v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-avatar
              tile
              size="80"
              color="grey"
            ></v-list-item-avatar>
          </v-list-item>

          <v-card-actions>
            <v-btn
              outlined
              rounded
              text
            >
              Button
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="5">
        <categories
          :items="categories"
          @create="createCategory"
          @delete="deleteCategory"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Categories from '@/components/categories/Categories'

export default {
  name: 'Home',
  components: {
    Categories
  },
  data: () => ({
    loading: false
  }),
  computed: {
    categories () {
      return this.$store.state.categories
    }
  },
  methods: {
    createCategory (newCategory) {
      this.loading = true
      this.$store
        .dispatch('createCategory', newCategory)
        .then(() => {
          this.loading = false
        })
    },
    deleteCategory (id) {
      this.loading = true
      this.$store
        .dispatch('deleteCategory', id)
        .then(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style lang="scss">
.home {

}
</style>
