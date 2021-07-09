<template>
  <v-list
    class="category-list"
    dense
  >
    <v-list-item
      dense
      v-if="!items.length"
    >
      <v-list-item-subtitle
        class="text-center"
      >
        No categories in this group
      </v-list-item-subtitle>
    </v-list-item>
    <v-virtual-scroll
      :items="items"
      bench="3"
      max-height="585"
      item-height="45"
    >
      <template v-slot:default="{ item }">

        <v-list-item
          @click="editable ? '' : $emit('edit', item)"
          :key="item.id"
          class="pr-3 pl-0"
          link
        >

          <v-list-item-icon>
            <v-slide-x-transition>
              <v-btn
                v-if="editable"
                class="mr-2 pl-2 ml-2 mt-0"
                icon
                dark
                color="red"
                x-small
                @click="$emit('delete', item.id)"
              >
                <v-icon dark>
                  mdi-trash-can-outline
                </v-icon>
              </v-btn>
            </v-slide-x-transition>
            <v-icon
              :color="item.color"
              class="pl-3"
              v-text="item.icon"
            />
          </v-list-item-icon>
          <v-list-item-content class="flex-nowrap">
            <v-list-item-title v-text="item.name" class="d-flex"/>
            <v-list-item-subtitle v-text="item.kind" class="text-right font-weight-light text-capitalize"/>
          </v-list-item-content>

          <v-list-item-action
            class="mt-0 mb-1"
            :class="!editable ? 'd-none' : ''"
          >
            <v-slide-x-reverse-transition>
              <v-btn
                v-if="editable"
                class="mr-0 pl-2 ml-0 mt-0 pr-2"
                icon
                dark
                color="black"
                x-small
                @click="$emit('edit', item)"
              >
                <v-icon dark>
                  mdi-chevron-right
                </v-icon>
              </v-btn>
            </v-slide-x-reverse-transition>
          </v-list-item-action>
        </v-list-item>

        <v-divider></v-divider>
      </template>
    </v-virtual-scroll>
  </v-list>
</template>

<script>
export default {
  name: 'CategoryList',
  props: {
    items: {
      type: Array,
      required: true
    },
    editable: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    selectedItem: null
  })
}
</script>

<style lang="scss">
.category-list {
}
</style>
