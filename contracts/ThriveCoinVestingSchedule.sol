// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.5/contracts/finance/VestingWallet.sol
// https://github.com/cpu-coin/CPUcoin/blob/master/contracts/IERC20Vestable.sol

import "openzeppelin-solidity/contracts/utils/Context.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";

contract ThriveCoinVestingSchedule is Context, Ownable {
  event VestingFundsClaimed(address indexed token, address indexed beneficiary, uint256 amount);
  event VestingFundsRevoked(
    address indexed token,
    address indexed beneficiary,
    address indexed refundDest,
    uint256 amount
  );
  event VestingBeneficiaryChanged(
    address indexed token,
    address indexed oldBeneficiary,
    address indexed newBeneficiary
  );

  modifier onlyBeneficiary() {
    require(beneficiary() == _msgSender(), "ThriveCoinVestingSchedule: only beneficiary can perform the action");
    _;
  }

  modifier notRevoked() {
    require(revoked() == false, "ThriveCoinVestingSchedule: contract is revoked");
    _;
  }

  uint256 private constant SECONDS_PER_DAY = 86400;

  address private immutable _token;
  address private _beneficiary;
  uint256 private _allocatedAmount;
  uint256 private _startDay;
  uint256 private _duration;
  uint256 private _cliffDuration;
  uint256 private _interval;
  bool private immutable _revokable;
  bool private _revoked;
  bool private immutable _immutableBeneficiary;
  uint256 private _claimed;
  uint256 private _claimLimit;
  uint256 private _lastClaimedDay;
  uint256 private _dailyClaimedAmount;

  constructor(
    address token_,
    address beneficiary_,
    uint256 allocatedAmount_,
    uint256 startTime, // unix epoch ms
    uint256 duration_, // in days
    uint256 cliffDuration_, // in days
    uint256 interval_, // in days
    uint256 claimed_, // already claimed, helpful for chain migrations
    uint256 claimLimit_,
    bool revokable_,
    bool immutableBeneficiary_
  ) {
    require(token_ != address(0), "ThriveCoinVestingSchedule: token is zero address");
    require(beneficiary_ != address(0), "ThriveCoinVestingSchedule: beneficiary is zero address");
    require(cliffDuration_ <= duration_, "ThriveCoinVestingSchedule: cliff duration greater than duration");
    require(interval_ >= 1, "ThriveCoinVestingSchedule: interval should be at least 1 day");

    _token = token_;
    _beneficiary = beneficiary_;
    _allocatedAmount = allocatedAmount_;
    _startDay = startTime / SECONDS_PER_DAY;
    _duration = duration_;
    _cliffDuration = cliffDuration_;
    _interval = interval_;
    _claimed = claimed_;
    _claimLimit = claimLimit_;
    _revokable = revokable_;
    _immutableBeneficiary = immutableBeneficiary_;
    _revoked = false;
  }

  function token() public view virtual returns (address) {
    return _token;
  }

  function beneficiary() public view virtual returns (address) {
    return _beneficiary;
  }

  function allocatedAmount() public view virtual returns (uint256) {
    return _allocatedAmount;
  }

  function startDay() public view virtual returns (uint256) {
    return _startDay;
  }

  function duration() public view virtual returns (uint256) {
    return _duration;
  }

  function cliffDuration() public view virtual returns (uint256) {
    return _cliffDuration;
  }

  function interval() public view virtual returns (uint256) {
    return _interval;
  }

  function revokable() public view virtual returns (bool) {
    return _revokable;
  }

  function immutableBeneficiary() public view virtual returns (bool) {
    return _immutableBeneficiary;
  }

  function claimed() public view virtual returns (uint256) {
    return _claimed;
  }

  function vested() public view virtual returns (uint256) {
    return calcVestedAmount(block.timestamp);
  }

  function available() public view virtual returns (uint256) {
    return calcVestedAmount(block.timestamp) - claimed();
  }

  function locked() public view virtual returns (uint256) {
    return allocatedAmount() - calcVestedAmount(block.timestamp);
  }

  function revoked() public view virtual returns (bool) {
    return _revoked;
  }

  function calcVestedAmount(uint256 timestamp) public view virtual returns (uint256) {
    uint256 start = startDay();
    uint256 length = duration();
    uint256 timestampInDays = timestamp / SECONDS_PER_DAY;
    uint256 totalAmount = allocatedAmount();

    if (timestampInDays < start + cliffDuration()) {
      return 0;
    }

    if (timestampInDays > start + length) {
      return totalAmount;
    }

    uint256 itv = interval();
    uint256 daysVested = timestampInDays - start;
    uint256 effectiveDaysVested = (daysVested / itv) * itv; // e.g. 303/4 => 300, 304/4 => 304

    return (totalAmount * effectiveDaysVested) / length;
  }

  function claim(uint256 amount) public virtual onlyBeneficiary notRevoked {
    uint256 availableBal = available();
    require(amount <= availableBal, "ThriveCoinVestingSchedule: amount exceeds available balance");

    uint256 limit = claimLimit();
    uint256 timestampInDays = block.timestamp / SECONDS_PER_DAY;
    if (_lastClaimedDay != timestampInDays) {
      _lastClaimedDay = timestampInDays;
      _dailyClaimedAmount = 0;
    }

    require(
      (amount + _dailyClaimedAmount) <= limit || limit == 0,
      "ThriveCoinVestingSchedule: amount exceeds claim limit"
    );

    _dailyClaimedAmount += amount;
    _claimed += amount;
    emit VestingFundsClaimed(_token, _beneficiary, amount);
    SafeERC20.safeTransfer(IERC20(_token), _beneficiary, amount);
  }

  function revoke() public virtual onlyOwner notRevoked {
    uint256 amount = allocatedAmount() - claimed();
    address dest = owner();
    _revoked = true;
    emit VestingFundsRevoked(_token, _beneficiary, dest, amount);
    SafeERC20.safeTransfer(IERC20(_token), dest, amount);
  }

  function changeBeneficiary(address newBeneficiary) public virtual onlyOwner {
    require(immutableBeneficiary() == false, "ThriveCoinVestingSchedule: beneficiary is immutable");

    emit VestingBeneficiaryChanged(_token, _beneficiary, newBeneficiary);
    _beneficiary = newBeneficiary;
  }

  function claimLimit() public view virtual returns (uint256) {
    return _claimLimit;
  }

  function changeClaimLimit(uint256 newClaimLimit) public virtual onlyOwner {
    _claimLimit = newClaimLimit;
  }

  function lastClaimedDay() public view virtual returns (uint256) {
    return _lastClaimedDay;
  }

  function dailyClaimedAmount() public view virtual returns (uint256) {
    uint256 timestampInDays = block.timestamp / SECONDS_PER_DAY;
    return timestampInDays == _lastClaimedDay ? _dailyClaimedAmount : 0;
  }
}
