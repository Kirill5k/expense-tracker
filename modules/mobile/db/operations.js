import {defaultDisplayDate} from '@/utils/dates'
import {generateRecurrences, calculateRecurrenceNextDate} from '@/utils/transactions'
import {nonEmpty} from '@/utils/arrays'
import {toIsoDateString} from '@/utils/dates'
import {generateObjectIdHexString} from './utils'
import * as Crypto from 'expo-crypto'
import {Q} from '@nozbe/watermelondb'

export const generateRecurrenceInstanceId = async (ptxId, date) => {
  const timestamp = Math.floor(new Date(date).getTime() / 1000)
  const array = new Uint8Array(12)
  array[0] = (timestamp >> 24) & 0xff
  array[1] = (timestamp >> 16) & 0xff
  array[2] = (timestamp >> 8) & 0xff
  array[3] = timestamp & 0xff
  const hashInput = `${ptxId.toString()}_${date}`;
  const hashHex = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hashInput,
      { encoding: Crypto.CryptoEncoding.HEX }
  )
  for (let i = 0; i < 8; i++) {
    array[4 + i] = parseInt(hashHex.slice(i * 2, i * 2 + 2), 16)
  }
  return Array.from(array)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
}

const resetStateRec = (rec) => {
  const dd = defaultDisplayDate()
  rec.isAuthenticated = false
  rec.accessToken = null
  rec.userId = null
  rec.displayDateRange = dd.range
  rec.displayDateText = dd.text
  rec.displayDateStart = toIsoDateString(dd.start)
  rec.displayDateEnd = toIsoDateString(dd.end)
  rec.displayDatePrevStart = toIsoDateString(dd.prevStart)
}

const updateCatRec = (rec, c) => {
  rec.userId = c.userId
  rec.name = c.name
  rec.icon = c.icon
  rec.kind = c.kind
  rec.color = c.color
  rec.hidden = c.hidden || false
}

const updateRtxRec = (rec, rtx) => {
  rec.categoryId = rtx.category ? rtx.category.id : rtx.categoryId
  rec.recurrenceStartDate = rtx.recurrence.startDate
  rec.recurrenceNextDate = rtx.recurrence.nextDate
  rec.recurrenceEndDate = rtx.recurrence.endDate
  rec.recurrenceFrequency = rtx.recurrence.frequency
  rec.recurrenceInterval = rtx.recurrence.interval
  rec.userId = rtx.userId
  rec.accountId = rtx.accountId
  rec.amountValue = rtx.amount.value
  rec.amountCurrencyCode = rtx.amount.currency.code
  rec.amountCurrencySymbol = rtx.amount.currency.symbol
  rec.note = rtx.note
  rec.tags = nonEmpty(rtx.tags) ? rtx.tags.join(',') : null
  rec.hidden = rtx.hidden || false
}

const updateTxRec = (rec, tx) => {
  rec.categoryId = tx.category ? tx.category.id : tx.categoryId
  rec.date = tx.date
  rec.userId = tx.userId
  rec.parentTransactionId = tx.parentTransactionId
  rec.accountId = tx.accountId
  rec.isRecurring = tx.isRecurring
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

export const hideRecurringTransaction = async (database, rtxid, hidden) => {
  await database.write(async () => {
    const rtx = await database.get('periodic_transactions').find(rtxid)
    await rtx.update(rec => {
      rec.hidden = hidden
    })
  })
}

export const hideCategory = async (database, catid, hidden) => {
  await database.write(async () => {
    const cat = await database.get('categories').find(catid)
    await cat.update(rec => {
      rec.hidden = hidden
    })
  })
}

export const createRecurringTransaction = async (database, rtx) => {
  const rtxId = generateObjectIdHexString();
  const {transactions, recurringTransaction} = generateRecurrences({...rtx, id: rtxId})
  await database.write(async () => {
    const actions = []
    for (const tx of transactions) {
      const txId = await generateRecurrenceInstanceId(rtxId, tx.date)
      const createTxAction = database.get('transactions').prepareCreate(rec => {
        updateTxRec(rec, tx)
        rec._raw.id = txId
        rec.userId = rtx.userId
      })
      actions.push(createTxAction)
    }
    const createRtxAction = database.get('periodic_transactions').prepareCreate(rec => {
      updateRtxRec(rec, recurringTransaction)
      rec._raw.id = rtxId
      rec.userId = rtx.userId
    })
    actions.push(createRtxAction)

    await database.batch(actions)
  })
}

export const updateRecurringTransaction = async (database, rtx) => {
  const newNextDate = calculateRecurrenceNextDate(rtx)
  await database.write(async () => {
    const found = await database.get('periodic_transactions').find(rtx.id)
    await found.update(rec => updateRtxRec(rec, {...rtx, recurrence: {...rtx.recurrence, nextDate: newNextDate}}))
  })
}

export const createRecurringTransactionInstancesWithTodayDate = async (database) => {
  const now = new Date().toISOString().slice(0, 10)
  const rtxs = await database.get('periodic_transactions').query(
      Q.where('recurrence_next_date', Q.eq(now)),
      Q.or(
          Q.where('recurrence_end_date', Q.eq(null)),
          Q.where('recurrence_end_date', Q.gt(now))
      ),
      Q.where('hidden', Q.notEq(true)),
  ).fetch()
  console.log(`Found ${rtxs.length} recurring transactions with today's date`)
  if (rtxs.length > 0) {
    await database.write(async () => {
      const actions = []
      for (const rtx of rtxs) {
        const {transactions, recurringTransaction} = generateRecurrences(rtx.toDomain)
        for (const tx of transactions) {
          const txId = await generateRecurrenceInstanceId(rtx.id, tx.date)
          const createTxAction = database.get('transactions').prepareCreate(rec => {
            updateTxRec(rec, tx)
            rec._raw.id = txId
            rec.userId = rtx.userId
          })
          actions.push(createTxAction)
        }
        const updateRtxAction = rtx.prepareUpdate(rec => {
          rec.recurrenceNextDate = recurringTransaction.recurrence.nextDate
        })
        actions.push(updateRtxAction)
      }
      await database.batch(actions)
    })
  }
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
      if (tx.id) {
        rec._raw.id = tx.id
      }
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
      record.displayDatePrevStart = toIsoDateString(displayDate.previous.start)
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

export const deleteData = async (database) => {
  const deleteFromCollection = async (collectionName) => {
    const allRecords = await database.get(collectionName).query().fetch()
    const actions = allRecords.map(r => r.prepareDestroyPermanently())
    await database.batch(actions)
  }

  await database.write(async () => {
    await deleteFromCollection('periodic_transactions')
    await deleteFromCollection('transactions')
    await deleteFromCollection('categories')
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