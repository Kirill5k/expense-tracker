import {appSchema, tableSchema} from '@nozbe/watermelondb'

const Category = tableSchema({
  name: 'categories',
  columns: [
    {name: 'name', type: 'string'},
    {name: 'icon', type: 'string'},
    {name: 'kind', type: 'string'},
    {name: 'color', type: 'string'},
    {name: 'hidden', type: 'boolean', isOptional: true},
  ],
})

const Transaction = tableSchema({
  name: 'transactions',
  columns: [
    {name: 'kind', type: 'string'},
    {name: 'category_id', type: 'string', isIndexed: true},
    {name: 'amount_value', type: 'number'},
    {name: 'amount_currency_code', type: 'string'},
    {name: 'amount_currency_symbol', type: 'string'},
    {name: 'date', type: 'string', isIndexed: true},
    {name: 'note', type: 'string', isOptional: true},
    {name: 'tags', type: 'string', isOptional: true},
    {name: 'hidden', type: 'boolean', isOptional: true},
  ],
})

const User = tableSchema({
  name: 'users',
  columns: [
    {name: 'first_name', type: 'string'},
    {name: 'last_name', type: 'string'},
    {name: 'email', type: 'string'},
    {name: 'settings_currency_code', type: 'string'},
    {name: 'settings_currency_symbol', type: 'string'},
    {name: 'settings_future_transaction_visibility_days', type: 'number', isOptional: true},
    {name: 'settings_dark_mode', type: 'boolean', isOptional: true},
    {name: 'total_transaction_count', type: 'number'},
    {name: 'registration_date', type: 'string'},
  ],
})

export default appSchema({
  version: 1,
  tables: [
    Category,
    Transaction,
    User
  ]
})