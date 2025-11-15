import { RaffleCreated as RaffleCreatedEvent } from "../generated/RaffleFactory/RaffleFactory"
import { RaffleCreated } from "../generated/schema"

export function handleRaffleCreated(event: RaffleCreatedEvent): void {
  let entity = new RaffleCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  
  entity.raffleId = event.params.raffleId
  entity.creator = event.params.creator
  entity.nftContract = event.params.nftContract
  entity.tokenId = event.params.tokenId
  entity.raffleContract = event.params.raffleContract
  entity.ticketPrice = event.params.ticketPrice
  entity.maxTickets = event.params.maxTickets
  
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
}