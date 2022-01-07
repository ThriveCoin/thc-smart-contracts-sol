'use strict'

/* eslint-env mocha */

const assert = require('assert')
const ThriveCoinERC20TokenPolygon = artifacts.require('ThriveCoinERC20TokenPolygon')

describe.only('ThriveCoinERC20TokenPolygon', () => {
  contract('polygon functionality tests', (accounts) => {
    let contract = null

    before(async () => {
      contract = await ThriveCoinERC20TokenPolygon.deployed()
    })

    it('constructor should set total supply to zero', async () => {
      const name = await contract.name.call()
      const symbol = await contract.symbol.call()
      const decimals = await contract.decimals.call()
      const totalSupply = await contract.totalSupply.call()
      const cap = await contract.cap.call()
      const childChainManagerProxy = await contract.childChainManagerProxy.call()

      assert.strictEqual(name, 'ThriveCoin')
      assert.strictEqual(symbol, 'THRIVE')
      assert.strictEqual(decimals.toNumber(), 8)
      assert.strictEqual(totalSupply.toNumber(), 0)
      assert.strictEqual(cap.toNumber(), 1000000000)
      assert.strictEqual(childChainManagerProxy, '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa')
    })

    it('childChainManagerProxy cannot be updated from others', async () => {
      try {
        await contract.updateChildChainManager('0xb5505a6d998549090530911180f38aC5130101c6', { from: accounts[1] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes(' VM Exception while processing transaction: revert'), true
        )
      }
    })

    it('childChainManagerProxy can be updated from owner', async () => {
      await contract.updateChildChainManager(accounts[1], { from: accounts[0] })

      const childChainManagerProxy = await contract.childChainManagerProxy.call()
      assert.strictEqual(childChainManagerProxy, accounts[1])
    })

    it('deposit should mint funds into account', async () => {
      const amount = web3.eth.abi.encodeParameter('uint256', 100)
      await contract.deposit(accounts[2], amount, { from: accounts[1] })

      const balance = await contract.balanceOf.call(accounts[2])
      assert.strictEqual(balance.toNumber(), 100)
    })

    it('deposit should increase account balance', async () => {
      const amount = web3.eth.abi.encodeParameter('uint256', 30)
      await contract.deposit(accounts[2], amount, { from: accounts[1] })

      const balance = await contract.balanceOf.call(accounts[2])
      assert.strictEqual(balance.toNumber(), 130)
    })

    it('deposit can be called only by proxy', async () => {
      const amount = web3.eth.abi.encodeParameter('uint256', 100)

      try {
        await contract.deposit(accounts[2], amount, { from: accounts[0] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes(' VM Exception while processing transaction: revert'), true
        )
      }
    })

    it('withdraw should decrease balance', async () => {
      await contract.withdraw(50, { from: accounts[2] })

      const balance = await contract.balanceOf.call(accounts[2])
      assert.strictEqual(balance.toNumber(), 80)
    })
  })
})
