<template>
  <v-list dense>
    <v-subheader>{{name}}</v-subheader>
    <v-divider></v-divider>
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
      max-height="120"
      item-height="40"
    >
      <template v-slot:default="{ item }">
        <v-list-item :key="item.id">
          <v-list-item-icon>
            <v-icon v-text="item.icon"/>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title v-text="item.name"/>
          </v-list-item-content>

          <v-list-item-action class="mr-0 my-0">
            <v-slide-x-reverse-transition>
            <div v-if="editable" class="text-center">
              <v-btn
                icon
                dark
                color="blue"
                x-small
                @click="$emit('edit', item)"
              >
                <v-icon dark>
                  mdi-pencil
                </v-icon>
              </v-btn>
              <v-btn
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
            </div>
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
    name: {
      type: String,
      required: true
    },
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
