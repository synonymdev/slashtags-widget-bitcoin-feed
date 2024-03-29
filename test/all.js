const test = require('brittle')
const os = require('os')
const fs = require('fs')
const path = require('path')
const { Client, Relay } = require('@synonymdev/web-relay')

const { Reader, Feed } = require('../index.js')

const icon = fs.readFileSync(path.join(__dirname, '../lib/icon.svg'))
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/slashfeed.json'), 'utf8'))

const mocks = {
  tipHash: '000000000000000000037068eb0d54a682190c209921f37168c47072029fd926',
  blockInfo: {
    id: '000000000000000000037068eb0d54a682190c209921f37168c47072029fd926',
    height: 803319,
    version: 608747520,
    timestamp: 1692117644,
    tx_count: 2555,
    size: 1636923,
    weight: 3993048,
    merkle_root: 'bc62636eb7086119fae4d40d016c40df99518b991f38400e1f384b1dd127c352',
    previousblockhash: '00000000000000000002b66b4102080add20e09956f1036aeb369d0ffdaa3da4',
    mediantime: 1692113460,
    nonce: 487421470,
    bits: 386228059,
    difficulty: 52391178981379.36
  }
}

test('immediate update', async (t) => {
  const relay = new Relay(tmpdir())
  const address = await relay.listen()

  const client = new Client({ storage: tmpdir(), relay: address })
  const feed = new Feed(client, config, { icon })
  mock(feed)

  await feed.ready()

  const readerClient = new Client({ storage: tmpdir() })
  const reader = new Reader(readerClient, feed.url)
  await reader.ready()

  t.alike(reader.config, config)
  t.alike(reader.icon, icon)

  const latestBlock = await reader.getBlockInfo()

  t.is(latestBlock.height, mocks.blockInfo.height)
  t.is(latestBlock.size, Number((mocks.blockInfo.size / 1024).toFixed(2)))
  t.is(latestBlock.timestamp, mocks.blockInfo.timestamp)
  t.is(latestBlock.merkleRoot, mocks.blockInfo.merkle_root)
  t.is(latestBlock.transactionCount, mocks.blockInfo.tx_count)
  t.is(latestBlock.difficulty, Number((mocks.blockInfo.difficulty / 1000000000000).toFixed(2)))

  const tf = t.test('fields')
  tf.plan(9)

  for (const field of reader.config.fields) {
    const value = await reader.getField(field.key)

    tf.is(value, latestBlock[field.key], 'Field value matches ' + field.key)
  }

  await tf

  relay.close()
  await feed.close()
})

test('subscribe', async (t) => {
  const relay = new Relay(tmpdir())
  const address = await relay.listen()

  const client = new Client({ storage: tmpdir(), relay: address })
  const feed = new Feed(client, config, { icon })
  mock(feed)

  await feed.ready()

  const readerClient = new Client({ storage: tmpdir() })
  const reader = new Reader(readerClient, feed.url)

  await reader.ready()

  const ts = t.test('subscribe')
  ts.plan(5)

  reader.subscribeBlockInfo((latestBlock) => {
    ts.is(latestBlock.height, mocks.blockInfo.height)
    ts.is(latestBlock.size, Number((mocks.blockInfo.size / 1024).toFixed(2)))
    ts.is(latestBlock.timestamp, mocks.blockInfo.timestamp)
    ts.is(latestBlock.merkleRoot, mocks.blockInfo.merkle_root)
    ts.is(latestBlock.transactionCount, mocks.blockInfo.tx_count)
    t.is(latestBlock.difficulty, Number((mocks.blockInfo.difficulty / 1000000000000).toFixed(2)))
  })

  await ts

  relay.close()
  readerClient.close()
  feed.close()
})

/**
 * @param {import('../index.js').Feed} feed
 */
function mock (feed) {
  feed._fetchTipHash = async () => mocks.tipHash
  feed._fetchBlockInfo = async () => mocks.blockInfo
}

function tmpdir () {
  return path.join(os.tmpdir(), Math.random().toString(16).slice(2))
}
