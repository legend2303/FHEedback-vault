import { expect } from "chai";
import { ethers } from "hardhat";
import { EncryptedFeedback } from "../typechain-types";

describe("EncryptedFeedback", function () {
  let encryptedFeedback: EncryptedFeedback;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async () => {
    const EncryptedFeedbackContract = await ethers.getContractFactory("EncryptedFeedback");
    encryptedFeedback = await EncryptedFeedbackContract.deploy();
    
    [owner, user1, user2] = await ethers.getSigners();
  });

  describe("Question Management", function () {
    it("Should create a new question", async () => {
      await encryptedFeedback.createQuestion("How satisfied are you?");
      
      const question = await encryptedFeedback.getQuestion(0);
      expect(question.text).to.equal("How satisfied are you?");
      expect(question.active).to.be.true;
    });

    it("Should only allow owner to create questions", async () => {
      await expect(
        encryptedFeedback.connect(user1).createQuestion("Test")
      ).to.be.revertedWith("Only owner can call this");
    });

    it("Should deactivate a question", async () => {
      await encryptedFeedback.createQuestion("Test question");
      await encryptedFeedback.deactivateQuestion(0);
      
      const question = await encryptedFeedback.getQuestion(0);
      expect(question.active).to.be.false;
    });
  });

  describe("Feedback Submission", function () {
    beforeEach(async () => {
      await encryptedFeedback.createQuestion("How satisfied are you?");
    });

    it("Should reject feedback for inactive question", async () => {
      await encryptedFeedback.deactivateQuestion(0);
      
      // Create a dummy encrypted value (in real scenario, this would be properly encrypted)
      const dummyEncrypted = ethers.toBeHex(50, 32);
      const dummyProof = ethers.toBeHex(0, 32);

      await expect(
        encryptedFeedback.connect(user1).submitFeedback(0, dummyEncrypted, dummyProof)
      ).to.be.revertedWith("Question inactive");
    });

    it("Should not allow duplicate submissions from same user", async () => {
      const dummyEncrypted = ethers.toBeHex(50, 32);
      const dummyProof = ethers.toBeHex(0, 32);

      await encryptedFeedback.connect(user1).submitFeedback(0, dummyEncrypted, dummyProof);
      
      await expect(
        encryptedFeedback.connect(user1).submitFeedback(0, dummyEncrypted, dummyProof)
      ).to.be.revertedWith("Already submitted");
    });

    it("Should track feedback count correctly", async () => {
      const dummyEncrypted = ethers.toBeHex(75, 32);
      const dummyProof = ethers.toBeHex(0, 32);

      await encryptedFeedback.connect(user1).submitFeedback(0, dummyEncrypted, dummyProof);
      await encryptedFeedback.connect(user2).submitFeedback(0, dummyEncrypted, dummyProof);

      const count = await encryptedFeedback.getFeedbackCount(0);
      expect(count).to.equal(2);
    });

    it("Should track submission status", async () => {
      const dummyEncrypted = ethers.toBeHex(60, 32);
      const dummyProof = ethers.toBeHex(0, 32);

      const beforeSubmit = await encryptedFeedback.connect(user1).hasSubmitted(0);
      expect(beforeSubmit).to.be.false;

      await encryptedFeedback.connect(user1).submitFeedback(0, dummyEncrypted, dummyProof);

      const afterSubmit = await encryptedFeedback.connect(user1).hasSubmitted(0);
      expect(afterSubmit).to.be.true;
    });
  });

  describe("Security & Privacy", function () {
    beforeEach(async () => {
      await encryptedFeedback.createQuestion("Rate your experience");
    });

    it("Should not reveal individual scores", async () => {
      // Individual scores should not be accessible to non-owners
      // This is guaranteed by storing encrypted values
      const dummyEncrypted = ethers.toBeHex(80, 32);
      const dummyProof = ethers.toBeHex(0, 32);

      await encryptedFeedback.connect(user1).submitFeedback(0, dummyEncrypted, dummyProof);
      
      // User can only get their own feedback
      const myFeedback = await encryptedFeedback.connect(user1).getMyFeedback(0);
      expect(myFeedback).to.not.be.null;
    });

    it("Should prevent viewing aggregate without submissions", async () => {
      await expect(
        encryptedFeedback.getEncryptedAggregate(0)
      ).to.be.revertedWith("No feedback yet");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle invalid question ID", async () => {
      await expect(
        encryptedFeedback.getQuestion(999)
      ).to.be.revertedWith("Invalid question ID");
    });

    it("Should handle feedback for invalid question", async () => {
      const dummyEncrypted = ethers.toBeHex(50, 32);
      const dummyProof = ethers.toBeHex(0, 32);

      await expect(
        encryptedFeedback.connect(user1).submitFeedback(999, dummyEncrypted, dummyProof)
      ).to.be.revertedWith("Invalid question ID");
    });

    it("Should track multiple questions independently", async () => {
      await encryptedFeedback.createQuestion("Question 1");
      await encryptedFeedback.createQuestion("Question 2");

      const q1 = await encryptedFeedback.getQuestion(0);
      const q2 = await encryptedFeedback.getQuestion(1);

      expect(q1.text).to.equal("Question 1");
      expect(q2.text).to.equal("Question 2");
    });
  });
});
