let counter = Math.floor(Math.random() * 0xFFFFFF)

export const generateObjectIdHexString = () => {
  const timestamp = Math.floor(Date.now() / 1000)
  const machineId = Math.floor(Math.random() * 16777216)
  const processId = Math.floor(Math.random() * 65536)
  counter = (counter + 1) % 0xFFFFFF

  const buffer = new Uint8Array(12)

  // Timestamp (4 bytes, big-endian)
  buffer[0] = (timestamp >> 24) & 0xff
  buffer[1] = (timestamp >> 16) & 0xff
  buffer[2] = (timestamp >> 8) & 0xff
  buffer[3] = timestamp & 0xff
  // Machine ID (3 bytes)
  buffer[4] = (machineId >> 16) & 0xff
  buffer[5] = (machineId >> 8) & 0xff
  buffer[6] = machineId & 0xff
  // Process ID (2 bytes)
  buffer[7] = (processId >> 8) & 0xff
  buffer[8] = processId & 0xff
  // Counter (3 bytes)
  buffer[9] = (counter >> 16) & 0xff
  buffer[10] = (counter >> 8) & 0xff
  buffer[11] = counter & 0xff

  return Array.from(buffer)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
}