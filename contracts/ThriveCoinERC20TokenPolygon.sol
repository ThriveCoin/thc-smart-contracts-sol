// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ThriveCoinERC20Token.sol";

/**
 * @dev Implementation of the THC ERC20 Token wrapper for Polygon chain
 */
contract ThriveCoinERC20TokenPolygon is ThriveCoinERC20Token {
  address public childChainManagerProxy;

  /**
   * @dev Sets the values for {name}, {symbol}, {decimals}, {cap} and
   * {childChainManagerProxy_}. `totalSupply` is 0 in this case because
   * minting in child chain smart contract's constructor not allowed!
   */
  constructor(
    string memory name_,
    string memory symbol_,
    uint8 decimals_,
    uint256 cap_,
    address childChainManagerProxy_
  ) ThriveCoinERC20Token(name_, symbol_, decimals_, 0, cap_) {
    childChainManagerProxy = childChainManagerProxy_;
  }

  /**
   * @dev Migrates childChainManagerProxy contract address to a new proxy
   * contract address.
   */
  function updateChildChainManager(address newChildChainManagerProxy) external {
    require(msg.sender == owner());
    childChainManagerProxy = newChildChainManagerProxy;
  }

  /**
   * @dev Mints locked funds from RootChain into ChildChain
   */
  function deposit(address user, bytes calldata depositData) external {
    require(msg.sender == childChainManagerProxy);

    // `amount` token getting minted here & equal amount got locked in RootChainManager
    uint256 amount = abi.decode(depositData, (uint256));
    _mint(user, amount);
  }

  /**
   * @dev Burns funds from ChildChain and later those funds will be unlocked
   * on RootChain
   */
  function withdraw(uint256 amount) external {
    _burn(msg.sender, amount);
  }
}
