import React, { useEffect, useMemo, useState } from 'react'
import { ARTIST, collections, explorerFor, futureForms } from './data'

const primaryCollection = collections[0]

function Arrow({ down = false }) {
  return <span aria-hidden="true">{down ? '↓' : '↗'}</span>
}

function Mark({ colour = 'blue' }) {
  return <span className={`crayon-mark crayon-mark--${colour}`} aria-hidden="true" />
}

function SafeImage({ src, ...props }) {
  if (!src) return <span className="live-art-placeholder" aria-hidden="true" />
  const recover = (event) => {
    const image = event.currentTarget
    image.style.visibility = 'hidden'
  }
  return <img {...props} src={src} onError={recover} />
}

function useLiveCollections() {
  const [state, setState] = useState({ collections: [], loading: true, error: false })
  useEffect(() => {
    let mounted = true
    const load = () => {
      fetch('/api/collections')
        .then((response) => {
          if (!response.ok) throw new Error('Collection request failed')
          return response.json()
        })
        .then((data) => {
          if (!mounted) return
          const live = collections.map((local) => {
            const remote = data.collections?.find((collection) => collection.slug === local.slug)
            if (!remote) return { ...local, nfts: [] }
            const merged = { ...local, ...remote, chain: local.chain, status: 'Live on OpenSea' }
            return { ...merged, nfts: remote.nfts.map((nft) => ({ ...nft, collection: merged })) }
          })
          setState({ collections: live, loading: false, error: false })
        })
        .catch(() => mounted && setState((current) => ({
          collections: current.collections.length ? current.collections : collections.map((collection) => ({ ...collection, nfts: [] })),
          loading: false,
          error: true,
        })))
    }
    load()
    const timer = window.setInterval(load, 300000)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [])
  return state
}

function Header({ siteCollections }) {
  const [open, setOpen] = useState(false)
  const primary = siteCollections[0] || primaryCollection
  return (
    <>
      <div className="utility-bar" id="top">
        <span>Three collections · one evolving universe</span>
        <a href="#activity"><i /> Live activity</a>
      </div>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Little Worlds home">little worlds</a>
        <button className="menu-toggle" type="button" aria-expanded={open} aria-label="Toggle menu" onClick={() => setOpen((value) => !value)}>
          <span /><span />
        </button>
        <nav className={open ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
          <a href="#worlds" onClick={() => setOpen(false)}>Worlds</a>
          <a href="#pepori" onClick={() => setOpen(false)}>Pepori</a>
          <a href="#activity" onClick={() => setOpen(false)}>Activity</a>
          <a href="#future" onClick={() => setOpen(false)}>Future</a>
        </nav>
        <a className="outline-button header-button" href={primary.url} target="_blank" rel="noreferrer">View on OpenSea <Arrow /></a>
      </header>
    </>
  )
}

function Hero({ onOpen, siteCollections }) {
  const primaryArt = siteCollections[0]?.nfts?.[0]
  return (
    <section className="hero">
      <div className="hero-copy reveal">
        <p className="eyebrow">An art and character universe by B888B</p>
        <h1>Big imagination.<br />Little worlds.</h1>
        <p className="hero-intro">Art, characters and curious things—built slowly, with room to become more.</p>
        <div className="hero-links">
          <a className="ink-link ink-link--blue" href="#worlds">Explore the worlds <Arrow down /></a>
          <a className="ink-link ink-link--red" href="#activity">Live activity <span aria-hidden="true">↘</span></a>
        </div>
      </div>
      <button className="hero-art art-button reveal" type="button" disabled={!primaryArt} onClick={() => primaryArt && onOpen(primaryArt)} aria-label={primaryArt ? `Open ${primaryArt.title}` : 'Loading live OpenSea artwork'}>
        <span className="art-mat"><SafeImage src={primaryArt?.src} alt={primaryArt?.title || ''} /></span>
        <span className="art-caption"><b>{primaryArt?.title || 'Loading from OpenSea…'}</b><span>Little Worlds {primaryArt ? `· ${primaryArt.token}` : ''}</span></span>
      </button>
      <div className="hero-chapters reveal" aria-label="The Little Worlds universe">
        <div className="chapter-heading"><span>The universe</span><strong>so far</strong><Mark /></div>
        <div className="chapter-list">
          {siteCollections.map((collection) => {
            const image = collection.nfts?.[0]?.src || collection.image
            return (
              <a key={collection.id} href={`#collection-${collection.id}`} className="chapter-row">
                <span className="chapter-order">{collection.order}</span>
                <strong>{collection.name}</strong>
                <span>{collection.chain}</span>
                <em><i className={`status-dot status-dot--${collection.accent}`} />{collection.status}</em>
                <SafeImage src={image} alt="" />
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Manifesto() {
  return (
    <section className="manifesto reveal">
      <div className="manifesto-number">01 <span>/ imagination first</span></div>
      <blockquote>The goal was never to imitate a child’s ability.<br /><em>It was to imitate a child’s imagination.</em></blockquote>
      <p>Not the way children draw,<br />but the way they think.</p>
    </section>
  )
}

function CollectionExplorer({ onOpen, siteCollections, loading, error }) {
  const [activeId, setActiveId] = useState('little-worlds')
  const active = siteCollections.find((collection) => collection.id === activeId) || siteCollections[0]
  const featured = active?.nfts || []

  return (
    <section className="collections-section" id="worlds">
      <div className="section-heading reveal">
        <div><p className="eyebrow">The collection universe</p><h2>Three chapters,<br />one way of seeing.</h2><Mark colour="red" /></div>
        <p>Each collection opens a new door into Little Worlds—always led by the artwork, never by noise.</p>
      </div>
      <div className="collection-explorer reveal">
        <div className="collection-tabs" role="tablist" aria-label="Collections">
          {siteCollections.map((collection) => (
            <button key={collection.id} type="button" role="tab" aria-selected={activeId === collection.id} onClick={() => setActiveId(collection.id)}>
              <span>{collection.order} / 03</span>
              <strong>{collection.name}</strong>
              <small>{collection.chain}</small>
            </button>
          ))}
        </div>
        <div className="collection-panel" role="tabpanel" id={`collection-${active.id}`}>
          <div className="collection-meta">
            <div><span>{active.status}</span><h3>{active.name}</h3></div>
            <p>{active.description}</p>
            <a className="ink-link ink-link--blue" href={active.url} target="_blank" rel="noreferrer">View collection <Arrow /></a>
          </div>
          {loading ? <div className="collection-message">Loading current artwork from OpenSea…</div> : null}
          {error ? <div className="collection-message">OpenSea collection data is reconnecting.</div> : null}
          <div className={`art-grid art-grid--${Math.min(featured.length, 4)}`}>
            {featured.map((art) => (
              <button className="collection-art art-button" type="button" key={art.id} onClick={() => onOpen(art)}>
                <span className="art-mat"><SafeImage src={art.src} alt={art.title} loading="lazy" /></span>
                <span className="art-caption"><b>{art.title}</b><span>{art.token}</span></span>
              </button>
            ))}
          </div>
          <div className="contract-line"><span>{active.chain}</span><code>{active.contract}</code><a href={explorerFor(active)} target="_blank" rel="noreferrer">Contract <Arrow /></a></div>
        </div>
      </div>
    </section>
  )
}

function Pepori({ onOpen, art }) {
  return (
    <section className="pepori" id="pepori">
      <div className="pepori-stripe" aria-hidden="true" />
      <div className="pepori-copy reveal">
        <p className="eyebrow">The emotional heart</p>
        <h2>Meet Pepori.</h2>
        <Mark colour="red" />
        <p>Curious. Quietly brave. Always looking at the world as if it has just appeared.</p>
        <ul><li>Looks closer</li><li>Makes room for wonder</li><li>Never knows the rules</li></ul>
        <a className="ink-link ink-link--blue" href={ARTIST} target="_blank" rel="noreferrer">Follow Pepori’s story <Arrow /></a>
      </div>
      <button className="pepori-art art-button reveal" type="button" disabled={!art} onClick={() => art && onOpen(art)}>
        <span className="art-mat"><SafeImage src={art?.src} alt={art?.title || ''} loading="lazy" /></span>
        <span className="art-caption"><b>{art?.title || 'Loading from OpenSea…'}</b><span>{art ? `${art.token} · Little Worlds` : 'Live collection artwork'}</span></span>
      </button>
    </section>
  )
}

function timeAgo(value) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function shortAddress(value) {
  if (!value) return 'Collector'
  if (!value.startsWith('0x')) return value
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

function Activity() {
  const [state, setState] = useState({ events: [], fetchedAt: null, loading: true, error: false })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const response = await fetch('/api/activity')
        if (!response.ok) throw new Error('Activity request failed')
        const data = await response.json()
        if (mounted) setState({ events: data.events ?? [], fetchedAt: data.fetchedAt, loading: false, error: false })
      } catch {
        if (mounted) setState((current) => ({ ...current, loading: false, error: true }))
      }
    }
    load()
    const timer = window.setInterval(load, 45000)
    return () => { mounted = false; window.clearInterval(timer) }
  }, [])

  const events = useMemo(() => {
    const latestFromEach = collections
      .map((collection) => state.events.find((event) => event.collectionName === collection.name))
      .filter(Boolean)
    const guaranteedIds = new Set(latestFromEach.map((event) => event.id))
    const newestOthers = state.events.filter((event) => !guaranteedIds.has(event.id)).slice(0, Math.max(0, 8 - latestFromEach.length))
    return [...latestFromEach, ...newestOthers]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
  }, [state.events])
  return (
    <section className="activity" id="activity">
      <div className="activity-heading reveal">
        <div><p className="eyebrow">Across every chapter</p><h2>The worlds<br />are moving.</h2><Mark colour="red" /></div>
        <p className="live-label"><i /> Live sales across all three collections</p>
      </div>
      <div className="activity-ledger reveal" aria-live="polite">
        <div className="ledger-head"><span>Collection</span><span>Artwork</span><span>Collector</span><span>Price</span><span>Time</span></div>
        {state.loading ? <div className="activity-message">Opening the live ledger…</div> : null}
        {!state.loading && events.length === 0 ? <div className="activity-message">{state.error ? 'Live activity is reconnecting.' : 'No recent sales found.'}</div> : null}
        {events.map((event) => (
          <a className="ledger-row" href={event.url} target="_blank" rel="noreferrer" key={event.id}>
            <span className="ledger-collection"><SafeImage src={event.image} alt="" loading="lazy" /><b>{event.collectionName}</b></span>
            <span><b>{event.name}</b><small>#{event.tokenId}</small></span>
            <span>{shortAddress(event.buyerName || event.buyer)}</span>
            <span><b>{Number(event.price).toFixed(4)}</b> {event.symbol}</span>
            <span>{timeAgo(event.time)} <Arrow /></span>
          </a>
        ))}
      </div>
      <div className="activity-foot">
        <span>{state.fetchedAt ? `Updated ${new Date(state.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Updates every 45 seconds'}</span>
        <a href={`${primaryCollection.url}/activity`} target="_blank" rel="noreferrer">View all activity <Arrow /></a>
      </div>
    </section>
  )
}

function Future() {
  return (
    <section className="future" id="future">
      <div className="future-copy reveal">
        <p className="eyebrow">Built carefully over time</p>
        <h2>Possibilities,<br />not promises.</h2><Mark colour="red" />
        <p>Little Worlds begins with art and characters worth caring about. The wider structure leaves room for future forms without pretending the path is already decided.</p>
      </div>
      <ol className="future-list reveal">
        {futureForms.map((form, index) => <li key={form}><span>{String(index + 1).padStart(2, '0')}.</span><strong>{form}</strong><Arrow /></li>)}
      </ol>
    </section>
  )
}

function Belief({ onOpen, art }) {
  return (
    <section className="belief">
      <button className="belief-art art-button reveal" type="button" disabled={!art} onClick={() => art && onOpen(art)}>
        <span className="art-mat"><SafeImage src={art?.src} alt={art?.title || ''} loading="lazy" /></span>
      </button>
      <div className="belief-copy reveal">
        <p className="eyebrow">For the early believers</p>
        <h2>Attention can be bought.<br /><em>Belief can’t.</em></h2>
        <p>Collecting a Little World means supporting the early stages of something being built carefully over time.</p>
        <small>— B888B, creator of Little Worlds</small>
        <a className="ink-link ink-link--blue" href={ARTIST} target="_blank" rel="noreferrer">Meet the artist <Arrow /></a>
      </div>
    </section>
  )
}

function Footer({ siteCollections }) {
  return (
    <footer>
      <div><a className="wordmark wordmark--footer" href="#top">little worlds</a><p>Made for curious minds.</p></div>
      <div className="footer-collections">
        {siteCollections.map((collection) => <a key={collection.id} href={collection.url} target="_blank" rel="noreferrer">{collection.order} {collection.name} <Arrow /></a>)}
      </div>
      <nav aria-label="Footer links"><a href={ARTIST} target="_blank" rel="noreferrer">Artist / X <Arrow /></a><a href="#activity">Live activity ↓</a></nav>
      <p className="footer-note">Little Worlds is an evolving art and character project. Possibilities are creative direction, not commitments.</p>
    </footer>
  )
}

function Lightbox({ art, onClose }) {
  useEffect(() => {
    if (!art) return undefined
    const close = (event) => event.key === 'Escape' && onClose()
    document.body.classList.add('no-scroll')
    window.addEventListener('keydown', close)
    return () => { document.body.classList.remove('no-scroll'); window.removeEventListener('keydown', close) }
  }, [art, onClose])
  if (!art) return null
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={art.title} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <button type="button" className="lightbox-close" onClick={onClose}>Close ×</button>
      <figure><SafeImage src={art.src} alt={art.title} /><figcaption><b>{art.title}</b><span>{art.collection?.name} · {art.token}</span></figcaption></figure>
    </div>
  )
}

export default function App() {
  const [selectedArt, setSelectedArt] = useState(null)
  const closeLightbox = useMemo(() => () => setSelectedArt(null), [])
  const live = useLiveCollections()
  const siteCollections = live.collections.length ? live.collections : collections.map((collection) => ({ ...collection, nfts: [] }))
  const primaryArt = siteCollections[0]?.nfts || []

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const elements = document.querySelectorAll('.reveal')
    if (reduced) { elements.forEach((element) => element.classList.add('is-visible')); return undefined }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) }
    }), { threshold: 0.08 })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <><Header siteCollections={siteCollections} /><main><Hero onOpen={setSelectedArt} siteCollections={siteCollections} /><Manifesto /><CollectionExplorer onOpen={setSelectedArt} siteCollections={siteCollections} loading={live.loading} error={live.error} /><Pepori onOpen={setSelectedArt} art={primaryArt[1]} /><Activity /><Future /><Belief onOpen={setSelectedArt} art={primaryArt[2]} /></main><Footer siteCollections={siteCollections} /><Lightbox art={selectedArt} onClose={closeLightbox} /></>
  )
}
