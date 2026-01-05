# FHEedback Vault

An FHE-encrypted, owner-curated on-chain feedback dApp built on the
Zama FHEVM Hardhat stack.

## 🚀 Live Demo

- Website: https://fheedback-vault.netlify.app

Tip: Ensure MetaMask is connected to Sepolia to interact.

## Quick Start

For detailed instructions see:
[FHEVM Hardhat Quick Start Tutorial](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile and test**

   ```bash
   npm run compile
   npm run test
   ```

4. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npx hardhat node
   # Deploy to local network
   npx hardhat deploy --network localhost
   ```

5. **Deploy to Sepolia Testnet**

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

6. **Test on Sepolia Testnet**

   ```bash
   # Once deployed, you can run a simple test on Sepolia.
   npx hardhat test --network sepolia
   ```

## 📁 Project Structure

```
fhevm-hardhat-template/
├── contracts/            # Smart contract source files
│   ├── EncryptedFeedback.sol   # FHE-encrypted feedback collection
│   └── PrivateNotes.sol        # Encrypted note storage pattern
├── deploy/               # Deployment scripts
├── tasks/                # Hardhat custom tasks
├── test/                 # Test files
├── hardhat.config.ts     # Hardhat configuration
└── package.json          # Dependencies and scripts
```

## 🔐 FHE Design Rationale

This dApp uses **Zama FHEVM** to encrypt user feedback on-chain:

- **Individual scores are never revealed in plaintext** — they remain encrypted in contract storage
- **Only the submitting user can decrypt their own feedback** via EIP-712 signed re-encryption keys through the Zama Relayer SDK
- **Question creators can deactivate surveys** without ever accessing raw scores
- **Privacy-preserving feedback collection** — perfect for sensitive surveys, research, and anonymous polling

The encrypted approach ensures feedback integrity while maintaining user privacy at the protocol level.

## 📜 Available Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run compile`  | Compile all contracts    |
| `npm run test`     | Run all tests            |
| `npm run coverage` | Generate coverage report |
| `npm run lint`     | Run linting checks       |
| `npm run clean`    | Clean build artifacts    |

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **FHEVM Issues**: [Zama FHEVM GitHub](https://github.com/zama-ai/fhevm/issues)
- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

## 👤 Author

**legend2303**

Built using [Zama FHEVM](https://docs.zama.ai/fhevm) - Fully Homomorphic Encryption on Ethereum

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

To build for production:

```bash
npm run build
```
Changes going to added are :
1. Analytics Button 
2. Expandable Analytics Panel
3. Decrypt Results Button
4. Decrypted Results Show:
