'use strict'

/* eslint-env mocha */

const assert = require('assert')
const ThriveCoinERC20Token = artifacts.require('ThriveCoinERC20Token')
const { keccak256 } = require('@ethersproject/keccak256')

describe('ThriveCoinERC20Token', () => {
  contract('pause tests', (accounts) => {
    let contract = null
    const MINTER_ROLE = keccak256(Buffer.from('MINTER_ROLE', 'utf8'))

    before(async () => {
      contract = await ThriveCoinERC20Token.deployed()
      await contract.approve(accounts[1], 5000, { from: accounts[0] })
      await contract.burn(10000, { from: accounts[0] })
      await contract.pause({ from: accounts[0] })
    })

    it('transfer should fail when paused', async () => {
      try {
        await contract.transfer(accounts[1], 10, { from: accounts[0] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20Pausable: token transfer while paused'),
          true
        )
      }
    })

    it('transferFrom should fail when paused', async () => {
      try {
        await contract.transferFrom(accounts[0], accounts[1], 100, { from: accounts[1] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20Pausable: token transfer while paused'),
          true
        )
      }
    })

    it('approve should fail when paused', async () => {
      try {
        await contract.approve(accounts[1], 100, { from: accounts[0] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ThriveCoinERC20Token: approve balance while paused'),
          true
        )
      }
    })

    it('increaseAllowance should fail when paused', async () => {
      try {
        await contract.increaseAllowance(accounts[1], 35, { from: accounts[0] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ThriveCoinERC20Token: approve balance while paused'),
          true
        )
      }
    })

    it('decreaseAllowance should fail when paused', async () => {
      try {
        await contract.decreaseAllowance(accounts[1], 35, { from: accounts[0] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ThriveCoinERC20Token: approve balance while paused'),
          true
        )
      }
    })

    it('mint should fail when paused', async () => {
      try {
        await contract.mint(accounts[1], 35, { from: accounts[0] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20Pausable: token transfer while paused'),
          true
        )
      }
    })

    it('burn should fail when paused', async () => {
      try {
        await contract.burn(100, { from: accounts[0] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20Pausable: token transfer while paused'),
          true
        )
      }
    })

    it('burnFrom should fail when paused', async () => {
      try {
        await contract.burnFrom(accounts[0], 35, { from: accounts[1] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ThriveCoinERC20Token: approve balance while paused'),
          true
        )
      }
    })

    it('updateCap should fail when paused', async () => {
      try {
        await contract.updateCap(999999000, { from: accounts[0] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ThriveCoinERC20Token: update cap while paused'),
          true
        )
      }
    })

    it('grantRole should work when paused', async () => {
      await contract.grantRole(MINTER_ROLE, accounts[1], { from: accounts[0] })
      await contract.grantRole(MINTER_ROLE, accounts[2], { from: accounts[0] })
    })

    it('revokeRole should work when paused', async () => {
      await contract.revokeRole(MINTER_ROLE, accounts[1], { from: accounts[0] })
    })

    it('renounceRole should work when paused', async () => {
      await contract.renounceRole(MINTER_ROLE, accounts[2], { from: accounts[2] })
    })
  })
})