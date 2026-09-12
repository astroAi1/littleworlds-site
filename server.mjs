import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const root = join(projectRoot, 'dist')
const port = Number(process.env.PORT || 4173)
const isDevelopment = process.env.NODE_ENV === 'development'
const sources = [
  { slug: 'littleworlds', name: 'Little Worlds' },
  { slug: 'littleworlds-robinandhood', name: 'Robin and Hood' },
  { slug: 'little-worlds-robin', name: 'Robin' },
]
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const mediaHosts = new Set(['i2c.seadn.io', 'raw2.seadn.io', 'ipfs2.seadn.io'])
const mediaCache = new Map()
let activityCache = { events: [], fetchedAt: null, expiresAt: 0 }
let activityRequest = null
let collectionsCache = { collections: [], fetchedAt: null, expiresAt: 0 }
let collectionsRequest = null
let apiKey

async function getApiKey() {
  if (apiKey) return apiKey
  if (process.env.OPENSEA_API_KEY) {
    apiKey = process.env.OPENSEA_API_KEY
    return apiKey
  }
  try {
    const stored = JSON.parse(await readFile(join(projectRoot, '.opensea-key.json'), 'utf8'))
    if (stored.api_key && (!stored.expires_at || new Date(stored.expires_at) > new Date())) {
      apiKey = stored.api_key
      return apiKey
    }
  } catch {
    // The API response explains how to configure a key.
  }
  throw new Error('OpenSea API key missing. Set OPENSEA_API_KEY or add .opensea-key.json.')
}

async function openSea(path) {
  const response = await fetch(`https://api.opensea.io/api/v2${path}`, {
    headers: { 'x-api-key': await getApiKey(), accept: 'application/json', 'user-agent': 'LittleWorlds/1.0' },
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after')
    throw new Error(`OpenSea ${response.status}${retryAfter ? `; retry after ${retryAfter}s` : ''}`)
  }
  return response.json()
}

function mediaUrl(image) {
  return image ? `/api/media?src=${encodeURIComponent(image)}` : null
}

function normalizeNft(nft, source) {
  const image = nft.display_image_url || nft.image_url
  return {
    id: `${source.slug}:${nft.identifier}`,
    title: nft.name || `${source.name} #${nft.identifier}`,
    token: `#${nft.identifier}`,
    tokenId: nft.identifier,
    src: mediaUrl(image),
    url: nft.opensea_url || `https://opensea.io/assets/${nft.contract}/${nft.identifier}`,
    collectionSlug: source.slug,
    collectionName: source.name,
  }
}

async function fetchCollections() {
  if (Date.now() < collectionsCache.expiresAt && collectionsCache.collections.length) return collectionsCache
  if (collectionsRequest) return collectionsRequest
  collectionsRequest = (async () => {
    const results = await Promise.allSettled(sources.map(async (source) => {
      const [metadata, nftPage] = await Promise.all([
        openSea(`/collections/${source.slug}`),
        openSea(`/collection/${source.slug}/nfts?limit=4`),
      ])
      const contract = metadata.contracts?.[0]
      const description = (metadata.description || '').split(/\n\s*\n/).find(Boolean) || ''
      return {
        slug: source.slug,
        name: (metadata.name || source.name).replace(/\s+/g, ' ').replace(/\s+:/g, ':'),
        description,
        image: mediaUrl(metadata.image_url),
        bannerImage: mediaUrl(metadata.banner_image_url),
        contract: contract?.address || '',
        chainId: contract?.chain || '',
        url: `https://opensea.io/collection/${source.slug}`,
        nfts: (nftPage.nfts || []).map((nft) => normalizeNft(nft, source)).filter((nft) => nft.src),
      }
    }))
    const collections = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
    if (collections.length === sources.length) {
      collectionsCache = { collections, fetchedAt: new Date().toISOString(), expiresAt: Date.now() + 300000 }
    } else if (collectionsCache.collections.length) {
      collectionsCache.expiresAt = Date.now() + 30000
    } else {
      const reasons = results.filter((result) => result.status === 'rejected').map((result) => result.reason?.message).join(', ')
      throw new Error(reasons || 'OpenSea collection data unavailable')
    }
    return collectionsCache
  })().finally(() => { collectionsRequest = null })
  return collectionsRequest
}

function normalizeSale(event, source) {
  const nft = event.nft || {}
  const payment = event.payment || {}
  const decimals = Number(payment.decimals || 0)
  const amount = Number(payment.quantity || 0) / (10 ** decimals)
  const timestamp = Number(event.event_timestamp || event.closing_date || 0)
  return {
    id: `${event.transaction || event.order_hash || timestamp}:${nft.identifier}:${payment.quantity}`,
    time: new Date(timestamp * 1000).toISOString(),
    transaction: event.transaction,
    tokenId: nft.identifier,
    name: nft.name || `${source.name} #${nft.identifier}`,
    contract: nft.contract,
    chain: event.chain,
    price: amount,
    symbol: payment.symbol || '',
    buyer: event.buyer,
    seller: event.seller,
    collectionName: source.name,
    collectionSlug: source.slug,
    url: nft.opensea_url || `https://opensea.io/assets/${event.chain}/${nft.contract}/${nft.identifier}`,
    image: mediaUrl(nft.display_image_url || nft.image_url),
  }
}

async function fetchActivity() {
  if (Date.now() < activityCache.expiresAt && activityCache.events.length) return activityCache
  if (activityRequest) return activityRequest
  activityRequest = (async () => {
    const results = await Promise.allSettled(sources.map(async (source) => {
      const data = await openSea(`/events/collection/${source.slug}?event_type=sale&limit=12`)
      return (data.asset_events || []).map((event) => normalizeSale(event, source))
    }))
    const events = results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
      .filter((event) => event.tokenId && event.image && Number.isFinite(event.price))
      .filter((event, index, all) => all.findIndex((candidate) => candidate.id === event.id) === index)
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 30)
    if (events.length) activityCache = { events, fetchedAt: new Date().toISOString(), expiresAt: Date.now() + 40000 }
    else if (activityCache.events.length) activityCache.expiresAt = Date.now() + 30000
    else throw new Error('OpenSea returned no sales for the configured collections')
    return activityCache
  })().finally(() => { activityRequest = null })
  return activityRequest
}

