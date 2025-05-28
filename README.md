# UserInfo DApp - Decentralized User Profile Management

A decentralized application (DApp) built with Next.js and React that allows users to store and manage their profile information on the Ethereum blockchain using a smart contract.

Visit: [Here](https://user-profile-d-app.vercel.app/)

## 🌟 Features

- **Wallet Integration**: Connect with MetaMask and other Web3 wallets
- **Profile Management**: Add, update, and view user profile information
- **Decentralized Storage**: All data stored permanently on the blockchain
- **Profile Search**: Look up other users' profiles by their Ethereum address
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Automatic data refresh after transactions
- **Error Handling**: Comprehensive error messages and user feedback
- **Input Validation**: Client-side validation and sanitization

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Smart Contract Details](#smart-contract-details)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **MetaMask** browser extension or another Web3 wallet
- **Git** for version control

### Blockchain Requirements

- Access to an Ethereum network (Mainnet, Sepolia, or local testnet)
- ETH for gas fees
- A deployed UserInfo smart contract

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/userinfo-dapp.git
cd userinfo-dapp
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address_here
NEXT_PUBLIC_NETWORK_NAME=sepolia
```

## 📜 Smart Contract Deployment

### 1. Smart Contract Code

The UserInfo smart contract should be deployed first. Here's the contract code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract UserInfo {
    
    struct User{
        string name;
        uint256 age;
        string profession;
        string bio;
    }

    mapping (address => User) private users;

    event userInfoAdded(address indexed user);

    function addUserInfo(string memory _name, uint256 _age, string memory _profession, string memory _bio) public {
        users[msg.sender] = User(_name, _age, _profession, _bio);
        emit userInfoAdded(msg.sender);
    }

    function getUserInfo(address userAddress) public view returns(string memory, uint256, string memory, string memory) {
        User memory u = users[userAddress];
        return (u.name, u.age, u.profession, u.bio);
    } 
}
```

### 2. Deployment Options

#### Option A: Using Remix IDE

1. Go to [Remix IDE](https://remix.ethereum.org/)
2. Create a new file \`UserInfo.sol\`
3. Paste the contract code
4. Compile the contract
5. Deploy to your chosen network
6. Copy the deployed contract address

#### Option B: Using Hardhat

1. Install Hardhat:
```bash
npm install --save-dev hardhat
npx hardhat init
```

2. Create deployment script:
```javascript
// scripts/deploy.js
async function main() {
  const UserInfo = await ethers.getContractFactory("UserInfo");
  const userInfo = await UserInfo.deploy();
  await userInfo.deployed();
  console.log("UserInfo deployed to:", userInfo.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

3. Deploy:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

#### Option C: Using Foundry

1. Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Deploy:
```bash
forge create --rpc-url https://sepolia.infura.io/v3/YOUR_INFURA_KEY \\
  --private-key YOUR_PRIVATE_KEY \\
  src/UserInfo.sol:UserInfo
```

## ⚙️ Configuration

### 1. Update Contract Address

In `app/page.tsx`, update the contract address:

```typescript
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS"
```

### 2. Network Configuration

The DApp works with any Ethereum-compatible network. Common networks:

- **Ethereum Mainnet**: Chain ID 1
- **Sepolia Testnet**: Chain ID 11155111
- **Polygon**: Chain ID 137
- **Local Network**: Chain ID 1337

### 3. MetaMask Setup

1. Install MetaMask browser extension
2. Create or import a wallet
3. Add the network you're using (if not already added)
4. Get test ETH from a faucet (for testnets)

## 🎯 Usage

### 1. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Connect Your Wallet

1. Click "Connect Wallet" button
2. Approve the connection in MetaMask
3. Ensure you're on the correct network

### 3. Add Your Profile

1. Fill out the profile form:
   - **Name**: Your display name
   - **Age**: Your age (1-150)
   - **Profession**: Your job or profession
   - **Bio**: A short description about yourself

2. Click "Add User Info"
3. Confirm the transaction in MetaMask
4. Wait for transaction confirmation

### 4. View Profiles

- **Your Profile**: Automatically displayed after adding information
- **Search Others**: Enter any Ethereum address to view their profile

### 5. Update Profile

- Fill out the form again with new information
- Submit to update your existing profile

## 📁 Project Structure

```
userinfo-dapp/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout component
│   ├── loading.tsx          # Loading component
│   └── page.tsx             # Main DApp component
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── theme-provider.tsx   # Theme provider
├── lib/
│   └── utils.ts             # Utility functions
├── public/                  # Static assets
├── .env.local              # Environment variables
├── package.json            # Dependencies
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## 🔗 Smart Contract Details

### Contract Functions

#### `addUserInfo(string _name, uint256 _age, string _profession, string _bio)`
- **Purpose**: Add or update user profile information
- **Access**: Public (only updates caller's profile)
- **Gas**: ~50,000-80,000 gas units
- **Events**: Emits \`userInfoAdded\` event

#### \`getUserInfo(address userAddress)\`
- **Purpose**: Retrieve user profile information
- **Access**: Public view function (read-only)
- **Returns**: (name, age, profession, bio)
- **Gas**: ~3,000 gas units

### Data Structure

```solidity
struct User {
    string name;        // User's display name
    uint256 age;        // User's age
    string profession;  // User's profession
    string bio;         // User's biography
}
```

### Events

```solidity
event userInfoAdded(address indexed user);
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Failed to connect wallet"
- **Solution**: Ensure MetaMask is installed and unlocked
- Check if you're on the correct network
- Try refreshing the page

#### 2. "Invalid ENS name" Error
- **Solution**: This usually indicates invisible characters in input
- Clear the form and re-enter data manually
- Avoid copy-pasting from external sources

#### 3. "Transaction failed"
- **Solution**: Check if you have enough ETH for gas fees
- Verify the contract address is correct
- Ensure you're on the right network

#### 4. "No profile found"
- **Solution**: The address hasn't added profile information yet
- Verify the address is correct
- Check if the contract is deployed on the current network

#### 5. Gas Estimation Failed
- **Solution**: Increase gas limit manually in MetaMask
- Check if contract functions are working properly
- Verify input data is valid

### Network Issues

#### Switching Networks
If you need to switch networks:

1. Open MetaMask
2. Click the network dropdown
3. Select the correct network
4. Refresh the DApp

#### Adding Custom Networks
For custom networks, add them to MetaMask:

1. MetaMask → Settings → Networks → Add Network
2. Enter network details (RPC URL, Chain ID, etc.)
3. Save and switch to the new network

### Development Issues

#### Hot Reload Not Working
```bash
rm -rf .next
npm run dev
```

#### TypeScript Errors
```bash
npm run build
```

#### Dependency Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🔒 Security Considerations

### Smart Contract Security
- The contract only allows users to modify their own profiles
- All data is publicly readable on the blockchain
- No admin functions or upgrade mechanisms

### Frontend Security
- Input validation and sanitization implemented
- No private keys stored in the application
- All transactions require user approval

### Privacy Notes
- All profile data is stored publicly on the blockchain
- Anyone can read your profile information
- Consider this before adding sensitive information

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The DApp can be deployed to any static hosting service:
- Netlify
- GitHub Pages
- AWS S3
- IPFS

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful commit messages
- Add comments for complex logic
- Test thoroughly before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [ethers.js](https://ethers.org/) - Ethereum library
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide React](https://lucide.dev/) - Icons

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/NeelBareja/User-Profile-dAPP/issues)
3. Create a new issue with detailed information

## 🗺️ Roadmap

- [ ] Profile image upload to IPFS
- [ ] Social media links integration
- [ ] Profile verification system
- [ ] Advanced search and filtering
- [ ] Profile analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app development

---

**Happy Building! 🚀**
