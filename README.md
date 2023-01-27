# slashtags-widget-bitcoin-feed

Populates the data for the Bitcoin stats widget.

The feed contains a 'lastBlock' field that contains a json blob with a collection of the above data in it. The json contains the following...

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
