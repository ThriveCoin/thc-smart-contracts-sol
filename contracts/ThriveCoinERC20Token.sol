// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "./ERC20DynamicCap.sol";

/**
 * @dev Implementation of the THC ERC20 Token.
 *
 * THC is a dynamic supply cross chain ERC20 token that supports burning and
 * minting. The token is capped where `cap` is dynamic, but can only be
 * decreased after the initial value. The decrease of `cap` happens when
 * additional blockchains are added. The idea is to divide every blockchain
 * to keep nearly equal `cap`, so e.g. when a new blockchain is supported
 * all existing blockchains decrease their `cap`.
 *
 * Token cross chain swapping is supported through minting and burning
 * where a separate smart contract also owned by THC owner will operate on each
 * chain and will handle requests. The steps of swapping are:
 * - `address` calls approve(`swap_contract_chain_1`, `swap_amount`)
 * - `swap_contract_chain_1` calls burnFrom(`address`, `swap_amount`)
 * - `swap_contract_chain_2` calls mint(`address`, `swap_amount`)
 * NOTE: If an address beside `swap_contract_chain_1` calls burn action
 * the funds will be lost forever and are not recoverable, this will cause to
 * decrease total supply additionally!
 *
 * Key features:
 * - burn
 * - mint
 * - capped, dynamic decreasing only
 * - pausable
 * - blocking/unblocking accounts
 */
contract ThriveCoinERC20Token is ERC20Burnable, ERC20Pausable, ERC20DynamicCap, Ownable {
  uint8 private _decimals;

  /**
   * @dev Sets the values for {name}, {symbol}, {decimals}, {totalSupply} and
   * {cap}.
   *
   * All of these values beside {cap} are immutable: they can only be set
   * once during construction. {cap} param is only decreasable and is expected
   * to decrease when additional blockchains are added.
   *
   */
  constructor(
    string memory name_,
    string memory symbol_,
    uint8 decimals_,
    uint256 totalSupply_,
    uint256 cap_
  ) ERC20(name_, symbol_) ERC20DynamicCap(cap_) {
    _setupDecimals(decimals_);
    _mint(owner(), totalSupply_);
  }

  /**
   * @dev Returns the number of decimals used to get its user representation.
   * For example, if `decimals` equals `2`, a balance of `505` tokens should
   * be displayed to a user as `5.05` (`505 / 10 ** 2`).
   *
   * NOTE: This information is only used for _display_ purposes: it in
   * no way affects any of the arithmetic of the contract, including
   * {IERC20-balanceOf} and {IERC20-transfer}.
   */
  function decimals() public view virtual override returns (uint8) {
    return _decimals;
  }

  /**
   * @dev Creates `amount` new tokens for `account`.
   *
   * See {ERC20-_mint}.
   *
   * Requirements:
   *
   * - the caller must be owner.
   */
  function mint(address account, uint256 amount) external virtual onlyOwner {
    _mint(account, amount); // TODO: Grant mint access to swap smart contracts
  }

  /**
   * @dev Sets the value of `_decimals` field
   */
  function _setupDecimals(uint8 decimals_) internal virtual {
    _decimals = decimals_;
  }

  /**
   * @dev See {ERC20Pausable-_mint}.
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual override(ERC20, ERC20Pausable) {
    ERC20Pausable._beforeTokenTransfer(from, to, amount);
  }

  /**
   * @dev See {ERC20DynamicCap-_mint}.
   */
  function _mint(address account, uint256 amount) internal virtual override(ERC20, ERC20DynamicCap) {
    ERC20DynamicCap._mint(account, amount);
  }
}
