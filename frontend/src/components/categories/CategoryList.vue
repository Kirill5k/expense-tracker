<template>
  <v-list
    class="category-list"
    dense
  >
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
      bench="3"
      max-height="135"
      item-height="45"
    >
      <template v-slot:default="{ item }">
        <v-list-item
          @click="$emit('edit', item)"
          :key="item.id"
          class="pr-3"
          link
        >
          <v-list-item-icon>
            <v-icon v-text="item.icon"/>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title v-text="item.name"/>
          </v-list-item-content>

          <v-list-item-action class="mr-0 my-0">
              <div
                v-if="editable"
                class="text-center category-list__slider"
                :class="editable ? 'category-list__slider--slide-in' : 'category-list__slider--slide-out'"
              >
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

<style lang="scss">
.category-list {
  &__slider {
    transform: translateX(100%);
    -webkit-transform: translateX(100%);

    &--slide-in {
      animation: slide-in 0.5s forwards;
      -webkit-animation: slide-in 0.5s forwards;
    }

    &--slide-out {
      animation: slide-out 0.5s forwards;
      -webkit-animation: slide-out 0.5s forwards;
    }

    @keyframes slide-in {
      100% { transform: translateX(0%); }
    }

    @-webkit-keyframes slide-in {
      100% { -webkit-transform: translateX(0%); }
    }

    @keyframes slide-out {
      0% { transform: translateX(0%); }
      100% { transform: translateX(-100%); }
    }

    @-webkit-keyframes slide-out {
      0% { -webkit-transform: translateX(0%); }
      100% { -webkit-transform: translateX(-100%); }
    }
  }
}
</style>
