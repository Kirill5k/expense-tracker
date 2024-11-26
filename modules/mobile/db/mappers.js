import {createLookup} from '@/utils/arrays'
import {addDays} from 'date-fns'

export const mapTransactions = (dbTxs, dbCats, dbUser, withFutureTxFiltering = true) => {
  if (dbCats === null || dbCats.length === 0) return []

  const catsById = createLookup(dbCats, c => c.id, c => c.toDomain)
  const futureTxFilter = withFutureTxFiltering ? deriveFutureTxFilter(dbUser) : deriveFutureTxFilter(null)
  return dbTxs
      .map(t => ({...t.toDomain, category: catsById[t.categoryId]}))
      .filter(t => {
        return (t?.hidden !== true) &&
            (t?.category && t?.category?.hidden !== true) &&
            (t?.amount?.currency?.code === dbUser?.settingsCurrencyCode) &&
            (futureTxFilter.allowAll || new Date(t.date) <= futureTxFilter.maxDate)
      })
}

const deriveFutureTxFilter = (dbUser) => {
  if (!dbUser) {
    return {allowAll: true, maxDate: null}
  }
  const user = dbUser.toDomain
  const maxDate = addDays(new Date(), user?.settings?.futureTransactionVisibilityDays || 0)
  return {
    maxDate,
    allowAll: user.settings?.futureTransactionVisibilityDays === null
  }
}

export const mapCategories = (dbCats) => {
  return dbCats.map(c => c.toDomain)
}