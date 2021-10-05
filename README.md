# thc-smart-contracts-sol

## Local env

Initialize configs:
```
bash setup-config.sh
```

Start a local node:
```
npm run local-node # or use Ganache GUI https://www.trufflesuite.com/ganache
```

Migrate contracts:
```
npm run migrate -- --network development
```

Run example:
```
node client/index.js
```

## Testing

```
npm run local-node
npm test
```
