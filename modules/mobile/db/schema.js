import {appSchema, tableSchema} from '@nozbe/watermelondb'

const Account = tableSchema({
  name: 'accounts',
  columns: [
    {name: 'user_id', type: 'string', isIndexed: true},
    {name: 'is_main', type: 'boolean', isOptional: true},
    {name: 'currency_code', type: 'string'},
    {name: 'currency_symbol', type: 'string'},
    {name: 'name', type: 'string'},
    {name: 'hidden', type: 'boolean', isOptional: true},
  ],
})

const Category = tableSchema({
  name: 'categories',
  columns: [
    {name: 'name', type: 'string'},
    {name: 'icon', type: 'string'},
    {name: 'kind', type: 'string'},
    {name: 'color', type: 'string'},
    {name: 'hidden', type: 'boolean', isOptional: true},
    {name: 'user_id', type: 'string', isIndexed: true},
  ],
})

const Transaction = tableSchema({
  name: 'transactions',
  columns: [
    {name: 'category_id', type: 'string', isIndexed: true},
    {name: 'parent_transaction_id', type: 'string', isOptional: true},
    {name: 'amount_value', type: 'number'},
    {name: 'amount_currency_code', type: 'string'},
    {name: 'amount_currency_symbol', type: 'string'},
    {name: 'is_recurring', type: 'boolean', isOptional: true},
    {name: 'date', type: 'string', isIndexed: true},
    {name: 'note', type: 'string', isOptional: true},
    {name: 'tags', type: 'string', isOptional: true},
    {name: 'hidden', type: 'boolean', isOptional: true},
    {name: 'user_id', type: 'string', isIndexed: true},
  ],
})

const PeriodicTransaction = tableSchema({
  name: 'periodic_transactions',
  columns: [
    {name: 'category_id', type: 'string', isIndexed: true},
    {name: 'amount_value', type: 'number'},
    {name: 'amount_currency_code', type: 'string'},
    {name: 'amount_currency_symbol', type: 'string'},
    {name: 'recurrence_start_date', type: 'string'},
    {name: 'recurrence_next_date', type: 'string',  isOptional: true, isIndexed: true},
    {name: 'recurrence_end_date', type: 'string', isOptional: true},
    {name: 'recurrence_interval', type: 'number'},
    {name: 'recurrence_frequency', type: 'string'},
    {name: 'note', type: 'string', isOptional: true},
    {name: 'tags', type: 'string', isOptional: true},
    {name: 'hidden', type: 'boolean', isOptional: true},
    {name: 'user_id', type: 'string', isIndexed: true},
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
    {name: 'registration_date', type: 'string'},
  ],
})

const State = tableSchema({
  name: 'state',
  columns: [
    {name: 'is_authenticated', type: 'boolean', isOptional: true},
    {name: 'access_token', type: 'string', isOptional: true},
    {name: 'user_id', type: 'string', isOptional: true},
    {name: 'display_date_range', type: 'string', isOptional: true},
    {name: 'display_date_text', type: 'string', isOptional: true},
    {name: 'display_date_start', type: 'string', isOptional: true},
    {name: 'display_date_end', type: 'string', isOptional: true},
    {name: 'display_date_prev_start', type: 'string', isOptional: true},
  ],
})

export default appSchema({
  version: 1,
  tables: [
    Account,
    Category,
    Transaction,
    PeriodicTransaction,
    User,
    State
  ]
})