export const generateObjectIdHexString = () => {
  const timestamp = Math.floor(Date.now() / 1000)
  const machineId = Math.floor(Math.random() * 16777216)
  const processId = Math.floor(Math.random() * 65536)
  const counter = Math.floor(Math.random() * 16777216)

  const buffer = new Uint8Array(12)

  buffer[0] = (timestamp >> 24) & 0xff;
  buffer[1] = (timestamp >> 16) & 0xff;
  buffer[2] = (timestamp >> 8) & 0xff;
  buffer[3] = timestamp & 0xff;
  buffer[4] = (machineId >> 16) & 0xff;
  buffer[5] = (machineId >> 8) & 0xff;
  buffer[6] = machineId & 0xff;
  buffer[7] = (processId >> 8) & 0xff;
  buffer[8] = processId & 0xff;
  buffer[9] = (counter >> 16) & 0xff;
  buffer[10] = (counter >> 8) & 0xff;
  buffer[11] = counter & 0xff;

  return Array.from(buffer)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
}