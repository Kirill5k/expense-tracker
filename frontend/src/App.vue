<template>
  <v-app>
    <v-app-bar
      app
      color="white"
    >
      <v-app-bar-nav-icon></v-app-bar-nav-icon>

      <v-toolbar-title>Expense Tracker</v-toolbar-title>

      <v-spacer></v-spacer>

    </v-app-bar>

    <v-main class="grey lighten-3">
      <v-container fluid>
        <router-view/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>

export default {
  name: 'App',

  data: () => ({
    //
  })
}
</script>
