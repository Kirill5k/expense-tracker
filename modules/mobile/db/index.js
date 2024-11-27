import {Database} from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import {setGenerator} from '@nozbe/watermelondb/utils/common/randomId'
import {ObjectId} from 'bson'
import {User, Transaction, PeriodicTransaction, Category, State} from './models'
import {initState} from './operations'
import schema from './schema'
import migrations from './migrations'

setGenerator(() => new ObjectId().toHexString())

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  // (optional database name or file system path)
  dbName: 'et-16',
  // (recommended option, should work flawlessly out of the box on iOS. On Android,
  // additional installation steps have to be taken - disable if you run into issues...)
  jsi: true, /* Platform.OS === 'ios' */
  // (optional, but you should implement this method)
  onSetUpError: error => {
    // Database failed to load -- offer the user to reload the app or log out
    console.log('failed to load database', error)
  }
})

const database = new Database({
  adapter,
  modelClasses: [
    User,
    Transaction,
    PeriodicTransaction,
    Category,
    State
  ],
})

initState(database)

export default database