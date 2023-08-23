export = BitcoinFeed;
declare class BitcoinFeed extends Feed {
    /**
     * @param {ConstructorParameters<typeof Feed>[0]} client
     * @param {ConstructorParameters<typeof Feed>[1]} config
     * @param {ConstructorParameters<typeof Feed>[2]} opts
     */
    constructor(client: [client: import("@synonymdev/web-relay/types/lib/client"), config: Feed.Config, opts?: {
        icon?: Uint8Array;
    }][0], config: [client: import("@synonymdev/web-relay/types/lib/client"), config: Feed.Config, opts?: {
        icon?: Uint8Array;
    }][1], opts: [client: import("@synonymdev/web-relay/types/lib/client"), config: Feed.Config, opts?: {
        icon?: Uint8Array;
    }][2]);
    _config: Feed.Config;
    _age: number;
    _interval: NodeJS.Timeout;
    onInterval(): Promise<void>;
    _updateBlockInfo(): Promise<void>;
    latestHash: any;
    _fetchTipHash(): Promise<string>;
    /**
     * @param {string} hash
     */
    _fetchBlockInfo(hash: string): Promise<any>;
}
import { Feed } from "@synonymdev/feeds";
//# sourceMappingURL=writer.d.ts.map