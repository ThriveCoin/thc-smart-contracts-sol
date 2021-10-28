// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Extension of {ERC20} that adds capability for blocking accounts
 */
abstract contract ERC20Blockable is ERC20 {
  /**
   * @dev Events related to account blocking
   */
  event AccountBlocked(address indexed account, uint256 timestamp);
  event AccountUnblocked(address indexed account, uint256 timestamp);

  /**
   * @dev Mapping that tracks blocked accounts
   */
  mapping(address => bool) _blockedAccounts;

  /**
   * @dev Returns `true` if `account` has been blocked.
   */
  function isAccountBlocked(address account) public view returns (bool) {
    return _blockedAccounts[account];
  }

  /**
   * @dev Blocks the account, if account is already blocked returns `false`
   * otherwise returns `true`
   */
  function _blockAccount(address account) internal virtual returns (bool) {
    if (isAccountBlocked(account)) return false;

    _blockedAccounts[account] = true;
    emit AccountBlocked(account, block.timestamp);

    return true;
  }

  /**
   * @dev Unblocks the account, if account is not blocked returns `false`
   * otherwise returns `true`
   */
  function _unblockAccount(address account) internal virtual returns (bool) {
    if (!isAccountBlocked(account)) return false;

    _blockedAccounts[account] = false;
    emit AccountUnblocked(account, block.timestamp);

    return true;
  }

  /**
   * @dev See {ERC20-_beforeTokenTransfer}
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual override {
    require(!isAccountBlocked(from), "ERC20Blockable: sender account should be not be blocked");
    require(!isAccountBlocked(to), "ERC20Blockable: receiver account should be not be blocked");
    super._beforeTokenTransfer(from, to, amount);
  }

  /**
   * @dev See {ERC20-_approve}.
   */
  function _approve(
    address owner,
    address spender,
    uint256 amount
  ) internal virtual override {
    require(!isAccountBlocked(owner), "ERC20Blockable: owner account should be not be blocked");
    require(!isAccountBlocked(spender), "ERC20Blockable: spender account should be not be blocked");
    super._approve(owner, spender, amount);
  }
}
