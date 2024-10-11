import {combineLatest} from 'rxjs'
import {switchMap} from 'rxjs/operators'
import {Q} from '@nozbe/watermelondb'

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