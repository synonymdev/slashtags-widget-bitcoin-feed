import fs from 'fs'
import Feeds from '@synonymdev/feeds'
import { format, encode } from '@synonymdev/slashtags-url'
import axios from 'axios'
import logger from './logger.js'

export default class BitcoinFeeds {
    constructor(config, schema) {
        this.config = config
        this.schema = schema
        this.timer = null
        this.feedStorage = null
        this.driveId = config.driveId
        this.lastHash = 'none'
    }

    async init() {
        if (this.feedStorage) {
            throw new Error('Init called twice')
        }

        // Set up the storage for the feeds
        this.feedStorage = new Feeds(this.config.storagePath, this.schema)

        // ensure a drive has been created for our feeds and announce it - gets the keys back
        const driveKeys = await this.feedStorage.feed(this.driveId, { announce: true })

        // Write the images into the feed
        const imageData = fs.readFileSync('./src/schemas/images/block.svg')
        await this.feedStorage.ensureFile(this.driveId, '/images/block.svg', imageData)

        // this is the hyperdrive that will contain all the feed data
        const url = format(driveKeys.key, { protocol: 'slashfeed:', fragment: { encryptionKey: encode(driveKeys.encryptionKey) } })
        logger.info(this.schema.name)
        logger.info(url)

        for (let t of this.schema.fields) {
            logger.info(`Tracking Field ${t.name}`)
        }
    }

    async start() {
        if (!this.feedStorage) {
            throw new Error('Must call init before you can start')
        }

        // run the update once and schedule it to run on a regular basis
        this._onMinuteTimer()
    }

    async stop() {
        clearTimeout(this.timer)
    }

    async getFilenames(path) {
        return new Promise(async (resolve) => {
            const drive = await this.feedStorage._drive(this.driveId)
            const files = await drive.readdir(path)

            const all = []
            files.on('data', function (data) {
                all.push(data)
            })

            files.on('end', function () {
                resolve(all)
            })
        })
    }

    ////////////////////////////////////////////////////
    ////////////////////////////////////////////////////

    _setMinuteTimer() {
        this.timer = setTimeout(() => this._onMinuteTimer(), this._msToNextMinute())
    }

    async _onMinuteTimer() {
        // Update all the things (if they have changed)
        await this._updateBlockInfo()
        await this._updateMempool()

        // Ask for another go at the start of the next minute, whenever that is
        this._setMinuteTimer()
    }

    async _updateBlockInfo() {
        try {
            // Find out the current tip height
            const tipHashUrl = 'https://mempool.space/api/blocks/tip/hash'
            const response = await axios.get(tipHashUrl)
            const hash = response.data
            if (hash === this.lastHash) {
                return
            }

            // This is a new block, so update everything related to it
            // note the current hash
            this.lastHash = hash

            // Collect data on the new block
            const blockInfoUrl = `https://mempool.space/api/block/${hash}`
            const blockInfoRes = await axios.get(blockInfoUrl)
            const blockInfo = blockInfoRes.data
            if (!blockInfo) {
                return
            }

            const difficulty = (blockInfo.difficulty / 1000000000000).toFixed(2)
            const size = (blockInfo.size / 1024).toFixed(2)
            const weight = (blockInfo.weight / 1024 / 1024).toFixed(2)
            await this._writeValue('height', `${blockInfo.height}`)
            await this._writeValue('timestamp', `${blockInfo.timestamp}`)
            await this._writeValue('transactionCount', `${blockInfo.tx_count}`)
            await this._writeValue('size', `${size}`)
            await this._writeValue('weight', `${weight}`)
            await this._writeValue('difficulty', `${difficulty}`)
            await this._writeValue('merkleRoot', `${blockInfo.merkle_root}`)
            await this._writeValue('hash', `${hash}`)

            // and the aggregate
            await this._writeValue('lastBlock', {
                height: blockInfo.height,
                timestamp: blockInfo.timestamp,
                transactionCount: blockInfo.tx_count,
                size,
                weight,
                difficulty,
                hash,
                merkleRoot: blockInfo.merkle_root,
            })
        } catch (err) {
            logger.error(err)
        }
    }

    // NOTE: all fields disabled via schema
    async _updateMempool() {
        try {
            // Find out about the current mempool state
            const mempoolUrl = 'https://mempool.space/api/mempool'
            const poolRes = await axios.get(mempoolUrl)
            const mempool = poolRes.data

            await this._writeValue('mempoolTransactions', `${mempool.count}`)
            await this._writeValue('mempoolSize', `${mempool.vsize}`)
            await this._writeValue('mempoolTotalFees', `${mempool.total_fee}`)

            const mempoolFeesUrl = 'https://mempool.space/api/v1/fees/recommended'
            const feeRes = await axios.get(mempoolFeesUrl)
            const mempoolFees = feeRes.data

            await this._writeValue('mempoolNextFee', `${mempoolFees.fastestFee}`)
            await this._writeValue('mempool30mFee', `${mempoolFees.halfHourFee}`)
            await this._writeValue('mempool60mFee', `${mempoolFees.hourFee}`)
            await this._writeValue('mempoolSlowFee', `${mempoolFees.economyFee}`)
            await this._writeValue('mempoolMinFee', `${mempoolFees.minimumFee}`)
        } catch (err) {
            logger.error(err)
        }
    }

    async _writeValue(key, value) {
        const field = this.schema.fields.find((f) => f.key === key)
        if (!field) {
            return
        }

        // fetch the current value and only update if it is different
        const existingValue = await this.feedStorage.get(this.driveId, key)
        if (JSON.stringify(existingValue) === JSON.stringify(value)) {
            return
        }

        logger.info(`Updating ${key} = ${JSON.stringify(value)}`)
        await this.feedStorage.update(this.driveId, key, value)
    }

    _msToNextUnit(unit) {
        const now = Date.now()
        const nextUnitStartsAt = Math.floor(Math.ceil(now / unit) * unit)

        return nextUnitStartsAt - now
    }

    _msToNextMinute() {
        // add 10ms, so we always land the right side of the minute
        return this._msToNextUnit(1000 * 60) + 10
    }
}
