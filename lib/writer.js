const { Feed } = require('@synonymdev/feeds')

const MINUTE = 1000 * 60

const INTERVAL = MINUTE // every 1 minute

class BitcoinFeed extends Feed {
  /**
   * @param {ConstructorParameters<typeof Feed>[0]} client
   * @param {ConstructorParameters<typeof Feed>[1]} config
   * @param {ConstructorParameters<typeof Feed>[2]} opts
   */
  constructor (client, config, opts) {
    super(client, config, opts)

    this._config = config

    // Time since start
    this._age = -1

    // Start on next tick, allowing mocking some methods in unit test after construction.
    setTimeout(() => {
      this.onInterval()
      this._interval = setInterval(this.onInterval.bind(this), INTERVAL)
    }, 0)
  }

  async onInterval () {
    this._updateBlockInfo()
  }

  async _updateBlockInfo () {
    try {
      const hash = await this._fetchTipHash()
      if (hash === this.latestHash) {
        return
      }

      // This is a new block, so update everything related to it
      // note the current hash
      this.latestHash = hash

      // Collect data on the new block
      const blockInfo = await this._fetchBlockInfo(hash)
      if (!blockInfo) {
        return
      }

      const difficulty = Number((blockInfo.difficulty / 1000000000000).toFixed(2))
      const size = Number((blockInfo.size / 1024).toFixed(2))
      const weight = Number((blockInfo.weight / 1024 / 1024).toFixed(2))

      await this.put('latest-block', Feed.encode({
        height: Number(blockInfo.height),
        timestamp: Number(blockInfo.timestamp),
        transactionCount: blockInfo.tx_count,
        size,
        weight,
        difficulty,
        hash,
        merkleRoot: blockInfo.merkle_root
      }))
    } catch (err) {
      console.error(err)
    }
  }

  async _fetchTipHash () {
    // Find out the current tip height
    const tipHashUrl = 'https://mempool.space/api/blocks/tip/hash'
    const response = await fetch(tipHashUrl)
    return response.text()
  }

  /**
   * @param {string} hash
   */
  async _fetchBlockInfo (hash) {
    const blockInfoUrl = `https://mempool.space/api/block/${hash}`
    const response = await fetch(blockInfoUrl)
    return response.json()
  }

  async close () {
    clearInterval(this._interval)
  }
}

module.exports = BitcoinFeed
