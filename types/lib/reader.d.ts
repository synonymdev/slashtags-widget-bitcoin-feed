export = BitcoinFeedReader;
declare class BitcoinFeedReader extends Reader {
    /**
     * @returns {Promise<BlockInfo>}
     */
    getBlockInfo(): Promise<BlockInfo>;
    /**
     * @param {(blockInfo: BlockInfo) => void} cb
     */
    subscribeBlockInfo(cb: (blockInfo: BlockInfo) => void): () => void;
}
declare namespace BitcoinFeedReader {
    export { BlockInfo };
}
import { Reader } from "@synonymdev/feeds";
type BlockInfo = {
    height: number;
    timestamp: number;
    transactionCount: number;
    size: number;
    weight: number;
    difficulty: number;
    hash: string;
    merkleRoot: string;
};
//# sourceMappingURL=reader.d.ts.map