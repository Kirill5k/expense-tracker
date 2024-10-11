import {createLookup} from '@/utils/arrays'
import {addDays} from 'date-fns'

export const mapTransactions = (dbTxs, dbCats, dbUser) => {
  const catsById = createLookup(dbCats, c => c.id, c => c.toDomain)
  const user = dbUser.toDomain
  const maxTxDate = addDays(new Date(), user?.settings?.futureTransactionVisibilityDays || 0)
  return dbTxs
      .map(t => ({...t.toDomain, category: catsById[t.categoryId]}))
      .filter(t => {
        return (t?.hidden !== true) &&
            (t?.category?.hidden !== true) &&
            (t?.amount?.currency?.code === user?.settings?.currency?.code) &&
            (user.settings?.futureTransactionVisibilityDays === null || new Date(t.date) <= maxTxDate)
      })
}