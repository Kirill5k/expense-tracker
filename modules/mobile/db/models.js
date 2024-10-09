import {Model} from '@nozbe/watermelondb'
import {field, relation, writer} from '@nozbe/watermelondb/decorators'

export class Category extends Model {
  static table = 'categories'

  @field('name') name
  @field('icon') icon
  @field('kind') kind
  @field('color') color
  @field('hidden') hidden

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

  @field('kind') kind
  @field('category_id') categoryId
  @field('amount_value') amountValue
  @field('amount_currency_code') amountCurrencyCode
  @field('amount_currency_symbol') amountCurrencySymbol
  @field('date') date
  @field('note') note
  @field('tags') tags
  @field('hidden') hidden

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
      category: this.category,
      amount: {
        value: this.amountValue,
        currency: {
          code: this.amountCurrencyCode,
          symbol: this.amountCurrencySymbol
        }
      },
      date: this.date,
      note: this.note,
      tags: this.tags === null ? null : this.tags.split(','),
      hidden: this.hidden
    }
  }
}

export class User extends Model {
  static table = 'users'

  @field('first_name') firstName
  @field('last_name') lastName
  @field('email') email
  @field('settings_currency_code') settingsCurrencyCode
  @field('settings_currency_symbol') settingsCurrencySymbol
  @field('settings_future_transaction_visibility_days') settingsFutureTransactionVisibilityDays
  @field('settings_dark_mode') settingsDarkMode

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
      }
    }
  }
}
