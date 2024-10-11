import {combineLatest} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import {Q} from '@nozbe/watermelondb'
import {withDatabase, compose, withObservables} from '@nozbe/watermelondb/react'

export const observeDisplayedTransactions = (state) => {
  return combineLatest([state.observe()]).pipe(
      switchMap(([currentState]) =>
          state.collections.get('transactions').query(
              Q.where('date', Q.gte(currentState.displayDateStart)),
              Q.where('date', Q.lte(currentState.displayDateEnd)),
              Q.where('hidden', Q.notEq(true)),
              Q.sortBy('date', Q.desc),
          ).observe()
      )
  )
}

export const enhanceWithCompleteState = compose(
    withDatabase,
    withObservables([], ({database}) => ({
      state: database.get('state').findAndObserve('expense-tracker')
    })),
    withObservables(['state'], ({state}) => ({
      user: state.user.observe(),
      displayedTransactions: observeDisplayedTransactions(state)
    })),
    withObservables(['user'], ({user}) => ({
      categories: user.categories.observe(),
    }))
)