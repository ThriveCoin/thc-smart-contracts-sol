'use strict'

/* eslint-env mocha */

const assert = require('assert')
const ThriveCoinERC20Token = artifacts.require('ThriveCoinERC20Token')
const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

describe('ThriveCoinERC20Token', () => {
  contract('locked funds tests', (accounts) => {
    let contract = null

    before(async () => {
      contract = await ThriveCoinERC20Token.deployed()
      await contract.transfer(accounts[1], 1000, { from: accounts[0] })
      await contract.transfer(accounts[2], 1000, { from: accounts[0] })
    })

    it('locked balance by default should be zero', async () => {
      const balance = await contract.lockedBalanceOf.call(accounts[3])
      assert.strictEqual(balance.toNumber(), 0)
    })

    it('locked balance per account by default should be zero', async () => {
      const balance = await contract.lockedBalancePerAccount.call(accounts[1], accounts[2])
      assert.strictEqual(balance.toNumber(), 0)
    })

    it('lockAmount is available only for own funds', async () => {
      try {
        await contract.lockAmount(accounts[1], accounts[2], 100, { from: accounts[0] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: can lock only own funds'),
          true
        )
      }
    })

    it('lockAmount should fail when amount is zero', async () => {
      try {
        await contract.lockAmount(accounts[1], accounts[2], 0, { from: accounts[1] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: amount to be locked should be greater than zero'),
          true
        )
      }
    })

    it('lockAmount should fail when owner is zero address', async () => {
      try {
        await contract.lockAmount(ADDRESS_ZERO, accounts[2], 10, { from: accounts[1] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: can lock only own funds'),
          true
        )
      }
    })

    it('lockAmount should fail when spender is zero address', async () => {
      try {
        await contract.lockAmount(accounts[1], ADDRESS_ZERO, 10, { from: accounts[1] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: lock to the zero address'),
          true
        )
      }
    })

    it('lockAmount should set both _lockedBalances and _lockedAccountBalanceMap', async () => {
      await contract.lockAmount(accounts[1], accounts[2], 50, { from: accounts[1] })
      const totalLockedBalance = await contract.lockedBalanceOf.call(accounts[1])
      const lockedBalancePerAccount = await contract.lockedBalancePerAccount.call(accounts[1], accounts[2])

      assert.strictEqual(totalLockedBalance.toNumber(), 50)
      assert.strictEqual(lockedBalancePerAccount.toNumber(), 50)
    })

    it('lockAmount should emit LockedFunds event with amount specified in args', async () => {
      const res = await contract.lockAmount(accounts[1], accounts[3], 20, { from: accounts[1] })
      const txLog = res.logs[0]

      assert.strictEqual(txLog.event, 'LockedFunds')
      assert.strictEqual(txLog.args.owner, accounts[1])
      assert.strictEqual(txLog.args.spender, accounts[3])
      assert.strictEqual(txLog.args.amount.toNumber(), 20)

      const totalLockedBalance = await contract.lockedBalanceOf.call(accounts[1])
      const lockedBalancePerAccount = await contract.lockedBalancePerAccount.call(accounts[1], accounts[3])

      assert.strictEqual(totalLockedBalance.toNumber(), 70)
      assert.strictEqual(lockedBalancePerAccount.toNumber(), 20)
    })

    it('lockAmount should increase existing locked balances', async () => {
      await contract.lockAmount(accounts[1], accounts[2], 15, { from: accounts[1] })
      const totalLockedBalance = await contract.lockedBalanceOf.call(accounts[1])
      const lockedBalancePerAccount2 = await contract.lockedBalancePerAccount.call(accounts[1], accounts[2])
      const lockedBalancePerAccount3 = await contract.lockedBalancePerAccount.call(accounts[1], accounts[3])

      assert.strictEqual(totalLockedBalance.toNumber(), 85)
      assert.strictEqual(lockedBalancePerAccount2.toNumber(), 65)
      assert.strictEqual(lockedBalancePerAccount3.toNumber(), 20)
    })

    it('unlockAmount is available to spender only', async () => {
      try {
        await contract.unlockAmount(accounts[1], accounts[2], 10, { from: accounts[1] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: only spender can unlock funds'),
          true
        )
      }
    })

    it('unlockAmount should fail when amount is zero', async () => {
      try {
        await contract.unlockAmount(accounts[1], accounts[2], 0, { from: accounts[2] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: amount to be unlocked should be greater than zero'),
          true
        )
      }
    })

    it('unlockAmount should fail when owner is zero address', async () => {
      try {
        await contract.unlockAmount(ADDRESS_ZERO, accounts[2], 10, { from: accounts[2] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: unlock from the zero address'),
          true
        )
      }
    })

    it('unlockAmount should fail when spender is zero address', async () => {
      try {
        await contract.unlockAmount(accounts[1], ADDRESS_ZERO, 10, { from: accounts[1] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: only spender can unlock funds'),
          true
        )
      }
    })

    it('unlockAmount should fail when amount exceeds total locked balance', async () => {
      try {
        await contract.unlockAmount(accounts[1], accounts[2], 1000, { from: accounts[2] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: unlock amount exceeds locked total balance'),
          true
        )
      }
    })

    it('unlockAmount should fail when amount exceeds total locked balance for spender', async () => {
      try {
        await contract.unlockAmount(accounts[1], accounts[2], 70, { from: accounts[2] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: unlock amount exceeds locked spender balance'),
          true
        )
      }
    })

    it('unlockAmount should decrease existing locked balances', async () => {
      await contract.unlockAmount(accounts[1], accounts[2], 15, { from: accounts[2] })
      const totalLockedBalance = await contract.lockedBalanceOf.call(accounts[1])
      const lockedBalancePerAccount2 = await contract.lockedBalancePerAccount.call(accounts[1], accounts[2])
      const lockedBalancePerAccount3 = await contract.lockedBalancePerAccount.call(accounts[1], accounts[3])

      assert.strictEqual(totalLockedBalance.toNumber(), 70)
      assert.strictEqual(lockedBalancePerAccount2.toNumber(), 50)
      assert.strictEqual(lockedBalancePerAccount3.toNumber(), 20)
    })

    it('unlockAmount should emit UnlockedFunds event with amount specified in args', async () => {
      const res = await contract.unlockAmount(accounts[1], accounts[3], 5, { from: accounts[3] })
      const txLog = res.logs[0]

      assert.strictEqual(txLog.event, 'UnlockedFunds')
      assert.strictEqual(txLog.args.owner, accounts[1])
      assert.strictEqual(txLog.args.spender, accounts[3])
      assert.strictEqual(txLog.args.amount.toNumber(), 5)

      const totalLockedBalance = await contract.lockedBalanceOf.call(accounts[1])
      const lockedBalancePerAccount2 = await contract.lockedBalancePerAccount.call(accounts[1], accounts[2])
      const lockedBalancePerAccount3 = await contract.lockedBalancePerAccount.call(accounts[1], accounts[3])

      assert.strictEqual(totalLockedBalance.toNumber(), 65)
      assert.strictEqual(lockedBalancePerAccount2.toNumber(), 50)
      assert.strictEqual(lockedBalancePerAccount3.toNumber(), 15)
    })

    it('transfer should fail if it exceeds total locked balance', async () => {
      try {
        await contract.transfer(accounts[0], 936, { from: accounts[1] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: amount exceeds balance allowed to be spent'),
          true
        )
      }
    })

    it('transferFrom should fail if it exceeds total locked balance', async () => {
      const totalBalance = await contract.balanceOf.call(accounts[1])
      const totalLockedBalance = await contract.lockedBalanceOf.call(accounts[1])
      const lockedBalancePerAccount2 = await contract.lockedBalancePerAccount.call(accounts[1], accounts[2])
      const lockedBalancePerAccount3 = await contract.lockedBalancePerAccount.call(accounts[1], accounts[3])

      assert.strictEqual(totalBalance.toNumber(), 1000)
      assert.strictEqual(totalLockedBalance.toNumber(), 65)
      assert.strictEqual(lockedBalancePerAccount2.toNumber(), 50)
      assert.strictEqual(lockedBalancePerAccount3.toNumber(), 15)

      try {
        await contract.approve(accounts[2], 1000, { from: accounts[1] })
        // acc 2 can transfer at most 1000 - 65 + 50 - 985
        await contract.transferFrom(accounts[1], accounts[3], 986, { from: accounts[2] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: amount exceeds balance allowed to be spent'),
          true
        )
      }
    })

    it('burn should fail if it exceeds total locked balance', async () => {
      try {
        await contract.burn(936, { from: accounts[1] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: amount exceeds balance allowed to be spent'),
          true
        )
      }
    })

    // TODO: mint tests and reduce lock balance on trasnfer tests
  })
})
