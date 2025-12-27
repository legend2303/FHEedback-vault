// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract EncryptedFeedback is ZamaEthereumConfig {
    struct Feedback {
        euint32 score;
        bool submitted;
    }

    struct Question {
        string text;
        address creator;
        uint256 createdAt;
        bool active;
    }

    mapping(uint256 => Question) public questions;
    mapping(uint256 => mapping(address => Feedback)) private feedbacks;

    uint256 public questionCount;
    address public owner;

    event QuestionCreated(uint256 indexed id, string text);
    event FeedbackSubmitted(uint256 indexed id, address indexed user);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createQuestion(string calldata text) external onlyOwner {
        questions[questionCount] = Question({
            text: text,
            creator: msg.sender,
            createdAt: block.timestamp,
            active: true
        });

        emit QuestionCreated(questionCount, text);
        questionCount++;
    }

    function submitFeedback(
        uint256 questionId,
        externalEuint32 encryptedScore,
        bytes calldata proof
    ) external {
        require(questionId < questionCount, "Invalid question");
        require(questions[questionId].active, "Inactive");
        require(!feedbacks[questionId][msg.sender].submitted, "Already submitted");

        euint32 score = FHE.fromExternal(encryptedScore, proof);

        FHE.allow(score, msg.sender);
        FHE.allow(score, address(this));

        feedbacks[questionId][msg.sender] = Feedback(score, true);

        emit FeedbackSubmitted(questionId, msg.sender);
    }

    function getMyFeedback(uint256 questionId) external view returns (euint32) {
        require(feedbacks[questionId][msg.sender].submitted, "No feedback");
        return feedbacks[questionId][msg.sender].score;
    }

    function getQuestion(uint256 id) external view returns (Question memory) {
        return questions[id];
    }

    function hasSubmitted(uint256 questionId, address user) external view returns (bool) {
        return feedbacks[questionId][user].submitted;
    }

    function deactivateQuestion(uint256 questionId) external {
        require(questionId < questionCount, "Invalid question");
        require(questions[questionId].creator == msg.sender, "Only creator can deactivate");
        require(questions[questionId].active, "Already inactive");
        
        questions[questionId].active = false;
    }
}
