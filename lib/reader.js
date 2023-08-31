const { Reader } = require('@synonymdev/feeds')

class BitcoinFeedReader extends Reader {
  /**
   * @returns {Promise<BlockInfo>}
   */
  getBlockInfo () {
    return this.getField('latest-block')
  }

  /**
   * @param {(blockInfo: BlockInfo) => void} cb
   */
  subscribeBlockInfo (cb) {
    return this.subscribe('latest-block', (blockInfo) => {
      cb(blockInfo)
    })
  }
}

module.exports = BitcoinFeedReader

/**
 * @typedef {{
 *  height: number,
 *  timestamp: number,
 *  transactionCount: number,
 *  size: number,
 *  weight: number,
 *  difficulty: number,
 *  hash: string,
 *  merkleRoot: string,
 * }} BlockInfo
 */
