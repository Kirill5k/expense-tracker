import {synchronize} from '@nozbe/watermelondb/sync'
import Client from '@/api/client'


async function initSync(database, accessToken) {
  const syncArgs = {
    database,
    pullChanges: ({lastPulledAt}) => Client.pullChanges(accessToken, lastPulledAt),
    pushChanges: async ({changes, lastPulledAt}) => {
      const response = await fetch(`https://my.backend/sync?last_pulled_at=${lastPulledAt}`, {
        method: 'POST',
        body: JSON.stringify(changes),
      })
      if (!response.ok) {
        throw new Error(await response.text())
      }
    },
    migrationsEnabledAtVersion: 1,
  }
  try {
    console.log('Performing db sync')
    await synchronize(syncArgs)
  } catch (err) {
    console.log(`Error performing db sync. will try again: ${err}`)
    await synchronize(syncArgs)
  }
}