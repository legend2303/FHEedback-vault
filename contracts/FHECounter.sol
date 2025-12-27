// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivateNotes is ZamaEthereumConfig {
    mapping(address => euint32[]) private encryptedNotes;
    mapping(address => uint256) public noteCount;

    event NoteStored(address indexed user, uint256 byteLength);
    event NoteCleared(address indexed user);

    /**
     * @notice Store encrypted note chunks (4 bytes per chunk)
     * @dev One proof PER chunk (required)
     */
    function setNote(
        externalEuint32[] calldata encryptedChunks,
        bytes[] calldata proofs
    ) external {
        uint256 len = encryptedChunks.length;
        require(len > 0, "Empty note");
        require(len <= 256, "Note too long");
        require(len == proofs.length, "Chunks/proofs mismatch");

        delete encryptedNotes[msg.sender];

        for (uint256 i = 0; i < len; i++) {
            euint32 chunk = FHE.fromExternal(encryptedChunks[i], proofs[i]);

            FHE.allow(chunk, msg.sender);
            FHE.allowThis(chunk);

            encryptedNotes[msg.sender].push(chunk);
        }

        noteCount[msg.sender] = len;
        emit NoteStored(msg.sender, len * 4);
    }

    /**
     * @notice Return encrypted chunk handle (for frontend decryption)
     */
    function getNoteChunk(uint256 index) external view returns (euint32) {
        require(index < encryptedNotes[msg.sender].length, "Out of bounds");
        return encryptedNotes[msg.sender][index];
    }

    function getNoteChunkCount() external view returns (uint256) {
        return encryptedNotes[msg.sender].length;
    }

    function allowRead(address reader) external {
        euint32[] storage chunks = encryptedNotes[msg.sender];
        for (uint256 i = 0; i < chunks.length; i++) {
            FHE.allow(chunks[i], reader);
        }
    }

    function clearNote() external {
        delete encryptedNotes[msg.sender];
        noteCount[msg.sender] = 0;
        emit NoteCleared(msg.sender);
    }
}
