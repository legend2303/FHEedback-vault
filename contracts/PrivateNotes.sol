// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivateNotesFHE is ZamaEthereumConfig {
    struct Note {
        bytes encryptedData;
        bool active;
    }

    mapping(address => Note[]) private notes;

    event NoteSubmitted(address indexed user, uint256 noteIndex);
    event NoteDeleted(address indexed user, uint256 noteIndex);

    function submitPrivateNote(
        bytes calldata encryptedNote
    ) external {
        notes[msg.sender].push(
            Note({ encryptedData: encryptedNote, active: true })
        );

        emit NoteSubmitted(msg.sender, notes[msg.sender].length - 1);
    }

    function getMyNotes() external view returns (bytes[] memory, uint256[] memory) {
        Note[] storage userNotes = notes[msg.sender];
        uint256 count;

        for (uint256 i = 0; i < userNotes.length; i++) {
            if (userNotes[i].active) count++;
        }

        bytes[] memory result = new bytes[](count);
        uint256[] memory indices = new uint256[](count);
        uint256 idx;

        for (uint256 i = 0; i < userNotes.length; i++) {
            if (userNotes[i].active) {
                result[idx] = userNotes[i].encryptedData;
                indices[idx] = i;
                idx++;
            }
        }

        return (result, indices);
    }

    function deleteNote(uint256 index) external {
        require(index < notes[msg.sender].length, "Invalid index");
        require(notes[msg.sender][index].active, "Note already deleted");
        notes[msg.sender][index].active = false;
        emit NoteDeleted(msg.sender, index);
    }
}
