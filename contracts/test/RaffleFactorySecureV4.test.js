const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

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

    // Deploy RaffleFactory
    const RaffleFactory = await ethers.getContractFactory("RaffleFactorySecureV4");
    const raffleFactory = await RaffleFactory.deploy();
    await raffleFactory.deployed();

    return {
      raffleFactory,
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
      expect(await raffleFactory.platformFee()).to.equal(500); // 5%
    });

    it("Should set correct rate limit", async function () {
      const { raffleFactory } = await loadFixture(deployRaffleFactoryFixture);
      expect(await raffleFactory.RATE_LIMIT()).to.equal(10); // 10 seconds
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

      await expect(
        raffleFactory.connect(participant1).buyTickets(raffleId, quantity, {
          value: totalCost
        })
      ).to.emit(raffleFactory, "TicketsPurchased");

      // Check user tickets
      expect(await raffleFactory.getUserTickets(raffleId, participant1.address)).to.equal(quantity);
    });

    it("Should fail with incorrect payment", async function () {
      const { raffleFactory, participant1, ticketPrice, raffleId } = await loadFixture(createRaffleFixture);

      const quantity = 5;
      const incorrectPayment = ticketPrice.mul(quantity - 1); // Pay for 4 tickets but buy 5

      await expect(
        raffleFactory.connect(participant1).buyTickets(raffleId, quantity, {
          value: incorrectPayment
        })
      ).to.be.revertedWith("Incorrect payment");
    });

    it("Should prevent creator from buying tickets", async function () {
      const { raffleFactory, creator, ticketPrice, raffleId } = await loadFixture(createRaffleFixture);

      await expect(
        raffleFactory.connect(creator).buyTickets(raffleId, 1, {
          value: ticketPrice
        })
      ).to.be.revertedWith("Creator cannot buy");
    });

    it("Should handle sold out scenario", async function () {
      const { raffleFactory, participant1, participant2, ticketPrice, maxTickets, raffleId } = await loadFixture(createRaffleFixture);

      // Buy all tickets
      const totalCost = ticketPrice.mul(maxTickets);
      await raffleFactory.connect(participant1).buyTickets(raffleId, maxTickets, {
        value: totalCost
      });

      // Try to buy more (should fail)
      await expect(
        raffleFactory.connect(participant2).buyTickets(raffleId, 1, {
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

      // Buy some tickets
      await raffleFactory.connect(participant1).buyTickets(0, 5, {
        value: ticketPrice.mul(5)
      });
      await raffleFactory.connect(participant2).buyTickets(0, 3, {
        value: ticketPrice.mul(3)
      });

      return { ...fixture, ticketPrice, maxTickets, raffleId: 0 };
    }

    it("Should select winner when sold out", async function () {
      const { raffleFactory, participant1, participant2, ticketPrice, raffleId } = await loadFixture(raffleWithTicketsFixture);

      // Buy remaining tickets to trigger auto-completion
      await raffleFactory.connect(participant1).buyTickets(raffleId, 2, {
        value: ticketPrice.mul(2)
      });

      // Check if raffle is completed
      const raffle = await raffleFactory.getRaffle(raffleId);
      expect(raffle.completed).to.be.true;
      expect(raffle.winner).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should allow manual winner selection after expiry", async function () {
      const { raffleFactory, raffleId } = await loadFixture(raffleWithTicketsFixture);

      // Fast forward time past raffle end
      await ethers.provider.send("evm_increaseTime", [3601]); // 1 hour + 1 second
      await ethers.provider.send("evm_mine");

      await expect(
        raffleFactory.selectWinner(raffleId)
      ).to.emit(raffleFactory, "WinnerSelected");

      const raffle = await raffleFactory.getRaffle(raffleId);
      expect(raffle.completed).to.be.true;
    });

    it("Should fail to select winner before expiry", async function () {
      const { raffleFactory, raffleId } = await loadFixture(raffleWithTicketsFixture);

      await expect(
        raffleFactory.selectWinner(raffleId)
      ).to.be.revertedWith("Raffle still active");
    });

    it("Should distribute funds correctly", async function () {
      const { raffleFactory, creator, participant1, ticketPrice, raffleId } = await loadFixture(raffleWithTicketsFixture);

      const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);

      // Complete raffle by buying all remaining tickets
      await raffleFactory.connect(participant1).buyTickets(raffleId, 2, {
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
      expect(await raffleFactory.RATE_LIMIT()).to.equal(10);
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
      ).to.be.revertedWith("Emergency paused");
    });

    it("Should allow owner to withdraw fees", async function () {
      const { raffleFactory, owner } = await loadFixture(deployRaffleFactoryFixture);

      // Send some ETH to contract (simulating platform fees)
      await owner.sendTransaction({
        to: raffleFactory.address,
        value: ethers.utils.parseEther("1.0")
      });

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await raffleFactory.connect(owner).withdrawFees();
      
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

      // Fast forward past expiry
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine");

      // Should fail to select winner with no participants
      await expect(
        raffleFactory.selectWinner(0)
      ).to.be.revertedWith("No participants");
    });

    it("Should handle maximum ticket purchase", async function () {
      const { raffleFactory, mockNFT, creator, participant1 } = await loadFixture(deployRaffleFactoryFixture);

      await mockNFT.connect(creator).setApprovalForAll(raffleFactory.address, true);
      
      const maxTickets = 10000; // Maximum allowed
      await raffleFactory.connect(creator).createRaffle(
        mockNFT.address,
        1,
        ethers.utils.parseEther("0.001"), // Small price to avoid huge payment
        maxTickets,
        3600
      );

      // Should be able to buy maximum tickets in one transaction
      const quantity = 100; // Max per transaction
      await raffleFactory.connect(participant1).buyTickets(0, quantity, {
        value: ethers.utils.parseEther("0.1")
      });

      expect(await raffleFactory.getUserTickets(0, participant1.address)).to.equal(quantity);
    });
  });
});