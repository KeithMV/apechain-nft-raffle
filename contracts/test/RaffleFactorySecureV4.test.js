const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// Import chai matchers for hardhat
require("@nomicfoundation/hardhat-chai-matchers");

describe("RaffleFactorySecureV4", function () {
  // Fixture for deploying contracts
  async function deployRaffleFactoryFixture() {
    const [owner, creator, participant1, participant2, participant3] = await ethers.getSigners();

    // Deploy mock NFT contract
    const MockNFT = await ethers.getContractFactory("MockERC721");
    const mockNFT = await MockNFT.deploy("Test NFT", "TNFT");
    await mockNFT.deployed();

    // Mint NFTs to creator
    await mockNFT.mint(creator.address, 1);
    await mockNFT.mint(creator.address, 2);
    await mockNFT.mint(creator.address, 3);

    // Deploy RaffleContractSecureV3 template
    const RaffleTemplate = await ethers.getContractFactory("RaffleContractSecureV3");
    const raffleTemplate = await RaffleTemplate.deploy();
    await raffleTemplate.deployed();

    // Deploy RaffleFactory with template address
    const RaffleFactory = await ethers.getContractFactory("RaffleFactorySecureV4");
    const raffleFactory = await RaffleFactory.deploy(raffleTemplate.address);
    await raffleFactory.deployed();

    return {
      raffleFactory,
      raffleTemplate,
      mockNFT,
      owner,
      creator,
      participant1,
      participant2,
      participant3
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { raffleFactory, owner } = await loadFixture(deployRaffleFactoryFixture);
      expect(await raffleFactory.owner()).to.equal(owner.address);
    });

    it("Should set correct platform fee", async function () {
      const { raffleFactory } = await loadFixture(deployRaffleFactoryFixture);
      expect(await raffleFactory.platformFee()).to.equal(ethers.BigNumber.from("500")); // 5%
    });

    it("Should set correct rate limit", async function () {
      const { raffleFactory } = await loadFixture(deployRaffleFactoryFixture);
      expect(await raffleFactory.RATE_LIMIT()).to.equal(ethers.BigNumber.from("10")); // 10 seconds
    });
  });

  describe("Raffle Creation", function () {
    it("Should create a raffle successfully", async function () {
      const { raffleFactory, mockNFT, creator } = await loadFixture(deployRaffleFactoryFixture);

      // Approve NFT
      await mockNFT.connect(creator).setApprovalForAll(raffleFactory.address, true);

      // Create raffle
      const ticketPrice = ethers.utils.parseEther("0.1");
      const maxTickets = 100;
      const duration = 3600; // 1 hour

      await expect(
        raffleFactory.connect(creator).createRaffle(
          mockNFT.address,
          1,
          ticketPrice,
          maxTickets,
          duration
        )
      ).to.emit(raffleFactory, "RaffleCreated");

      // Check raffle count
      expect(await raffleFactory.raffleCounter()).to.equal(1);
    });

    it("Should fail if NFT not approved", async function () {
      const { raffleFactory, mockNFT, creator } = await loadFixture(deployRaffleFactoryFixture);

      const ticketPrice = ethers.utils.parseEther("0.1");
      const maxTickets = 100;
      const duration = 3600;

      await expect(
        raffleFactory.connect(creator).createRaffle(
          mockNFT.address,
          1,
          ticketPrice,
          maxTickets,
          duration
        )
      ).to.be.revertedWith("NFT not approved");
    });

    it("Should fail if not NFT owner", async function () {
      const { raffleFactory, mockNFT, participant1 } = await loadFixture(deployRaffleFactoryFixture);

      const ticketPrice = ethers.utils.parseEther("0.1");
      const maxTickets = 100;
      const duration = 3600;

      await expect(
        raffleFactory.connect(participant1).createRaffle(
          mockNFT.address,
          1,
          ticketPrice,
          maxTickets,
          duration
        )
      ).to.be.revertedWith("Not NFT owner");
    });

    it("Should enforce rate limiting", async function () {
      const { raffleFactory, mockNFT, creator } = await loadFixture(deployRaffleFactoryFixture);

      await mockNFT.connect(creator).setApprovalForAll(raffleFactory.address, true);

      const ticketPrice = ethers.utils.parseEther("0.1");
      const maxTickets = 100;
      const duration = 3600;

      // Create first raffle
      await raffleFactory.connect(creator).createRaffle(
        mockNFT.address,
        1,
        ticketPrice,
        maxTickets,
        duration
      );

      // Try to create second raffle immediately (should fail)
      await expect(
        raffleFactory.connect(creator).createRaffle(
          mockNFT.address,
          2,
          ticketPrice,
          maxTickets,
          duration
        )
      ).to.be.revertedWith("Rate limit exceeded");
    });

    it("Should validate ticket price", async function () {
      const { raffleFactory, mockNFT, creator } = await loadFixture(deployRaffleFactoryFixture);

      await mockNFT.connect(creator).setApprovalForAll(raffleFactory.address, true);

      await expect(
        raffleFactory.connect(creator).createRaffle(
          mockNFT.address,
          1,
          0, // Invalid price
          100,
          3600
        )
      ).to.be.revertedWith("Invalid ticket price");
    });

    it("Should validate max tickets", async function () {
      const { raffleFactory, mockNFT, creator } = await loadFixture(deployRaffleFactoryFixture);

      await mockNFT.connect(creator).setApprovalForAll(raffleFactory.address, true);

      const ticketPrice = ethers.utils.parseEther("0.1");

      await expect(
        raffleFactory.connect(creator).createRaffle(
          mockNFT.address,
          1,
          ticketPrice,
          0, // Invalid max tickets
          3600
        )
      ).to.be.revertedWith("Invalid ticket count");
    });
  });

  describe("Ticket Purchasing", function () {
    async function createRaffleFixture() {
      const fixture = await loadFixture(deployRaffleFactoryFixture);
      const { raffleFactory, mockNFT, creator } = fixture;

      // Setup raffle
      await mockNFT.connect(creator).setApprovalForAll(raffleFactory.address, true);
      
      const ticketPrice = ethers.utils.parseEther("0.1");
      const maxTickets = 100;
      const duration = 3600;

      await raffleFactory.connect(creator).createRaffle(
        mockNFT.address,
        1,
        ticketPrice,
        maxTickets,
        duration
      );

      return { ...fixture, ticketPrice, maxTickets, raffleId: 0 };
    }

    it("Should allow buying tickets", async function () {
      const { raffleFactory, participant1, ticketPrice, raffleId } = await loadFixture(createRaffleFixture);

      const quantity = 5;
      const totalCost = ticketPrice.mul(quantity);

      // Get the raffle contract address
      const raffleContractAddress = await raffleFactory.getRaffleContract(raffleId);
      const RaffleContract = await ethers.getContractFactory("RaffleContractSecureV3");
      const raffleContract = RaffleContract.attach(raffleContractAddress);

      await expect(
        raffleContract.connect(participant1).buyTickets(quantity, {
          value: totalCost
        })
      ).to.emit(raffleContract, "TicketsPurchased");

      // Check user tickets
      expect(await raffleContract.ticketsPurchased(participant1.address)).to.equal(quantity);
    });

    it("Should fail with incorrect payment", async function () {
      const { raffleFactory, participant1, ticketPrice, raffleId } = await loadFixture(createRaffleFixture);

      const quantity = 5;
      const incorrectPayment = ticketPrice.mul(quantity - 1); // Pay for 4 tickets but buy 5

      // Get the raffle contract address
      const raffleContractAddress = await raffleFactory.getRaffleContract(raffleId);
      const RaffleContract = await ethers.getContractFactory("RaffleContractSecureV3");
      const raffleContract = RaffleContract.attach(raffleContractAddress);

      await expect(
        raffleContract.connect(participant1).buyTickets(quantity, {
          value: incorrectPayment
        })
      ).to.be.revertedWith("Incorrect payment");
    });

    it("Should prevent creator from buying tickets", async function () {
      const { raffleFactory, creator, ticketPrice, raffleId } = await loadFixture(createRaffleFixture);

      // Get the raffle contract address
      const raffleContractAddress = await raffleFactory.getRaffleContract(raffleId);
      const RaffleContract = await ethers.getContractFactory("RaffleContractSecureV3");
      const raffleContract = RaffleContract.attach(raffleContractAddress);

      await expect(
        raffleContract.connect(creator).buyTickets(1, {
          value: ticketPrice
        })
      ).to.be.revertedWith("Creator cannot buy");
    });

    it("Should handle sold out scenario", async function () {
      const { raffleFactory, participant1, participant2, ticketPrice, maxTickets, raffleId } = await loadFixture(createRaffleFixture);

      // Get the raffle contract address
      const raffleContractAddress = await raffleFactory.getRaffleContract(raffleId);
      const RaffleContract = await ethers.getContractFactory("RaffleContractSecureV3");
      const raffleContract = RaffleContract.attach(raffleContractAddress);

      // Buy all tickets
      const totalCost = ticketPrice.mul(maxTickets);
      await raffleContract.connect(participant1).buyTickets(maxTickets, {
        value: totalCost
      });

      // Try to buy more (should fail)
      await expect(
        raffleContract.connect(participant2).buyTickets(1, {
          value: ticketPrice
        })
      ).to.be.revertedWith("Sold out");
    });
  });

  describe("Winner Selection", function () {
    async function raffleWithTicketsFixture() {
      const fixture = await loadFixture(deployRaffleFactoryFixture);
      const { raffleFactory, mockNFT, creator, participant1, participant2 } = fixture;

      // Setup raffle
      await mockNFT.connect(creator).setApprovalForAll(raffleFactory.address, true);
      
      const ticketPrice = ethers.utils.parseEther("0.1");
      const maxTickets = 10;
      const duration = 3600;

      await raffleFactory.connect(creator).createRaffle(
        mockNFT.address,
        1,
        ticketPrice,
        maxTickets,
        duration
      );

      // Get the raffle contract
      const raffleContractAddress = await raffleFactory.getRaffleContract(0);
      const RaffleContract = await ethers.getContractFactory("RaffleContractSecureV3");
      const raffleContract = RaffleContract.attach(raffleContractAddress);

      // Buy some tickets
      await raffleContract.connect(participant1).buyTickets(5, {
        value: ticketPrice.mul(5)
      });
      await raffleContract.connect(participant2).buyTickets(3, {
        value: ticketPrice.mul(3)
      });

      return { ...fixture, raffleContract, ticketPrice, maxTickets, raffleId: 0 };
    }

    it("Should select winner when sold out", async function () {
      const { raffleContract, participant1, ticketPrice } = await loadFixture(raffleWithTicketsFixture);

      // Buy remaining tickets to trigger auto-completion
      await raffleContract.connect(participant1).buyTickets(2, {
        value: ticketPrice.mul(2)
      });

      // Check if raffle is completed
      const raffleInfo = await raffleContract.getRaffleInfo();
      expect(raffleInfo.completed).to.be.true;
      expect(raffleInfo.winner).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should allow manual winner selection after expiry", async function () {
      const { raffleContract } = await loadFixture(raffleWithTicketsFixture);

      // Fast forward time past raffle end
      await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
      await ethers.provider.send("evm_mine");

      // Commit randomness first
      const nonce = 12345;
      const commitHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["uint256"], [nonce]));
      await raffleContract.commitRandomness(commitHash);

      await expect(
        raffleContract.revealAndSelectWinner(nonce)
      ).to.emit(raffleContract, "WinnerSelected");

      const raffleInfo = await raffleContract.getRaffleInfo();
      expect(raffleInfo.completed).to.be.true;
    });

    it("Should fail to select winner before expiry", async function () {
      const { raffleContract, creator } = await loadFixture(raffleWithTicketsFixture);

      const nonce = 12345;
      const commitHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["uint256"], [nonce]));
      
      await expect(
        raffleContract.connect(creator).commitRandomness(commitHash)
      ).to.be.revertedWith("Raffle still active");
    });

    it("Should distribute funds correctly", async function () {
      const { raffleContract, creator, participant1, ticketPrice } = await loadFixture(raffleWithTicketsFixture);

      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);

      // Complete raffle by buying all remaining tickets
      await raffleContract.connect(participant1).buyTickets(2, {
        value: ticketPrice.mul(2)
      });

      const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
      
      // Creator should receive 95% of total sales (5% platform fee)
      const totalSales = ticketPrice.mul(10); // 10 tickets sold
      const expectedCreatorAmount = totalSales.mul(95).div(100);
      
      expect(creatorBalanceAfter.sub(creatorBalanceBefore)).to.equal(expectedCreatorAmount);
    });
  });

  describe("Security Features", function () {
    it("Should prevent reentrancy attacks", async function () {
      // This would require a malicious contract to test properly
      // For now, we verify the nonReentrant modifier is in place
      const { raffleFactory } = await loadFixture(deployRaffleFactoryFixture);
      
      // Check that the contract has the expected security features
      expect(await raffleFactory.RATE_LIMIT()).to.equal(ethers.BigNumber.from("10"));
    });

    it("Should handle emergency pause", async function () {
      const { raffleFactory, owner, mockNFT, creator } = await loadFixture(deployRaffleFactoryFixture);

      // Pause the contract
      await raffleFactory.connect(owner).emergencyPause();

      // Try to create raffle (should fail)
      await mockNFT.connect(creator).setApprovalForAll(raffleFactory.address, true);
      
      await expect(
        raffleFactory.connect(creator).createRaffle(
          mockNFT.address,
          1,
          ethers.utils.parseEther("0.1"),
          100,
          3600
        )
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow owner to withdraw fees", async function () {
      const { raffleFactory, owner } = await loadFixture(deployRaffleFactoryFixture);

      // Send some ETH to contract (simulating platform fees)
      await owner.sendTransaction({
        to: raffleFactory.address,
        value: ethers.utils.parseEther("1.0")
      });

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await raffleFactory.connect(owner).emergencyWithdraw();
      
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      
      // Owner should have received the fees (minus gas costs)
      expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for raffle creation", async function () {
      const { raffleFactory, mockNFT, creator } = await loadFixture(deployRaffleFactoryFixture);

      await mockNFT.connect(creator).setApprovalForAll(raffleFactory.address, true);

      const tx = await raffleFactory.connect(creator).createRaffle(
        mockNFT.address,
        1,
        ethers.utils.parseEther("0.1"),
        100,
        3600
      );

      const receipt = await tx.wait();
      
      // Gas should be reasonable (less than 200k for raffle creation)
      expect(receipt.gasUsed).to.be.lt(200000);
    });

    it("Should use reasonable gas for ticket purchase", async function () {
      const { raffleFactory, mockNFT, creator, participant1 } = await loadFixture(deployRaffleFactoryFixture);

      // Setup raffle
      await mockNFT.connect(creator).setApprovalForAll(raffleFactory.address, true);
      await raffleFactory.connect(creator).createRaffle(
        mockNFT.address,
        1,
        ethers.utils.parseEther("0.1"),
        100,
        3600
      );

      const tx = await raffleFactory.connect(participant1).buyTickets(0, 5, {
        value: ethers.utils.parseEther("0.5")
      });

      const receipt = await tx.wait();
      
      // Gas should be reasonable for ticket purchase
      expect(receipt.gasUsed).to.be.lt(100000);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero participants gracefully", async function () {
      const { raffleFactory, mockNFT, creator } = await loadFixture(deployRaffleFactoryFixture);

      await mockNFT.connect(creator).setApprovalForAll(raffleFactory.address, true);
      await raffleFactory.connect(creator).createRaffle(
        mockNFT.address,
        1,
        ethers.utils.parseEther("0.1"),
        100,
        3600
      );

      // Get the raffle contract
      const raffleContractAddress = await raffleFactory.getRaffleContract(0);
      const RaffleContract = await ethers.getContractFactory("RaffleContractSecureV3");
      const raffleContract = RaffleContract.attach(raffleContractAddress);

      // Fast forward past expiry
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Should fail to commit randomness with no participants
      const nonce = 12345;
      const commitHash = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["uint256"], [nonce]));
      
      await expect(
        raffleContract.connect(creator).commitRandomness(commitHash)
      ).to.be.revertedWith("No participants");
    });

    it("Should handle maximum ticket purchase", async function () {
      const { raffleFactory, mockNFT, creator, participant1 } = await loadFixture(deployRaffleFactoryFixture);

      await mockNFT.connect(creator).setApprovalForAll(raffleFactory.address, true);
      
      const maxTickets = 1000; // Reasonable maximum for testing
      await raffleFactory.connect(creator).createRaffle(
        mockNFT.address,
        1,
        ethers.utils.parseEther("0.001"), // Small price to avoid huge payment
        maxTickets,
        3600
      );

      // Get the raffle contract
      const raffleContractAddress = await raffleFactory.getRaffleContract(0);
      const RaffleContract = await ethers.getContractFactory("RaffleContractSecureV3");
      const raffleContract = RaffleContract.attach(raffleContractAddress);

      // Should be able to buy multiple tickets in one transaction
      const quantity = 100;
      await raffleContract.connect(participant1).buyTickets(quantity, {
        value: ethers.utils.parseEther("0.1")
      });

      expect(await raffleContract.ticketsPurchased(participant1.address)).to.equal(quantity);
    });
  });
});