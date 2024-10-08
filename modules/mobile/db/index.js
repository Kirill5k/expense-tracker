import {Database} from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import {setGenerator} from '@nozbe/watermelondb/utils/common/randomId'
import {ObjectId} from 'bson'
import {User, Transaction, Category} from './models'

import schema from './schema'
import migrations from './migrations'
// import Post from './model/Post' // ⬅️ You'll import your Models here

setGenerator(() => new ObjectId().toHexString())

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
  schema,
  // (You might want to comment it out for development purposes -- see Migrations documentation)
  migrations,
  // (optional database name or file system path)
  dbName: 'et-1',
  // (recommended option, should work flawlessly out of the box on iOS. On Android,
  // additional installation steps have to be taken - disable if you run into issues...)
  jsi: true, /* Platform.OS === 'ios' */
  // (optional, but you should implement this method)
  onSetUpError: error => {
    // Database failed to load -- offer the user to reload the app or log out
    console.log('failed to load database', error)
  }
})

// Then, make a Watermelon database from it!
const database = new Database({
  adapter,
  modelClasses: [
    User,
    Transaction,
    Category
  ],
})

export default database