export const ARTIST = 'https://x.com/BB88888888888BB'

export const collections = [
  {
    id: 'little-worlds',
    order: '01',
    name: 'Little Worlds',
    shortName: 'Little Worlds',
    chain: 'Ethereum',
    chainId: 'ethereum',
    contract: '0x3dfeb685ec0857f9595197044412a2f4ba636fe0',
    slug: 'littleworlds',
    url: 'https://opensea.io/collection/littleworlds',
    status: 'Revealed',
    description: 'The original collection: small places to pause, look closer and make up the rest.',
    accent: 'blue',
  },
  {
    id: 'robin-hood',
    order: '02',
    name: 'Robin and Hood',
    shortName: 'Robin + Hood',
    chain: 'Robinhood Chain',
    chainId: 'robinhood',
    contract: '0x0bf61b80d1cca142ccf251b8f069bdba8c2c01a5',
    slug: 'littleworlds-robinandhood',
    url: 'https://opensea.io/collection/littleworlds-robinandhood?status=all',
    status: 'Pre-reveal',
    description: 'A collectible world of quiet imagination and impossible friendships.',
    accent: 'green',
  },
  {
    id: 'robin',
    order: '03',
    name: 'Robin',
    shortName: 'Robin',
    chain: 'Ethereum',
    chainId: 'ethereum',
    contract: '0x8164989a0aacbac31f26bb4bcd13e8a02f45b560',
    slug: 'little-worlds-robin',
    url: 'https://opensea.io/collection/little-worlds-robin',
    status: 'Pre-reveal',
    description: 'Hand-drawn wax-crayon moments following Robin through the everyday and impossible.',
    accent: 'red',
  },
]

export const futureForms = [
  'Books',
  'Clothing',
  'Art toys',
  'Exhibitions',
  'Online play',
  'Designer collectibles',
  'Collaborations',
  'Licensing',
]

export const explorerFor = (collection) => collection.chainId === 'ethereum'
  ? `https://etherscan.io/address/${collection.contract}`
  : `https://robinhoodchain.blockscout.com/address/${collection.contract}`
