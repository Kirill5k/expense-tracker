import {combineLatest, of as of$} from 'rxjs'
import {switchMap, map as map$} from 'rxjs/operators'
import {Q} from '@nozbe/watermelondb'
import {withDatabase, compose, withObservables} from '@nozbe/watermelondb/react'

const stateObservable =
    withObservables([], ({database}) => ({
      state: database.get('state').findAndObserve('expense-tracker'),
    }))

const userObservable =
    withObservables([], ({state}) => ({
      user: state.user.observe(),
    }))

const categoriesObservable =
    withObservables([], ({state}) => ({
      categories: state.collections.get('categories').query(
          Q.where('user_id', Q.eq(state.userId)),
          Q.where('hidden', Q.notEq(true)),
          Q.sortBy('name', Q.asc),
      ).observe()
    }))

const recurringTransactionsObservable =
    withObservables([], ({state}) => ({
      categories: state.collections.get('categories').query(
          Q.where('user_id', Q.eq(state.userId)),
          Q.where('hidden', Q.notEq(true)),
          Q.sortBy('name', Q.asc),
      ).observe(),
      recurringTransactions: state.collections.get('periodic_transactions').query(
          Q.where('user_id', Q.eq(state.userId)),
          Q.where('hidden', Q.notEq(true)),
          Q.sortBy('recurrence_next_date', Q.asc),
      ).observe()
    }))

const transactionsObservable =
    withObservables(['state', 'user'], ({state}) => ({
      displayedTransactions: combineLatest([state.observe()]).pipe(
          switchMap(([currentState]) =>
              state.collections.get('transactions').query(
                  Q.where('date', Q.gte(currentState.displayDateStart)),
                  Q.where('date', Q.lte(currentState.displayDateEnd)),
                  Q.where('user_id', Q.eq(currentState.userId)),
                  Q.where('hidden', Q.notEq(true)),
                  Q.sortBy('date', Q.desc),
              ).observe()
          )
      ),
      previousDisplayedTransactions: combineLatest([state.observe()]).pipe(
          switchMap(([currentState]) =>
              state.collections.get('transactions').query(
                  Q.where('date', Q.gte(currentState.displayDatePrevStart)),
                  Q.where('date', Q.lt(currentState.displayDateStart)),
                  Q.where('user_id', Q.eq(currentState.userId)),
                  Q.where('hidden', Q.notEq(true)),
              ).observe()
          )
      ),
    }))

const transactionCountObservable =
    withObservables(['user'], ({user}) => ({
      totalTransactionCount: user ? user.activeTransactions.observeCount() : of$(null),
    }))

export const enhanceWithCompleteState = compose(
    withDatabase,
    stateObservable,
    userObservable,
    categoriesObservable,
    transactionsObservable
)

export const enhanceWithCategories = compose(
    withDatabase,
    stateObservable,
    userObservable,
    categoriesObservable
)

export const enhanceWithUser = compose(
    withDatabase,
    stateObservable,
    userObservable
)

export const enhanceWithUserAndTxCount = compose(
    withDatabase,
    stateObservable,
    userObservable,
    transactionCountObservable
)

export const enhanceWithRecurringTransactions = compose(
    withDatabase,
    stateObservable,
    userObservable,
    recurringTransactionsObservable
)