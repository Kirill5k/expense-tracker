import {defaultDisplayDate} from '@/utils/dates'

export const saveTransactions = async (database, userId, transactions) => {
  await database.write(async () => {
    const actions = transactions.map(tx => database.get('transactions').prepareCreate(rec => {
      res.userId = userId
      rec._raw.id = tx.id
      rec.categoryId = tx.category.id
      rec.date = tx.date;
      rec.amountValue = tx.amount.value;
      rec.amountCurrencyCode = tx.amount.currency.code;
      rec.amountCurrencySymbol = tx.amount.currency.symbol;
      rec.note = tx.note;
      rec.tags = (tx.tags || []).join(',');
      rec.hidden = tx.hidden || false
    }))
    await database.batch(actions)
  })
}

export const saveCategories = async (database, userId, categories) => {
  await database.write(async () => {
    const actions = categories.map(c => database.get('categories').prepareCreate(rec => {
      res.userId = userId
      rec._raw.id = c.id
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
      record.displayDateRage = displayDate.range
      record.displayDateText = displayDate.text
      record.displayDateStart = displayDate.start.toISOString().slice(0, 10)
      record.displayDateEnd = displayDate.end.toISOString().slice(0, 10)
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
        state.displayDateStart = dd.start.toISOString().slice(0, 10)
        state.displayDateEnd = dd.end.toISOString().slice(0, 10)
      })
    }
  })
}

export const saveUser = async (database, user) => {
  await database.write(async () => {
    try {
      const foundUser = await database.get('users').find(user.id)
      foundUser.update(foundUser => {
        foundUser.firstName = user.firstName
        foundUser.lastName = user.lastName
        foundUser.email = user.email
        foundUser.settingsCurrencyCode = user.settings.currency.code
        foundUser.settingsCurrencySymbol = user.settings.currency.symbol
        foundUser.settingsFutureTransactionVisibilityDays = user.settings.futureTransactionVisibilityDays
        foundUser.settingsDarkMode = user.settings.darkMode
        foundUser.totalTransactionCount = user.totalTransactionCount
        foundUser.registrationDate = user.registrationDate
      })
    } catch (err) {
      await database.get('users').create(newUser => {
        newUser._raw.id = user.id
        newUser.firstName = user.firstName
        newUser.lastName = user.lastName
        newUser.email = user.email
        newUser.settingsCurrencyCode = user.settings.currency.code
        newUser.settingsCurrencySymbol = user.settings.currency.symbol
        newUser.settingsFutureTransactionVisibilityDays = user.settings.futureTransactionVisibilityDays
        newUser.settingsDarkMode = user.settings.darkMode
        newUser.totalTransactionCount = user.totalTransactionCount
        newUser.registrationDate = user.registrationDate
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