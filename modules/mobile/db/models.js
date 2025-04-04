import {Model} from '@nozbe/watermelondb'
import {field, relation, writer, children, lazy} from '@nozbe/watermelondb/decorators'
import {Q} from '@nozbe/watermelondb'

export class Account extends Model {
  static table = 'accounts'

  @field('user_id') userId
  @field('name') name
  @field('is_main') isMain
  @field('currency_code') currencyCode
  @field('currency_symbol') currencySymbol
  @field('hidden') hidden

  get isNotHidden() {
    return this.hidden !== true
  }

  @writer async setHidden(hidden) {
    await this.update(acc => {
      acc.hidden = hidden
    })
  }

  get toDomain() {
    return {
      id: this.id,
      name: this.name,
      userId: this.userId,
      currency: {
        code: this.currencyCode,
        symbol: this.currencySymbol
      },
      isMain: this.isMain,
      hidden: this.hidden
    }
  }
}

export class Category extends Model {
  static table = 'categories'

  @field('name') name
  @field('icon') icon
  @field('kind') kind
  @field('color') color
  @field('hidden') hidden
  @field('user_id') userId

  get isNotHidden() {
    return this.hidden !== true
  }

  @writer async setHidden(hidden) {
    await this.update(category => {
      category.hidden = hidden
    })
  }

  get toDomain() {
    return {
      id: this.id,
      name: this.name,
      icon: this.icon,
      kind: this.kind,
      color: this.color,
      hidden: this.hidden
    }
  }
}

export class Transaction extends Model {
  static table = 'transactions'

  @field('category_id') categoryId
  @field('account_id') accountId
  @field('parent_transaction_id') parentTransactionId
  @field('is_recurring') isRecurring
  @field('amount_value') amountValue
  @field('amount_currency_code') amountCurrencyCode
  @field('amount_currency_symbol') amountCurrencySymbol
  @field('date') date
  @field('note') note
  @field('tags') tags
  @field('hidden') hidden
  @field('user_id') userId

  @relation('categories', 'category_id') category

  get isNotHidden() {
    return this.hidden !== true && this.category.hidden !== true
  }

  @writer async setHidden(hidden) {
    await this.update(transaction => {
      transaction.hidden = hidden
    })
  }

  get toDomain() {
    return {
      id: this.id,
      kind: this.kind,
      categoryId: this.categoryId,
      accountId: this.accountId,
      parentTransactionId: this.parentTransactionId,
      isRecurring: this.isRecurring,
      amount: {
        value: this.amountValue,
        currency: {
          code: this.amountCurrencyCode,
          symbol: this.amountCurrencySymbol
        }
      },
      date: this.date,
      note: this.note,
      tags: this.tags === null || this.tags === '' ? [] : this.tags.split(','),
      hidden: this.hidden
    }
  }
}

export class PeriodicTransaction extends Model {
  static table = 'periodic_transactions'

  @field('category_id') categoryId
  @field('account_id') accountId
  @field('amount_value') amountValue
  @field('amount_currency_code') amountCurrencyCode
  @field('amount_currency_symbol') amountCurrencySymbol
  @field('recurrence_start_date') recurrenceStartDate
  @field('recurrence_next_date') recurrenceNextDate
  @field('recurrence_end_date') recurrenceEndDate
  @field('recurrence_interval') recurrenceInterval
  @field('recurrence_frequency') recurrenceFrequency
  @field('note') note
  @field('tags') tags
  @field('hidden') hidden
  @field('user_id') userId

  @relation('categories', 'category_id') category

  get isNotHidden() {
    return this.hidden !== true && this.category.hidden !== true
  }

  @writer async setHidden(hidden) {
    await this.update(transaction => {
      transaction.hidden = hidden
    })
  }

  get toDomain() {
    return {
      id: this.id,
      kind: this.kind,
      categoryId: this.categoryId,
      accountId: this.accountId,
      amount: {
        value: this.amountValue,
        currency: {
          code: this.amountCurrencyCode,
          symbol: this.amountCurrencySymbol
        }
      },
      recurrence: {
        startDate: this.recurrenceStartDate,
        endDate: this.recurrenceEndDate,
        nextDate: this.recurrenceNextDate,
        interval: this.recurrenceInterval,
        frequency: this.recurrenceFrequency
      },
      note: this.note,
      tags: this.tags === null || this.tags === '' ? [] : this.tags.split(','),
      hidden: this.hidden
    }
  }
}


export class User extends Model {
  static table = 'users'
  static associations = {
    categories: { type: 'has_many', foreignKey: 'user_id' },
    transactions: { type: 'has_many', foreignKey: 'user_id' },
  }

  @field('first_name') firstName
  @field('last_name') lastName
  @field('email') email
  @field('settings_currency_code') settingsCurrencyCode
  @field('settings_currency_symbol') settingsCurrencySymbol
  @field('settings_future_transaction_visibility_days') settingsFutureTransactionVisibilityDays
  @field('settings_dark_mode') settingsDarkMode
  @field('registration_date') registrationDate

  @children('categories') categories
  @children('transactions') transactions

  @lazy activeCategories = this.categories.extend(Q.where('hidden', false))
  @lazy activeTransactions = this.transactions.extend(Q.where('hidden', false))

  get currency() {
    return {
      code: this.settingsCurrencyCode,
      symbol: this.settingsCurrencySymbol,
    }
  }

  get toDomain() {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      settings: {
        currency: {
          code: this.settingsCurrencyCode,
          symbol: this.settingsCurrencySymbol,
        },
        futureTransactionVisibilityDays: this.settingsFutureTransactionVisibilityDays,
        darkMode: this.settingsDarkMode,
      },
      registrationDate: this.registrationDate
    }
  }
}

export class State extends Model {
  static table = 'state'

  @field('is_authenticated') isAuthenticated
  @field('access_token') accessToken
  @field('user_id') userId
  @field('display_date_range') displayDateRange
  @field('display_date_text') displayDateText
  @field('display_date_start') displayDateStart
  @field('display_date_end') displayDateEnd
  @field('display_date_prev_start') displayDatePrevStart

  @relation('users', 'user_id') user

  get displayDate() {
    return {
      range: this.displayDateRange,
      text: this.displayDateText,
      start: new Date(this.displayDateStart),
      end: new Date(this.displayDateEnd)
    }
  }
}
