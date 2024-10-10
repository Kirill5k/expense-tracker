export const saveUser = async (database, user) => {
  await database.write(async () => {
    await database.get('users').create(newUser => {
      newUser.firstName = user.firstName
      newUser.lastName = user.lastName
      newUser.email = user.email
      newUser.settingsCurrencyCode = user.settings.currency.code
      newUser.settingsCurrencySymbol = user.settings.currency.symbol
      newUser.settingsFutureTransactionVisibilityDays = user.settings.futureTransactionVisibilityDays
      newUser.settingsDarkMode = user.settings.darkMode
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