async function fetchMedia(sourceUrl) {
  const remoteUrl = new URL(sourceUrl)
  if (remoteUrl.protocol !== 'https:' || !mediaHosts.has(remoteUrl.hostname)) throw new Error('Unsupported OpenSea media URL')
  const cached = mediaCache.get(remoteUrl.href)
  if (cached && cached.expiresAt > Date.now()) return cached
  const response = await fetch(remoteUrl, {
    headers: { 'user-agent': 'LittleWorlds/1.0', accept: 'image/avif,image/webp,image/png,image/*' },
    signal: AbortSignal.timeout(10000),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!response.ok || !contentType.startsWith('image/')) throw new Error(`OpenSea media ${response.status}`)
  const body = Buffer.from(await response.arrayBuffer())
  if (!body.length) throw new Error('OpenSea returned empty media')
  const entry = { body, contentType, expiresAt: Date.now() + 300000 }
  mediaCache.set(remoteUrl.href, entry)
  if (mediaCache.size > 100) mediaCache.delete(mediaCache.keys().next().value)
  return entry
}

async function sendFile(response, pathname) {
  const requestPath = pathname === '/' ? '/index.html' : pathname
  const safePath = normalize(requestPath).replace(/^(\.\.[/\\])+/, '')
  let filePath = join(root, safePath)
  try {
    const info = await stat(filePath)
    if (info.isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    filePath = join(root, 'index.html')
  }
  const body = await readFile(filePath)
  response.writeHead(200, { 'content-type': mime[extname(filePath)] || 'application/octet-stream', 'cache-control': 'no-cache' })
  response.end(body)
}

function sendJson(response, status, data) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify(data))
}

const vite = isDevelopment
  ? await (await import('vite')).createServer({ server: { middlewareMode: true }, appType: 'spa' })
  : null

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)
  try {
    if (url.pathname === '/api/activity') {
      sendJson(response, 200, await fetchActivity())
      return
    }
    if (url.pathname === '/api/collections') {
      sendJson(response, 200, await fetchCollections())
      return
    }
    if (url.pathname === '/api/media') {
      const media = await fetchMedia(url.searchParams.get('src') || '')
      response.writeHead(200, { 'content-type': media.contentType, 'cache-control': 'public, max-age=300' })
      response.end(media.body)
      return
    }
    if (vite) {
      vite.middlewares(request, response, (error) => {
        if (error) {
          console.error(error)
          if (!response.writableEnded) sendJson(response, 500, { error: 'Unable to serve Little Worlds.' })
        }
      })
      return
    }
    await sendFile(response, decodeURIComponent(url.pathname))
  } catch (error) {
    console.error(error.message)
    if (!response.writableEnded) sendJson(response, 503, { error: error.message })
  }
}).listen(port, '127.0.0.1', () => console.log(`Little Worlds: http://localhost:${port}`))
