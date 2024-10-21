import {synchronize} from '@nozbe/watermelondb/sync'
import Client from '@/api/client'

//TODO: handle 403
export const initSync = async (database, accessToken) => {
  const syncArgs = {
    database,
    pullChanges: ({lastPulledAt}) => Client.pullChanges(accessToken, lastPulledAt),
    pushChanges: async ({changes, lastPulledAt}) => Client.pushChanges(accessToken, lastPulledAt, changes),
    migrationsEnabledAtVersion: 1,
  }
  try {
    console.log('Performing db sync')
    await synchronize(syncArgs)
  } catch (err) {
    console.log(`Error performing db sync. Will try again: ${err}`)
    await synchronize(syncArgs)
  }
}