'use strict'

/* eslint-env mocha */

const assert = require('assert')
const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
const SECONDS_PER_DAY = 86400

describe.only('ThriveCoinVestingSchedule', () => {
  contract('constructor tests', (accounts) => {
    const ThriveCoinERC20Token = artifacts.require('ThriveCoinERC20Token')
    const ThriveCoinVestingSchedule = artifacts.require('ThriveCoinVestingSchedule')

    let erc20 = null
    const startTime = Math.floor(Date.now() / 1000) + SECONDS_PER_DAY
    const contractArgs = {
      token_: '',
      beneficiary_: accounts[1],
      allocatedAmount_: 100,
      startTime: startTime,
      duration_: 30,
      cliffDuration_: 5,
      interval_: 4,
      claimed_: 0,
      revokable_: false,
      immutableBeneficiary_: true
    }

    before(async () => {
      erc20 = await ThriveCoinERC20Token.deployed()
      contractArgs.token_ = erc20.address
    })

    it('should fail instantiation when token address is zero address', async () => {
      try {
        await ThriveCoinVestingSchedule.new(
          ...Object.values({ ...contractArgs, token_: ADDRESS_ZERO }),
          { from: accounts[0] }
        )
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ThriveCoinVestingSchedule: token is zero address'), true
        )
      }
    })

    it('should fail instantiation when beneficiary address is zero address', async () => {
      try {
        await ThriveCoinVestingSchedule.new(
          ...Object.values({ ...contractArgs, beneficiary_: ADDRESS_ZERO }),
          { from: accounts[0] }
        )
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ThriveCoinVestingSchedule: beneficiary is zero address'), true
        )
      }
    })

    it('should fail instantiation when cliffDuration is greater than duration', async () => {
      try {
        await ThriveCoinVestingSchedule.new(
          ...Object.values({ ...contractArgs, cliffDuration_: 40 }),
          { from: accounts[0] }
        )
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ThriveCoinVestingSchedule: cliff duration greater than duration'), true
        )
      }
    })

    it('should fail instantiation when interval is lower than 1', async () => {
      try {
        await ThriveCoinVestingSchedule.new(
          ...Object.values({ ...contractArgs, interval_: 0 }),
          { from: accounts[0] }
        )
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ThriveCoinVestingSchedule: interval should be at least 1 day'), true
        )
      }
    })

    it('should work with valid contract args', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values(contractArgs),
        { from: accounts[0] }
      )
      assert.strictEqual(typeof contract.address, 'string')
    })
  })

  contract('private props access tests', (accounts) => {
    const ThriveCoinERC20Token = artifacts.require('ThriveCoinERC20Token')
    const ThriveCoinVestingSchedule = artifacts.require('ThriveCoinVestingSchedule')

    let contract = null
    let erc20 = null
    const startTime = Math.floor(Date.now() / 1000) + SECONDS_PER_DAY
    const contractArgs = {
      token_: '',
      beneficiary_: accounts[1],
      allocatedAmount_: 100,
      startTime: startTime,
      duration_: 30,
      cliffDuration_: 5,
      interval_: 4,
      claimed_: 0,
      revokable_: false,
      immutableBeneficiary_: true
    }

    before(async () => {
      erc20 = await ThriveCoinERC20Token.deployed()
      contractArgs.token_ = erc20.address
      contract = await ThriveCoinVestingSchedule.new(
        ...Object.values(contractArgs),
        { from: accounts[0] }
      )
    })

    it('should expose token for read access', async () => {
      const token = await contract.token.call()
      assert.strictEqual(token, contractArgs.token_)
    })

    it('should expose beneficiary for read access', async () => {
      const beneficiary = await contract.beneficiary.call()
      assert.strictEqual(beneficiary, contractArgs.beneficiary_)
    })

    it('should expose allocatedAmount for read access', async () => {
      const allocatedAmount = await contract.allocatedAmount.call()
      assert.strictEqual(allocatedAmount.toNumber(), contractArgs.allocatedAmount_)
    })

    it('should expose startDay for read access', async () => {
      const startDay = await contract.startDay.call()
      assert.strictEqual(startDay.toNumber(), Math.floor(contractArgs.startTime / SECONDS_PER_DAY))
    })

    it('should expose duration for read access', async () => {
      const duration = await contract.duration.call()
      assert.strictEqual(duration.toNumber(), contractArgs.duration_)
    })

    it('should expose cliffDuration for read access', async () => {
      const cliffDuration = await contract.cliffDuration.call()
      assert.strictEqual(cliffDuration.toNumber(), contractArgs.cliffDuration_)
    })

    it('should expose interval for read access', async () => {
      const interval = await contract.interval.call()
      assert.strictEqual(interval.toNumber(), contractArgs.interval_)
    })

    it('should expose revokable for read access', async () => {
      const revokable = await contract.revokable.call()
      assert.strictEqual(revokable, contractArgs.revokable_)
    })

    it('should expose immutableBeneficiary for read access', async () => {
      const immutableBeneficiary = await contract.immutableBeneficiary.call()
      assert.strictEqual(immutableBeneficiary, contractArgs.immutableBeneficiary_)
    })
  })

  contract('calc vested amount tests', (accounts) => {
    const ThriveCoinERC20Token = artifacts.require('ThriveCoinERC20Token')
    const ThriveCoinVestingSchedule = artifacts.require('ThriveCoinVestingSchedule')

    let contract = null
    let erc20 = null
    const startTime = Math.floor(Date.now() / 1000) + SECONDS_PER_DAY
    const contractArgs = {
      token_: '',
      beneficiary_: accounts[1],
      allocatedAmount_: 100,
      startTime: startTime,
      duration_: 30,
      cliffDuration_: 5,
      interval_: 4,
      claimed_: 0,
      revokable_: false,
      immutableBeneficiary_: true
    }

    before(async () => {
      erc20 = await ThriveCoinERC20Token.deployed()
      contractArgs.token_ = erc20.address
      contract = await ThriveCoinVestingSchedule.new(
        ...Object.values(contractArgs),
        { from: accounts[0] }
      )
    })

    it('should return 0 if timestamp is less than startDay', async () => {
      const startDay = (await contract.startDay.call()).toNumber()
      const timestamp = (startDay - 1) * SECONDS_PER_DAY
      const calcRes = await contract.calcVestedAmount.call(timestamp)
      assert.strictEqual(calcRes.toNumber(), 0)
    })

    it('should return 0 if timestamp is less than startDay + cliffDuration', async () => {
      const startDay = (await contract.startDay.call()).toNumber()
      const timestamp = (startDay + contractArgs.cliffDuration_ - 1) * SECONDS_PER_DAY
      const calcRes = await contract.calcVestedAmount.call(timestamp)

      assert.strictEqual(calcRes.toNumber(), 0)
    })

    it('should return calculated vested amount until cliffDuration when timestamp is equal to cliffDuration', async () => {
      const startDay = (await contract.startDay.call()).toNumber()
      const timestamp = (startDay + contractArgs.cliffDuration_) * SECONDS_PER_DAY
      const calcRes = await contract.calcVestedAmount.call(timestamp)

      assert.strictEqual(calcRes.toNumber(), 13) // 3.33 * 4 => 13.32 -> 13
    })

    it('should calc values accuratelly based on duration and interval', async () => {
      const startDay = (await contract.startDay.call()).toNumber()
      const timestamp = (startDay + 10) * SECONDS_PER_DAY
      const calcRes = await contract.calcVestedAmount.call(timestamp)

      assert.strictEqual(calcRes.toNumber(), 26) // 3.33 * 8 => 26.64 -> 26
    })

    it('can return less than total in last vesting day depending on params', async () => {
      const startDay = (await contract.startDay.call()).toNumber()
      const timestamp = (startDay + contractArgs.duration_) * SECONDS_PER_DAY
      const calcRes = await contract.calcVestedAmount.call(timestamp)

      assert.strictEqual(calcRes.toNumber(), 93) // 3.33 * 28 => 93.33 -> 93
    })

    it('can return total in last vesting day depending on params', async () => {
      const testContract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, interval_: 1, duration_: 100 }),
        { from: accounts[0] }
      )
      const startDay = (await testContract.startDay.call()).toNumber()
      const timestamp = (startDay + 100) * SECONDS_PER_DAY
      const calcRes = await testContract.calcVestedAmount.call(timestamp)

      assert.strictEqual(calcRes.toNumber(), 100)
    })

    it('should return total amount if it exceeds duration', async () => {
      const startDay = (await contract.startDay.call()).toNumber()
      const timestamp = (startDay + contractArgs.duration_ + 1) * SECONDS_PER_DAY
      const allocatedAmount = await contract.allocatedAmount.call()
      const calcRes = await contract.calcVestedAmount.call(timestamp)

      assert.strictEqual(calcRes.toNumber(), allocatedAmount.toNumber())
    })
  })

  contract('claim tests', (accounts) => {
    const ThriveCoinERC20Token = artifacts.require('ThriveCoinERC20Token')
    const ThriveCoinVestingSchedule = artifacts.require('ThriveCoinVestingSchedule')

    let erc20 = null
    const startOfDay = Math.floor(Math.floor(Date.now() / 1000) / SECONDS_PER_DAY) * SECONDS_PER_DAY
    const contractArgs = {
      token_: '',
      beneficiary_: accounts[1],
      allocatedAmount_: 100,
      startTime: startOfDay,
      duration_: 30,
      cliffDuration_: 5,
      interval_: 4,
      claimed_: 0,
      revokable_: false,
      immutableBeneficiary_: true
    }

    before(async () => {
      erc20 = await ThriveCoinERC20Token.deployed()
      contractArgs.token_ = erc20.address
    })

    it('should fail when contract does not have funds', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )

      const available = await contract.available.call()
      assert.strictEqual(available.toNumber(), 26)

      try {
        await contract.claim(26, { from: contractArgs.beneficiary_ })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ERC20LockedFunds: amount exceeds balance allowed to be spent'), true
        )
      }
    })

    it('should fail when amount exceeds available funds', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })

      const available = await contract.available.call()
      assert.strictEqual(available.toNumber(), 26)

      try {
        await contract.claim(30, { from: contractArgs.beneficiary_ })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ThriveCoinVestingSchedule: amount exceeds available balance'), true
        )
      }
    })

    it('should transfer funds when contract has requested amount and amount is available', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })

      const availableBefore = await contract.available.call()
      const claimedBefore = await contract.claimed.call()
      const contractBalBefore = await erc20.balanceOf.call(contract.address)
      const beneficiaryBalBefore = await erc20.balanceOf.call(contractArgs.beneficiary_)

      await contract.claim(20, { from: contractArgs.beneficiary_ })

      const availableAfter = await contract.available.call()
      const claimedAfter = await contract.claimed.call()
      const contractBalAfter = await erc20.balanceOf.call(contract.address)
      const beneficiaryBalAfter = await erc20.balanceOf.call(contractArgs.beneficiary_)

      assert.strictEqual(availableBefore.toNumber(), 26)
      assert.strictEqual(claimedBefore.toNumber(), 0)
      assert.strictEqual(contractBalBefore.toNumber(), 26)
      assert.strictEqual(beneficiaryBalBefore.toNumber(), 0)
      assert.strictEqual(availableAfter.toNumber(), 6)
      assert.strictEqual(claimedAfter.toNumber(), 20)
      assert.strictEqual(contractBalAfter.toNumber(), 6)
      assert.strictEqual(beneficiaryBalAfter.toNumber(), 20)
    })

    it('should emit VestingFundsClaimed event', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })
      const res = await contract.claim(20, { from: contractArgs.beneficiary_ })
      const txLog = res.logs[0]

      assert.strictEqual(txLog.event, 'VestingFundsClaimed')
      assert.strictEqual(txLog.args.token, erc20.address)
      assert.strictEqual(txLog.args.beneficiary, contractArgs.beneficiary_)
      assert.strictEqual(txLog.args.amount.toNumber(), 20)
    })

    it('should transfer up to available limit', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })

      const availableBefore = await contract.available.call()
      const claimedBefore = await contract.claimed.call()
      const contractBalBefore = await erc20.balanceOf.call(contract.address)
      const beneficiaryBalBefore = await erc20.balanceOf.call(contractArgs.beneficiary_)

      await contract.claim(26, { from: contractArgs.beneficiary_ })

      const availableAfter = await contract.available.call()
      const claimedAfter = await contract.claimed.call()
      const contractBalAfter = await erc20.balanceOf.call(contract.address)
      const beneficiaryBalAfter = await erc20.balanceOf.call(contractArgs.beneficiary_)

      assert.strictEqual(availableBefore.toNumber(), 26)
      assert.strictEqual(claimedBefore.toNumber(), 0)
      assert.strictEqual(contractBalBefore.toNumber(), 26)
      assert.strictEqual(beneficiaryBalBefore.toNumber(), 40)
      assert.strictEqual(availableAfter.toNumber(), 0)
      assert.strictEqual(claimedAfter.toNumber(), 26)
      assert.strictEqual(contractBalAfter.toNumber(), 0)
      assert.strictEqual(beneficiaryBalAfter.toNumber(), 66)
    })
  })

  contract('claimed metric tests', (accounts) => {
    const ThriveCoinERC20Token = artifacts.require('ThriveCoinERC20Token')
    const ThriveCoinVestingSchedule = artifacts.require('ThriveCoinVestingSchedule')

    let erc20 = null
    const startOfDay = Math.floor(Math.floor(Date.now() / 1000) / SECONDS_PER_DAY) * SECONDS_PER_DAY
    const contractArgs = {
      token_: '',
      beneficiary_: accounts[1],
      allocatedAmount_: 100,
      startTime: startOfDay,
      duration_: 30,
      cliffDuration_: 5,
      interval_: 4,
      claimed_: 0,
      revokable_: false,
      immutableBeneficiary_: true
    }

    before(async () => {
      erc20 = await ThriveCoinERC20Token.deployed()
      contractArgs.token_ = erc20.address
    })

    it('initial value could be zero', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )

      const claimed = await contract.claimed.call()
      assert.strictEqual(claimed.toNumber(), 0)
    })

    it('initial value could be different from zero', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY, claimed_: 10 }),
        { from: accounts[0] }
      )

      const claimed = await contract.claimed.call()
      assert.strictEqual(claimed.toNumber(), 10)
    })

    it('should return claimed so far after multiple claims', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })

      await contract.claim(13, { from: contractArgs.beneficiary_ })
      const claimed1 = await contract.claimed.call()

      await contract.claim(5, { from: contractArgs.beneficiary_ })
      const claimed2 = await contract.claimed.call()

      assert.strictEqual(claimed1.toNumber(), 13)
      assert.strictEqual(claimed2.toNumber(), 18)
    })
  })

  contract('vested metric tests', (accounts) => {
    const ThriveCoinERC20Token = artifacts.require('ThriveCoinERC20Token')
    const ThriveCoinVestingSchedule = artifacts.require('ThriveCoinVestingSchedule')

    let erc20 = null
    const startOfDay = Math.floor(Math.floor(Date.now() / 1000) / SECONDS_PER_DAY) * SECONDS_PER_DAY
    const contractArgs = {
      token_: '',
      beneficiary_: accounts[1],
      allocatedAmount_: 100,
      startTime: startOfDay,
      duration_: 30,
      cliffDuration_: 5,
      interval_: 4,
      claimed_: 0,
      revokable_: false,
      immutableBeneficiary_: true
    }

    before(async () => {
      erc20 = await ThriveCoinERC20Token.deployed()
      contractArgs.token_ = erc20.address
    })

    it('should return vested amount so far', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )

      const vested = await contract.vested.call()
      assert.strictEqual(vested.toNumber(), 26)
    })
  })

  contract('available metric tests', (accounts) => {
    const ThriveCoinERC20Token = artifacts.require('ThriveCoinERC20Token')
    const ThriveCoinVestingSchedule = artifacts.require('ThriveCoinVestingSchedule')

    let erc20 = null
    const startOfDay = Math.floor(Math.floor(Date.now() / 1000) / SECONDS_PER_DAY) * SECONDS_PER_DAY
    const contractArgs = {
      token_: '',
      beneficiary_: accounts[1],
      allocatedAmount_: 100,
      startTime: startOfDay,
      duration_: 30,
      cliffDuration_: 5,
      interval_: 4,
      claimed_: 0,
      revokable_: false,
      immutableBeneficiary_: true
    }

    before(async () => {
      erc20 = await ThriveCoinERC20Token.deployed()
      contractArgs.token_ = erc20.address
    })

    it('should return vested amount so far minus claimed so far', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })
      await contract.claim(20, { from: contractArgs.beneficiary_ })

      const vested = await contract.vested.call()
      const claimed = await contract.claimed.call()
      const available = await contract.available.call()

      assert.strictEqual(vested.toNumber(), 26)
      assert.strictEqual(available.toNumber(), 6)
      assert.strictEqual(claimed.toNumber(), 20)
    })
  })

  contract('locked metric tests', (accounts) => {
    const ThriveCoinERC20Token = artifacts.require('ThriveCoinERC20Token')
    const ThriveCoinVestingSchedule = artifacts.require('ThriveCoinVestingSchedule')

    let erc20 = null
    const startOfDay = Math.floor(Math.floor(Date.now() / 1000) / SECONDS_PER_DAY) * SECONDS_PER_DAY
    const contractArgs = {
      token_: '',
      beneficiary_: accounts[1],
      allocatedAmount_: 100,
      startTime: startOfDay,
      duration_: 30,
      cliffDuration_: 5,
      interval_: 4,
      claimed_: 0,
      revokable_: false,
      immutableBeneficiary_: true
    }

    before(async () => {
      erc20 = await ThriveCoinERC20Token.deployed()
      contractArgs.token_ = erc20.address
    })

    it('should return remaing amount to be unlocked', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })
      await contract.claim(20, { from: contractArgs.beneficiary_ })

      const vested = await contract.vested.call()
      const locked = await contract.locked.call()

      assert.strictEqual(vested.toNumber(), 26)
      assert.strictEqual(locked.toNumber(), 74)
    })
  })

  contract.only('revoke tests', (accounts) => {
    const ThriveCoinERC20Token = artifacts.require('ThriveCoinERC20Token')
    const ThriveCoinVestingSchedule = artifacts.require('ThriveCoinVestingSchedule')

    let erc20 = null
    const startOfDay = Math.floor(Math.floor(Date.now() / 1000) / SECONDS_PER_DAY) * SECONDS_PER_DAY
    const contractArgs = {
      token_: '',
      beneficiary_: accounts[1],
      allocatedAmount_: 100,
      startTime: startOfDay,
      duration_: 30,
      cliffDuration_: 5,
      interval_: 4,
      claimed_: 0,
      revokable_: false,
      immutableBeneficiary_: true
    }

    before(async () => {
      erc20 = await ThriveCoinERC20Token.deployed()
      contractArgs.token_ = erc20.address
    })

    it('should return remaing amount to owner', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })
      await contract.claim(20, { from: contractArgs.beneficiary_ })

      const revokedBefore = await contract.revoked.call()
      const contractBalBefore = await erc20.balanceOf(contract.address)
      const beneficiaryBalBefore = await erc20.balanceOf(contractArgs.beneficiary_)
      const ownerBalBefore = await erc20.balanceOf(accounts[0])

      await contract.revoke({ from: accounts[0] })

      const revokedAfter = await contract.revoked.call()
      const contractBalAfter = await erc20.balanceOf(contract.address)
      const beneficiaryBalAfter = await erc20.balanceOf(contractArgs.beneficiary_)
      const ownerBalAfter = await erc20.balanceOf(accounts[0])

      assert.strictEqual(revokedBefore, false)
      assert.strictEqual(contractBalBefore.toNumber(), 80)
      assert.strictEqual(beneficiaryBalBefore.toNumber(), 20)
      assert.strictEqual(ownerBalBefore.toNumber(), 999999900)
      assert.strictEqual(revokedAfter, true)
      assert.strictEqual(contractBalAfter.toNumber(), 0)
      assert.strictEqual(beneficiaryBalAfter.toNumber(), 20)
      assert.strictEqual(ownerBalAfter.toNumber(), 999999980)
    })

    it('can revoke the whole amount if not claimed', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })

      const revokedBefore = await contract.revoked.call()
      const contractBalBefore = await erc20.balanceOf(contract.address)
      const ownerBalBefore = await erc20.balanceOf(accounts[0])

      await contract.revoke({ from: accounts[0] })

      const revokedAfter = await contract.revoked.call()
      const contractBalAfter = await erc20.balanceOf(contract.address)
      const ownerBalAfter = await erc20.balanceOf(accounts[0])

      assert.strictEqual(revokedBefore, false)
      assert.strictEqual(contractBalBefore.toNumber(), 100)
      assert.strictEqual(ownerBalBefore.toNumber(), 999999880)
      assert.strictEqual(revokedAfter, true)
      assert.strictEqual(contractBalAfter.toNumber(), 0)
      assert.strictEqual(ownerBalAfter.toNumber(), 999999980)
    })

    it('won\'t revoke any amount if all funds are already claimed', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 50 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })
      await contract.claim(100, { from: contractArgs.beneficiary_ })

      const revokedBefore = await contract.revoked.call()
      const contractBalBefore = await erc20.balanceOf(contract.address)
      const beneficiaryBalBefore = await erc20.balanceOf(contractArgs.beneficiary_)
      const ownerBalBefore = await erc20.balanceOf(accounts[0])

      await contract.revoke({ from: accounts[0] })

      const revokedAfter = await contract.revoked.call()
      const contractBalAfter = await erc20.balanceOf(contract.address)
      const beneficiaryBalAfter = await erc20.balanceOf(contractArgs.beneficiary_)
      const ownerBalAfter = await erc20.balanceOf(accounts[0])

      assert.strictEqual(revokedBefore, false)
      assert.strictEqual(contractBalBefore.toNumber(), 0)
      assert.strictEqual(beneficiaryBalBefore.toNumber(), 120)
      assert.strictEqual(ownerBalBefore.toNumber(), 999999880)
      assert.strictEqual(revokedAfter, true)
      assert.strictEqual(contractBalAfter.toNumber(), 0)
      assert.strictEqual(beneficiaryBalAfter.toNumber(), 120)
      assert.strictEqual(ownerBalAfter.toNumber(), 999999880)
    })

    it('should emit VestingFundsRevoked event', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })
      await contract.claim(20, { from: contractArgs.beneficiary_ })

      const res = await contract.revoke({ from: accounts[0] })
      const txLog = res.logs[0]

      assert.strictEqual(txLog.event, 'VestingFundsRevoked')
      assert.strictEqual(txLog.args.token, erc20.address)
      assert.strictEqual(txLog.args.beneficiary, contractArgs.beneficiary_)
      assert.strictEqual(txLog.args.refundDest, accounts[0])
      assert.strictEqual(txLog.args.amount.toNumber(), 80)
    })

    it('can be triggered only by owner', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })

      try {
        await contract.revoke({ from: accounts[1] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('Ownable: caller is not the owner'), true
        )
      }
    })

    it('cannot be called if contract is already revoked', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })
      await contract.revoke({ from: accounts[0] })

      try {
        await contract.revoke({ from: accounts[0] })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ThriveCoinVestingSchedule: contract is revoked'), true
        )
      }
    })

    it('funds cannot be claimed once revoked', async () => {
      const contract = await ThriveCoinVestingSchedule.new(
        ...Object.values({ ...contractArgs, startTime: startOfDay - 10 * SECONDS_PER_DAY }),
        { from: accounts[0] }
      )
      await erc20.transfer(contract.address, 100, { from: accounts[0] })
      await contract.claim(5, { from: contractArgs.beneficiary_ })
      await contract.revoke({ from: accounts[0] })

      try {
        await contract.claim(5, { from: contractArgs.beneficiary_ })
        throw new Error('Should not reach here')
      } catch (err) {
        assert.strictEqual(
          err.message.includes('ThriveCoinVestingSchedule: contract is revoked'), true
        )
      }
    })
  })
})
