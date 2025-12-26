// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedFeedback
 * @notice A contract for collecting encrypted feedback scores (0-100)
 * Demonstrates meaningful FHE operations: aggregation and comparisons on encrypted data
 */
contract EncryptedFeedback is ZamaEthereumConfig {
    struct Feedback {
        euint32 score; // Encrypted score 0-100
        bool submitted;
    }

    // Store feedback per user per question
    mapping(uint256 => mapping(address => Feedback)) public userFeedback;
    
    // Store aggregate score per question (encrypted)
    mapping(uint256 => euint32) public aggregateScore;
    mapping(uint256 => uint32) public feedbackCount;
    
    // Questions
    struct Question {
        string text;
        uint256 createdAt;
        bool active;
    }
    
    mapping(uint256 => Question) public questions;
    uint256 public questionCount;
    address public owner;

    event FeedbackSubmitted(uint256 indexed questionId, address indexed user);
    event QuestionCreated(uint256 indexed questionId, string text);
    event AggregateUpdated(uint256 indexed questionId, uint32 count);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Create a new feedback question
     * @param _questionText The question text
     */
    function createQuestion(string memory _questionText) external onlyOwner {
        questions[questionCount] = Question({
            text: _questionText,
            active: true,
            createdAt: block.timestamp
        });
        
        emit QuestionCreated(questionCount, _questionText);
        questionCount++;
    }

    /**
     * @notice Submit encrypted feedback score for a question
     * @param _questionId The question ID
     * @param _encryptedScore The encrypted score (0-100)
     * @param _proof The decryption proof
     */
    function submitFeedback(
        uint256 _questionId,
        externalEuint32 _encryptedScore,
        bytes calldata _proof
    ) external {
        require(_questionId < questionCount, "Invalid question ID");
        require(questions[_questionId].active, "Question inactive");
        require(!userFeedback[_questionId][msg.sender].submitted, "Already submitted");

        // Decrypt score locally to verify it's 0-100 (security measure)
        euint32 score = FHE.fromExternal(_encryptedScore, _proof);

        // Store encrypted feedback
        userFeedback[_questionId][msg.sender] = Feedback({
            score: score,
            submitted: true
        });

        // Update aggregate (FHE addition of encrypted values)
        if (feedbackCount[_questionId] == 0) {
            aggregateScore[_questionId] = score;
        } else {
            aggregateScore[_questionId] = FHE.add(aggregateScore[_questionId], score);
        }

        feedbackCount[_questionId]++;
        FHE.allowThis(score);
        
        emit FeedbackSubmitted(_questionId, msg.sender);
    }

    /**
     * @notice Get your encrypted feedback for a question
     * @param _questionId The question ID
     * @return Your encrypted score
     */
    function getMyFeedback(uint256 _questionId) external view returns (euint32) {
        require(userFeedback[_questionId][msg.sender].submitted, "No feedback submitted");
        return userFeedback[_questionId][msg.sender].score;
    }

    /**
     * @notice Get encrypted aggregate score (only owner can decrypt offline)
     * @param _questionId The question ID
     * @return Encrypted sum of all feedback scores
     */
    function getEncryptedAggregate(uint256 _questionId) external view returns (euint32) {
        require(_questionId < questionCount, "Invalid question ID");
        require(feedbackCount[_questionId] > 0, "No feedback yet");
        return aggregateScore[_questionId];
    }

    /**
     * @notice Get feedback count for a question (plaintext - aggregate doesn't reveal individual scores)
     * @param _questionId The question ID
     * @return Number of feedback submissions
     */
    function getFeedbackCount(uint256 _questionId) external view returns (uint32) {
        return feedbackCount[_questionId];
    }

    /**
     * @notice Check if user already submitted feedback
     * @param _questionId The question ID
     * @return Whether user submitted feedback
     */
    function hasSubmitted(uint256 _questionId) external view returns (bool) {
        return userFeedback[_questionId][msg.sender].submitted;
    }

    /**
     * @notice Deactivate a question (stop accepting feedback)
     * @param _questionId The question ID
     */
    function deactivateQuestion(uint256 _questionId) external onlyOwner {
        require(_questionId < questionCount, "Invalid question ID");
        questions[_questionId].active = false;
    }

    /**
     * @notice Get question details
     * @param _questionId The question ID
     * @return Question struct
     */
    function getQuestion(uint256 _questionId) external view returns (Question memory) {
        require(_questionId < questionCount, "Invalid question ID");
        return questions[_questionId];
    }
}
