<template>
  <v-dialog
    v-model="show"
    width="70%"
  >
    <template v-slot:activator="{ on, attrs }">
      <a
        v-bind="attrs"
        v-on="on"
        href="#"
        @click.prevent="show = true"
      >
        terms and conditions
      </a>
    </template>
    <v-card>
      <v-card-title class="text-h6">
        Terms and conditions
      </v-card-title>
      <v-card-text
        v-for="n in 5"
        :key="n"
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.
        Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris.
        Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla.
        Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.
        Curabitur sodales ligula in libero. Sed dignissim lacinia nunc.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          text
          color="purple"
          @click="show = false"
        >
          Ok
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>

export default {
  name: 'TermsAndConditions',
  data: () => ({
    show: false
  })
}
</script>
