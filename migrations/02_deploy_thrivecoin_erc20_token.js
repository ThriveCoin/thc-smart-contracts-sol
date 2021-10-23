'use strict'

const ThriveCoinERC20Token = artifacts.require('ThriveCoinERC20Token')

module.exports = function (deployer, network, accounts) {
  if (['development', 'test'].includes(network)) {
    const owner = accounts[0]
    const config = {
      name_: 'ThriveCoin',
      symbol_: 'THC',
      decimals_: 8,
      totalSupply_: '1000000000',
      cap_: '1000000000'
    }

    deployer.deploy(
      ThriveCoinERC20Token,
      ...Object.values(config),
      { from: owner }
    )
  }
}
