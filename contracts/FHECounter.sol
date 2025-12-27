// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract FHECounter is ZamaEthereumConfig {
    euint32 private _count;

    function increment(
        externalEuint32 inputEuint32,
        bytes calldata inputProof
    ) external {
        euint32 encrypted = FHE.fromExternal(inputEuint32, inputProof);
        require(FHE.isSenderAllowed(encrypted));

        _count = FHE.add(_count, encrypted);

        FHE.allow(_count, address(this));
        FHE.allow(_count, msg.sender);
    }

    function decrement(
        externalEuint32 inputEuint32,
        bytes calldata inputProof
    ) external {
        euint32 encrypted = FHE.fromExternal(inputEuint32, inputProof);
        require(FHE.isSenderAllowed(encrypted));

        _count = FHE.sub(_count, encrypted);

        FHE.allow(_count, address(this));
        FHE.allow(_count, msg.sender);
    }
}
