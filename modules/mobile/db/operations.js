import {defaultDisplayDate} from '@/utils/dates'
import {nonEmpty} from '@/utils/arrays'
import {toIsoDateString} from '@/utils/dates'

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
  rec.totalTransactionCount = user.totalTransactionCount
  rec.registrationDate = user.registrationDate
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
    const tx = await database.get('transactions').find(tx.id)
    await tx.update(rec => updateTxRec(rec ,tx))
  })
}

export const saveTransactions = async (database, userId, transactions) => {
  await database.write(async () => {
    const actions = transactions.map(tx => database.get('transactions').prepareCreate(rec => updateTxRec(rec, tx)))
    await database.batch(actions)
  })
}

export const saveCategories = async (database, userId, categories) => {
  await database.write(async () => {
    const actions = categories.map(c => database.get('categories').prepareCreate(rec => {
      rec._raw.id = c.id
      rec.userId = userId
      rec.name = c.name
      rec.icon = c.icon
      rec.kind = c.kind
      rec.color = c.color
      rec.hidden = c.hidden || false
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

export const initState = async (database) => {
  await database.write(async () => {
    try {
      await database.get('state').find('expense-tracker')
    } catch (e) {
      const dd = defaultDisplayDate()
      await database.get('state').create(state => {
        state._raw.id = 'expense-tracker'
        state.isAuthenticated = false
        state.accessToken = null
        state.userId = null
        state.displayDateRange = dd.range
        state.displayDateText = dd.text
        state.displayDateStart = toIsoDateString(dd.start)
        state.displayDateEnd = toIsoDateString(dd.end)
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