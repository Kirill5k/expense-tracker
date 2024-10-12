import {combineLatest} from 'rxjs'
import {switchMap} from 'rxjs/operators'
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
          Q.where('user_id', Q.lte(state.userId)),
          Q.where('hidden', Q.notEq(true)),
          Q.sortBy('name', Q.asc),
      ).observe()
    }))

const transactionsObservable =
    withObservables(['state'], ({state}) => ({
      displayedTransactions: combineLatest([state.observe()]).pipe(
          switchMap(([currentState]) =>
              state.collections.get('transactions').query(
                  Q.where('date', Q.gte(currentState.displayDateStart)),
                  Q.where('date', Q.lte(currentState.displayDateEnd)),
                  Q.where('user_id', Q.lte(currentState.userId)),
                  Q.where('hidden', Q.notEq(true)),
                  Q.sortBy('date', Q.desc),
              ).observe()
          )
      )
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
    userObservable,
    categoriesObservable
)