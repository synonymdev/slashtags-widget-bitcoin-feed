# slashtags-widget-bitcoin-feed

Populates the data for the Bitcoin stats widget.

The feed contains current data on the following Bitcoin properties...

* Block Height
* Last Block Time
* Transaction Count
* Block Size
* Block Weight
* Difficulty
* Merkle Root
* Mempool Transactions
* Mempool Size
* Mempool Total Fees
* Fee Estimate, Next Block
* Fee Estimate, 30m
* Fee Estimate, 60m
* Fee Estimate, Slow
* Fee Estimate, Min

The feed also contains a 'last block' field that contains a json blob with a collection of the above data in it. The json contains the following...

```
{
    height: <block height>,
    timestamp: <timestamp of last block>,
    transactionCount: <tx count>,
    size: <size of block>,
    weight: <weight of block>,
    difficulty: <difficulty>,
    hash: <blocks hash>,
    merkleRoot: <blocks merkle root>
}
```
