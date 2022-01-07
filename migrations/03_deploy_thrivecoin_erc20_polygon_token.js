'use strict'

const ThriveCoinERC20TokenPolygon = artifacts.require('ThriveCoinERC20TokenPolygon')

module.exports = async function (deployer, network, accounts) {
  if (['development', 'test'].includes(network)) {
    const owner = accounts[0]
    const config = {
      name_: 'ThriveCoin',
      symbol_: 'THRIVE',
      decimals_: 8,
      cap_: '1000000000',
      childChainManagerProxy_: '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa'
    }

    await deployer.deploy(ThriveCoinERC20TokenPolygon, ...Object.values(config), { from: owner })
  }

  if (network === 'private') {
    const owner = accounts[0]

    const config = {
      name_: 'ThriveCoin',
      symbol_: 'THRIVE',
      decimals_: 8,
      cap_: '100000000000000000',
      childChainManagerProxy_: '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa'
    }

    await deployer.deploy(ThriveCoinERC20TokenPolygon, ...Object.values(config), { from: owner })
  }
}
