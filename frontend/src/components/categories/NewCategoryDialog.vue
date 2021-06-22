<template>
  <v-row justify="center">
    <v-dialog
      transition="dialog-top-transition"
      v-model="dialog"
      max-width="400px"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          color="primary"
          small
          absolute
          bottom
          right
          fab
          v-bind="attrs"
          v-on="on"
        >
          <v-icon dark>mdi-plus</v-icon>
        </v-btn>
      </template>
      <v-card>
        <v-card-title>
          New category
        </v-card-title>
        <v-card-text>
          <v-form
            ref="newCategoryForm"
            v-model="valid"
            lazy-validation
          >
            <v-radio-group
              dense
              v-model="kind"
              row
            >
              <v-radio
                label="Expense"
                value="expense"
              ></v-radio>
              <v-radio
                label="Income"
                value="income"
              ></v-radio>
            </v-radio-group>
            <v-text-field
              name="name"
              v-model="name"
              label="Name"
              required
            />
            <v-select
              name="icon"
              v-model="icon"
              :items="icons"
              label="Icon"
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue darken-1"
            text
            @click="dialog = false"
          >
            Close
          </v-btn>
          <v-btn
            color="blue darken-1"
            text
            @click="dialog = false"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
const ICONS = [
  { header: 'Group 1', divider: true },
  { text: 'Icon1', value: 'i1', disable: false },
  { text: 'Icon2', value: 'i2', disable: false },
  { text: 'Icon3', value: 'i3', disable: false },
  { text: 'Icon4', value: 'i4', disable: false },
  { header: 'Group 2', divider: true },
  { text: 'Icon5', value: 'i5', disable: false },
  { text: 'Icon6', value: 'i6', disable: false },
  { text: 'Icon7', value: 'i7', disable: false },
  { text: 'Icon8', value: 'i8', disable: false }
]

export default {
  name: 'NewCategoryDialog',
  data: () => ({
    dialog: false,
    valid: true,
    kind: 'expense',
    name: '',
    icon: '',
    icons: ICONS
  })
}
</script>
