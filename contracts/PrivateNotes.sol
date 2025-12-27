// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 }
    from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PrivateNotes
 * @notice Store encrypted text as chunked uint32 arrays (production pattern)
 * Each text is split into 4-byte chunks, each chunk encrypted as euint32
 */
contract PrivateNotes is ZamaEthereumConfig {
    // Store encrypted text chunks per user
    mapping(address => euint32[]) private encryptedNotes;
    
    // Track note count per user
    mapping(address => uint256) public noteCount;
    
    event NoteStored(address indexed user, uint256 noteLength);
    event NoteCleared(address indexed user);

    /**
     * @notice Store an encrypted note as euint32[] chunks
     * @param encryptedChunks Array of encrypted uint32 chunks (4 bytes each)
     * @param proof ZK proof for decryption
     */
    function setNote(
        externalEuint32[] calldata encryptedChunks,
        bytes calldata proof
    ) external {
        require(encryptedChunks.length > 0, "Empty note");
        require(encryptedChunks.length <= 256, "Note too long (max 1KB)");

        // Clear previous note
        delete encryptedNotes[msg.sender];

        // Decrypt and re-encrypt each chunk with proper access control
        for (uint256 i = 0; i < encryptedChunks.length; i++) {
            euint32 chunk = FHE.fromExternal(encryptedChunks[i], proof);
            
            // Allow user and contract to decrypt
            FHE.allow(chunk, msg.sender);
            FHE.allow(chunk, address(this));
            
            encryptedNotes[msg.sender].push(chunk);
        }

        noteCount[msg.sender] = encryptedChunks.length;
        emit NoteStored(msg.sender, encryptedChunks.length * 4);
    }

    /**
     * @notice Get the number of chunks in user's note
     */
    function getNoteChunkCount() external view returns (uint256) {
        return noteCount[msg.sender];
    }

    /**
     * @notice Grant another address permission to read your note
     */
    function allowRead(address reader) external {
        for (uint256 i = 0; i < encryptedNotes[msg.sender].length; i++) {
            FHE.allow(encryptedNotes[msg.sender][i], reader);
        }
    }

    /**
     * @notice Clear your note
     */
    function clearNote() external {
        delete encryptedNotes[msg.sender];
        noteCount[msg.sender] = 0;
        emit NoteCleared(msg.sender);
    }
}
