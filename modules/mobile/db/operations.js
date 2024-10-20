import {defaultDisplayDate} from '@/utils/dates'
import {nonEmpty} from '@/utils/arrays'
import {toIsoDateString} from '@/utils/dates'

const resetStateRec = (rec) => {
  const dd = defaultDisplayDate()
  rec.isAuthenticated = false
  rec.accessToken = null
  rec.userId = null
  rec.displayDateRange = dd.range
  rec.displayDateText = dd.text
  rec.displayDateStart = toIsoDateString(dd.start)
  rec.displayDateEnd = toIsoDateString(dd.end)
}

const updateCatRec = (rec, c) => {
  rec.userId = c.userId
  rec.name = c.name
  rec.icon = c.icon
  rec.kind = c.kind
  rec.color = c.color
  rec.hidden = c.hidden || false
}

const updateTxRec = (rec, tx) => {
  rec.categoryId = tx.category.id
  rec.date = tx.date
  rec.userId = tx.userId
  rec.amountValue = tx.amount.value
  rec.amountCurrencyCode = tx.amount.currency.code
  rec.amountCurrencySymbol = tx.amount.currency.symbol
  rec.note = tx.note
  rec.tags = nonEmpty(tx.tags) ? tx.tags.join(',') : null
  rec.hidden = tx.hidden || false
}

const updateUserRec = (rec, user) => {
  rec.firstName = user.firstName
  rec.lastName = user.lastName
  rec.email = user.email
  rec.settingsCurrencyCode = user.settings.currency.code
  rec.settingsCurrencySymbol = user.settings.currency.symbol
  rec.settingsFutureTransactionVisibilityDays = user.settings.futureTransactionVisibilityDays
  rec.settingsDarkMode = user.settings.darkMode
  rec.registrationDate = user.registrationDate
}

export const hideCategory = async (database, catid, hidden) => {
  await database.write(async () => {
    const cat = await database.get('categories').find(catid)
    await cat.update(rec => {
      rec.hidden = hidden
    })
  })
}

export const createCategory = async (database, cat) => {
  await database.write(async () => {
    await database.get('categories').create(rec => updateCatRec(rec, cat))
  })
}

export const updateCategory = async (database, cat) => {
  await database.write(async () => {
    const found = await database.get('categories').find(cat.id)
    await found.update(rec => updateCatRec(rec, cat))
  })
}

export const hideTransaction = async (database, txid, hidden) => {
  await database.write(async () => {
    const tx = await database.get('transactions').find(txid)
    await tx.update(rec => {
      rec.hidden = hidden
    })
  })
}

export const createTransaction = async (database, tx) => {
  await database.write(async () => {
    await database.get('transactions').create(rec => updateTxRec(rec, tx))
  })
}

export const updateTransaction = async (database, tx) => {
  await database.write(async () => {
    const found = await database.get('transactions').find(tx.id)
    await found.update(rec => updateTxRec(rec, tx))
  })
}

export const saveTransactions = async (database, userId, transactions) => {
  await database.write(async () => {
    const actions = transactions.map(tx => database.get('transactions').prepareCreate(rec => {
      updateTxRec(rec, tx)
      rec._raw.id = tx.id
      rec.userId = userId
    }))
    await database.batch(actions)
  })
}

export const saveCategories = async (database, userId, categories) => {
  await database.write(async () => {
    const actions = categories.map(c => database.get('categories').prepareCreate(rec => {
      updateCatRec(rec, c)
      rec._raw.id = c.id
      rec.userId = userId
    }))
    await database.batch(actions)
  })
}

export const updateStateDisplayDate = async (database, displayDate) => {
  await database.write(async () => {
    const state = await database.get('state').find('expense-tracker')
    await state.update(record => {
      record.displayDateRange = displayDate.range
      record.displayDateText = displayDate.text
      record.displayDateStart = toIsoDateString(displayDate.start)
      record.displayDateEnd = toIsoDateString(displayDate.end)
    })
  })
}

export const updateStateAuthStatus = async (database, accessToken) => {
  await database.write(async () => {
    const state = await database.get('state').find('expense-tracker')
    await state.update(record => {
      record.accessToken = accessToken
      record.isAuthenticated = true
    })
  })
}

export const resetState = async (database) => {
  await database.write(async () => {
    try {
      await database.unsafeResetDatabase()
      console.log('Database reset successfully.')
      await database.get('state').create(state => {
        state._raw.id = 'expense-tracker'
        resetStateRec(state)
      })
    } catch (error) {
      console.error('Error resetting database:', error)
    }
  })
}

export const initState = async (database) => {
  await database.write(async () => {
    try {
      await database.get('state').find('expense-tracker')
    } catch (e) {
      await database.get('state').create(state => {
        state._raw.id = 'expense-tracker'
        resetStateRec(state)
      })
    }
  })
}

export const saveUser = async (database, user) => {
  await database.write(async () => {
    try {
      const foundUser = await database.get('users').find(user.id)
      foundUser.update(rec => updateUserRec(rec, user))
    } catch (err) {
      await database.get('users').create(rec => {
        rec._raw.id = user.id
        updateUserRec(rec, user)
      })
    }
    const state = await database.get('state').find('expense-tracker')
    await state.update(record => {
      record.userId = user.id
    })
  })
}

export const updateUserCurrency = async (database, userId, currency) => {
  await database.write(async () => {
    const userRecord = await database.get('users').find(userId)

    await userRecord.update(record => {
      record.settingsCurrencyCode = currency.code
      record.settingsCurrencySymbol = currency.symbol
    })
  })
}

export const updateUserDarkMode = async (database, userId, darkMode) => {
  await database.write(async () => {
    const userRecord = await database.get('users').find(userId)
    await userRecord.update(record => {
      record.settingsDarkMode = darkMode
    })
  })
}

export const updateUserFutureTransactionVisibilityDays = async (database, userId, futureTransactionVisibilityDays) => {
  await database.write(async () => {
    const userRecord = await database.get('users').find(userId)
    await userRecord.update(record => {
      record.settingsFutureTransactionVisibilityDays = futureTransactionVisibilityDays
    })
  })
}