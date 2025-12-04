import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import HeroCubes from './components/HeroCubes.jsx'
import ModelingViewer from './components/ModelingViewer.jsx'
import FireSimulation from './components/FireSimulation.jsx'
import SmokeSimulation from './components/SmokeSimulation.jsx'
import WaterSimulation from './components/WaterSimulation.jsx'
import RobotDemo from './components/RobotDemo.jsx'
import './App.css'
import './components/AnimationVideos.css'
import './components/ModelingDemo.css'

const TOPICS = [
  { id: 'animation', label: '3D Animation', subtitle: 'Bring stories to life with motion, timing, and expressive performance.' },
  { id: 'modeling', label: '3D Modeling', subtitle: 'Shape believable forms, from hard-surface assets to characters.' },
  { id: 'simulation', label: 'Simulation & FX', subtitle: 'Drive realism with particles, fluids, destruction, and dynamics.' },
  { id: 'cgi', label: '3D CGI', subtitle: 'Produce cinematic visuals for film, games, and interactive media.' },
  { id: 'lighting', label: 'Lighting & Rendering', subtitle: 'Craft mood and clarity with advanced lighting and rendering workflows.' },
]

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, MotionPathPlugin)

function App() {
  const [topicIndex, setTopicIndex] = useState(0)
  const [topicPhase, setTopicPhase] = useState('in')
  const cubeFollowerRef = useRef(null)
  const floatingElementRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setTopicPhase('out')
      setTimeout(() => {
        setTopicIndex((prev) => (prev + 1) % TOPICS.length)
        setTopicPhase('in')
      }, 120)
    }, 2800)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const cubeEl = cubeFollowerRef.current
    if (!cubeEl) return

    const sections = gsap.utils.toArray('.topic-section')
    const positions = [
      { xPercent: 18, yPercent: -20 },
      { xPercent: 30, yPercent: 8 },
      { xPercent: -4, yPercent: -12 },
      { xPercent: 10, yPercent: 22 },
      { xPercent: -18, yPercent: 6 },
    ]

    const triggers = sections.map((section, index) => {
      const pos = positions[index % positions.length]
      return ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        onEnter: () => {
          gsap.to(cubeEl, {
            xPercent: pos.xPercent,
            yPercent: pos.yPercent,
            duration: 1.4,
            ease: 'power3.out',
          })
        },
        onEnterBack: () => {
          gsap.to(cubeEl, {
            xPercent: pos.xPercent,
            yPercent: pos.yPercent,
            duration: 1.2,
            ease: 'power3.out',
          })
        },
      })
    })

    const heroTrigger = ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      onEnter: () => {
        gsap.to(cubeEl, { opacity: 1, duration: 0.8, ease: 'power2.out' })
      },
      onEnterBack: () => {
        gsap.to(cubeEl, { opacity: 1, duration: 0.8, ease: 'power2.out' })
      },
    })

    return () => {
      triggers.forEach((t) => t.kill())
      heroTrigger.kill()
    }
  }, [])

  // Smooth scroll navigation only (all animations and parallax removed)
  useEffect(() => {
    // Smooth scroll to sections
    const handleAnchorClick = (e) => {
      e.preventDefault()
      const href = e.currentTarget.getAttribute('href')
      const target = document.querySelector(href)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    const anchors = document.querySelectorAll('a[href^="#"]')
    anchors.forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick)
    })

    // All scroll animations, parallax effects, and pinning removed

    // Cleanup function
    return () => {
      anchors.forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick)
      })
    }
  }, [])

  const handleHeroGridMouseMove = (event) => {
    const grid = event.currentTarget
    const rect = grid.getBoundingClientRect()
    const cells = grid.querySelectorAll('.hero-grid-cell')
    if (!cells.length) return

    const cols = 13
    const rows = cells.length / cols
    const cellWidth = rect.width / cols
    const cellHeight = rect.height / rows

    const relX = event.clientX - rect.left
    const relY = event.clientY - rect.top

    const col = Math.floor(relX / cellWidth)
    const row = Math.floor(relY / cellHeight)

    const radius = 0 // radius in grid cells (only the nearest cell)

    cells.forEach((cell, index) => {
      const cellRow = Math.floor(index / cols)
      const cellCol = index % cols
      const dist = Math.hypot(cellRow - row, cellCol - col)

      if (dist <= radius) {
        cell.classList.add('hero-grid-cell-highlighted')
      } else {
        cell.classList.remove('hero-grid-cell-highlighted')
      }
    })
  }

  const handleHeroGridMouseLeave = (event) => {
    const grid = event.currentTarget
    const cells = grid.querySelectorAll('.hero-grid-cell')
    cells.forEach((cell) => cell.classList.remove('hero-grid-cell-highlighted'))
  }

  const activeTopic = TOPICS[topicIndex]

  return (
    <div className="app-shell" id="top">
      <div ref={floatingElementRef} className="floating-orb"></div>
      <svg className="motion-path-svg" width="0" height="0">
        <defs>
          <path id="circlePath" d="M 250,250 m -200,0 a 200,200 0 1,1 400,0 a 200,200 0 1,1 -400,0" />
          <path id="wavePath" d="M 0,100 Q 100,50 200,100 T 400,100 T 600,100 T 800,100" />
        </defs>
      </svg>
      <header className="nav">
        <div className="nav-inner nav-inner-center">
          <nav className="nav-links" aria-label="Primary navigation">
            {TOPICS.map((topic) => (
              <a key={topic.id} href={`#${topic.id}`} className="nav-link">
                {topic.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-grid-wrapper" aria-hidden="true">
            <div
              className="hero-grid"
              onMouseMove={handleHeroGridMouseMove}
              onMouseLeave={handleHeroGridMouseLeave}
            >
              {Array.from({ length: 13 * 9 }).map((_, i) => (
                <div key={i} className="hero-grid-cell" />
              ))}
            </div>
          </div>

          <div className="hero-3d-layer" aria-hidden="true">
            <HeroCubes />
          </div>

          <div className="hero-center">
            <p className="hero-kicker">CINEMATIC 3D EXPERIENCE</p>
            <h1 id="hero-title" className="hero-title hero-title-center">
              <span className="hero-title-main">Where ideas become</span>
              <span className="hero-title-topic-wrapper">
                <span
                  className={`hero-title-topic hero-title-topic-${topicPhase}`}
                  aria-live="polite"
                >
                  {activeTopic.label}
                </span>
              </span>
            </h1>
            <p
              className={`hero-subtitle hero-subtitle-center hero-text-transition hero-text-transition-${topicPhase}`}
            >
              {activeTopic.subtitle}
            </p>

            <div className="hero-cta-row hero-cta-row-center">
              <a href={`#${activeTopic.id}`} className="primary-cta">
                Explore{' '}
                <span className={`hero-cta-dynamic hero-text-transition hero-text-transition-${topicPhase}`}>
                  {activeTopic.label}
                </span>
              </a>
              <div className="hero-topic-pills" aria-hidden="true">
                {TOPICS.map((topic, index) => (
                  <span
                    key={topic.id}
                    className={`hero-topic-pill ${
                      index === topicIndex ? 'hero-topic-pill-active' : ''
                    }`}
                  >
                    {topic.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="animation" className="topic-section section-animation-videos" aria-labelledby="section-animation-title">
          <div className="animation-wave-top">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,70 C200,100 400,100 600,70 C800,40 1000,40 1200,70 L1200,0 L0,0 Z" fill="#0a0e27">
                <animate attributeName="d" 
                  values="M0,70 C200,100 400,100 600,70 C800,40 1000,40 1200,70 L1200,0 L0,0 Z;
                          M0,90 C200,120 400,120 600,90 C800,60 1000,60 1200,90 L1200,0 L0,0 Z;
                          M0,70 C200,100 400,100 600,70 C800,40 1000,40 1200,70 L1200,0 L0,0 Z" 
                  dur="10s" 
                  repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
          
          <div className="animation-videos-container">
            <div className="animation-videos-header">
              <div className="animation-videos-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>Animation</span>
              </div>
              <h2 id="section-animation-title" className="animation-videos-title">
                3D Animation Studio
              </h2>
              <p className="animation-videos-subtitle">
                Bring characters and objects to life with professional animation tools and techniques
              </p>
            </div>

            <div className="animation-videos-showcase">
              {/* Featured Large Video */}
              <div className="video-card video-featured">
                <div className="video-card-inner">
                  <div className="video-badge">Featured</div>
                  <svg className="video-play-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <div className="video-info">
                    <h3>Character Animation Showcase</h3>
                    <p>Full production pipeline</p>
                  </div>
                </div>
              </div>

              {/* Main Grid */}
              <div className="video-grid-main">
                <div className="video-card video-large">
                  <div className="video-card-inner">
                    <svg className="video-play-icon" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <div className="video-info">
                      <h3>Rigging Masterclass</h3>
                      <p>Advanced techniques</p>
                    </div>
                  </div>
                </div>

                <div className="video-card video-medium">
                  <div className="video-card-inner">
                    <svg className="video-play-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <div className="video-info">
                      <h3>Keyframe Animation</h3>
                      <p>Timing & spacing</p>
                    </div>
                  </div>
                </div>

                <div className="video-card video-medium">
                  <div className="video-card-inner">
                    <svg className="video-play-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <div className="video-info">
                      <h3>Motion Capture</h3>
                      <p>Real-time performance</p>
                    </div>
                  </div>
                </div>

                <div className="video-card video-small">
                  <div className="video-card-inner">
                    <svg className="video-play-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <div className="video-info">
                      <h3>Walk Cycle</h3>
                    </div>
                  </div>
                </div>

                <div className="video-card video-small">
                  <div className="video-card-inner">
                    <svg className="video-play-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <div className="video-info">
                      <h3>Facial Rig</h3>
                    </div>
                  </div>
                </div>

                <div className="video-card video-small">
                  <div className="video-card-inner">
                    <svg className="video-play-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <div className="video-info">
                      <h3>Graph Editor</h3>
                    </div>
                  </div>
                </div>

                <div className="video-card video-medium">
                  <div className="video-card-inner">
                    <svg className="video-play-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <div className="video-info">
                      <h3>Physics Simulation</h3>
                      <p>Dynamic systems</p>
                    </div>
                  </div>
                </div>

                <div className="video-card video-small">
                  <div className="video-card-inner">
                    <svg className="video-play-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <div className="video-info">
                      <h3>IK Setup</h3>
                    </div>
                  </div>
                </div>

                <div className="video-card video-small">
                  <div className="video-card-inner">
                    <svg className="video-play-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <div className="video-info">
                      <h3>Constraints</h3>
                    </div>
                  </div>
                </div>

                <div className="video-card video-small">
                  <div className="video-card-inner">
                    <svg className="video-play-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <div className="video-info">
                      <h3>Timeline</h3>
                    </div>
                  </div>
                </div>

                <div className="video-card video-medium">
                  <div className="video-card-inner">
                    <svg className="video-play-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <div className="video-info">
                      <h3>Cloth Simulation</h3>
                      <p>Realistic fabric</p>
                    </div>
                  </div>
                </div>

                <div className="video-card video-small">
                  <div className="video-card-inner">
                    <svg className="video-play-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <div className="video-info">
                      <h3>Rendering</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="section-wave-bottom">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,60 C300,100 500,100 600,80 C700,60 900,40 1200,80 L1200,120 L0,120 Z" fill="#0a0e27">
                <animate attributeName="d" 
                  values="M0,60 C300,100 500,100 600,80 C700,60 900,40 1200,80 L1200,120 L0,120 Z;
                          M0,80 C300,40 500,40 600,60 C700,80 900,100 1200,60 L1200,120 L0,120 Z;
                          M0,60 C300,100 500,100 600,80 C700,60 900,40 1200,80 L1200,120 L0,120 Z" 
                  dur="8s" 
                  repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
        </section>

        <section id="modeling" className="topic-section section-modeling-demo" aria-labelledby="section-modeling-title">
          <div className="animation-wave-top">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,70 C200,100 400,100 600,70 C800,40 1000,40 1200,70 L1200,0 L0,0 Z" fill="#0a0e27">
                <animate attributeName="d" 
                  values="M0,70 C200,100 400,100 600,70 C800,40 1000,40 1200,70 L1200,0 L0,0 Z;
                          M0,90 C200,120 400,120 600,90 C800,60 1000,60 1200,90 L1200,0 L0,0 Z;
                          M0,70 C200,100 400,100 600,70 C800,40 1000,40 1200,70 L1200,0 L0,0 Z" 
                  dur="10s" 
                  repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
          
          <div className="modeling-demo-wrapper">
            <div className="animation-header-simple">
              <div className="animation-badge-simple">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span>3D Modeling</span>
              </div>
              <h2 id="section-modeling-title" className="animation-title-simple">
                3D Modeling Studio
              </h2>
              <p className="animation-subtitle-simple">
                Create stunning 3D models with precision and creativity - from characters to complex mechanical designs
              </p>
            </div>

            <div className="modeling-demo-viewport">
              <ModelingViewer />
            </div>
          </div>
          
          <div className="section-wave-bottom">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,60 C300,100 500,100 600,80 C700,60 900,40 1200,80 L1200,120 L0,120 Z" fill="#0a0e27">
                <animate attributeName="d" 
                  values="M0,60 C300,100 500,100 600,80 C700,60 900,40 1200,80 L1200,120 L0,120 Z;
                          M0,80 C300,40 500,40 600,60 C700,80 900,100 1200,60 L1200,120 L0,120 Z;
                          M0,60 C300,100 500,100 600,80 C700,60 900,40 1200,80 L1200,120 L0,120 Z" 
                  dur="8s" 
                  repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
        </section>

        <section id="simulation" className="topic-section section-simulation-new" aria-labelledby="section-simulation-title">
          <div className="simulation-wave-top">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,70 C200,100 400,100 600,70 C800,40 1000,40 1200,70 L1200,0 L0,0 Z" fill="#0a0e27">
                <animate attributeName="d" 
                  values="M0,70 C200,100 400,100 600,70 C800,40 1000,40 1200,70 L1200,0 L0,0 Z;
                          M0,90 C200,120 400,120 600,90 C800,60 1000,60 1200,90 L1200,0 L0,0 Z;
                          M0,70 C200,100 400,100 600,70 C800,40 1000,40 1200,70 L1200,0 L0,0 Z" 
                  dur="10s" 
                  repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
          <div className="simulation-container-new">
            <div className="simulation-header-new">
              <div className="simulation-badge-new">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
                <span>Simulation & FX</span>
              </div>
              <h2 id="section-simulation-title" className="simulation-title-new">
                Real-Time Physics Simulation
              </h2>
              <p className="simulation-subtitle-new">
                Create stunning visual effects with advanced particle systems, fluid dynamics, and physics-based simulations. 
                From fire and smoke to water and destruction, bring realism to every frame.
              </p>
            </div>

            <div className="simulation-cards-new">
              <div className="sim-card-new" data-sim="fire">
                <div className="sim-card-visual-new">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    preload="metadata"
                    className="sim-video"
                  >
                    <source src="/src/assets/videos/7020175_Flame_Fire_3840x2160.mp4" type="video/mp4" />
                  </video>
                </div>
                <div className="sim-card-content-new">
                  <h3 className="sim-card-title-new">Fire Simulation</h3>
                  <p className="sim-card-desc-new">
                    Realistic fire and combustion effects with dynamic particle systems, heat distortion, and volumetric rendering
                  </p>
                  <div className="sim-card-features-new">
                    <span className="sim-feature-tag-new">Particle System</span>
                    <span className="sim-feature-tag-new">Heat Distortion</span>
                    <span className="sim-feature-tag-new">Volumetric</span>
                  </div>
                </div>
              </div>

              <div className="sim-card-new" data-sim="smoke">
                <div className="sim-card-visual-new">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    preload="metadata"
                    className="sim-video"
                  >
                    <source src="/src/assets/videos/4954767_Coll_halloween_Realistic_6144x3456.mp4" type="video/mp4" />
                  </video>
                </div>
                <div className="sim-card-content-new">
                  <h3 className="sim-card-title-new">Smoke Simulation</h3>
                  <p className="sim-card-desc-new">
                    Billowing smoke and atmospheric effects with fluid dynamics, turbulence, and realistic dissipation patterns
                  </p>
                  <div className="sim-card-features-new">
                    <span className="sim-feature-tag-new">Fluid Dynamics</span>
                    <span className="sim-feature-tag-new">Turbulence</span>
                    <span className="sim-feature-tag-new">Voxel-Based</span>
                  </div>
                </div>
              </div>

              <div className="sim-card-new" data-sim="water">
                <div className="sim-card-visual-new">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    preload="metadata"
                    className="sim-video"
                  >
                    <source src="/src/assets/videos/6478423_Closeup_View_3840x2160.mp4" type="video/mp4" />
                  </video>
                </div>
                <div className="sim-card-content-new">
                  <h3 className="sim-card-title-new">Water Simulation</h3>
                  <p className="sim-card-desc-new">
                    Fluid water simulations with splashes, ripples, and surface tension for photorealistic liquid effects
                  </p>
                  <div className="sim-card-features-new">
                    <span className="sim-feature-tag-new">Fluid Solver</span>
                    <span className="sim-feature-tag-new">Surface Tension</span>
                    <span className="sim-feature-tag-new">Ripples</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="simulation-info-new">
              <div className="info-stat-new">
                <span className="info-stat-value-new">1M+</span>
                <span className="info-stat-label-new">Particles Per Second</span>
              </div>
              <div className="info-stat-new">
                <span className="info-stat-value-new">60</span>
                <span className="info-stat-label-new">FPS Real-Time</span>
              </div>
              <div className="info-stat-new">
                <span className="info-stat-value-new">GPU</span>
                <span className="info-stat-label-new">Accelerated</span>
              </div>
            </div>
          </div>
          <div className="section-wave-bottom">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,60 C300,100 500,100 600,80 C700,60 900,40 1200,80 L1200,120 L0,120 Z" fill="#0a0e27">
                <animate attributeName="d" 
                  values="M0,60 C300,100 500,100 600,80 C700,60 900,40 1200,80 L1200,120 L0,120 Z;
                          M0,80 C300,40 500,40 600,60 C700,80 900,100 1200,60 L1200,120 L0,120 Z;
                          M0,60 C300,100 500,100 600,80 C700,60 900,40 1200,80 L1200,120 L0,120 Z" 
                  dur="8s" 
                  repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
        </section>

        <section id="cgi" className="topic-section section-cgi-gsap" aria-labelledby="section-cgi-title">
          <div className="cgi-wave-top">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,70 C200,100 400,100 600,70 C800,40 1000,40 1200,70 L1200,0 L0,0 Z" fill="#0a0e27">
                <animate attributeName="d" 
                  values="M0,70 C200,100 400,100 600,70 C800,40 1000,40 1200,70 L1200,0 L0,0 Z;
                          M0,90 C200,120 400,120 600,90 C800,60 1000,60 1200,90 L1200,0 L0,0 Z;
                          M0,70 C200,100 400,100 600,70 C800,40 1000,40 1200,70 L1200,0 L0,0 Z" 
                  dur="10s" 
                  repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
          <div className="cgi-container-gsap">
            <div className="cgi-header-gsap">
              <div className="cgi-badge-gsap">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
                <span>CGI Production</span>
              </div>
              <h2 id="section-cgi-title" className="cgi-title-gsap">
                Cinematic 3D CGI
              </h2>
              <p className="cgi-subtitle-gsap">
                Pixel-perfect imagery for film, game cinematics, and real-time experiences with professional-grade rendering
              </p>
            </div>

            <div className="cgi-showcase-gsap">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="cgi-frame-gsap" data-frame={i + 1}>
                  <div className="frame-header-gsap">
                    <span className="frame-number-gsap">Shot {String(i + 1).padStart(2, '0')}</span>
                    <span className="frame-status-gsap">Rendering</span>
                  </div>
                  <div className="frame-viewport-gsap">
                    <div className="frame-gradient-gsap"></div>
                    <div className="frame-grid-gsap"></div>
                    <div className="frame-glow-gsap"></div>
                  </div>
                  <div className="frame-footer-gsap">
                    <span>CGI</span>
                    <span>•</span>
                    <span>Lookdev</span>
                    <span>•</span>
                    <span>Comp</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="cgi-features-gsap">
              <div className="cgi-feature-item-gsap">
                <div className="feature-icon-gsap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                </div>
                <h3>Lookdev</h3>
                <p>Material & shader development</p>
              </div>
              <div className="cgi-feature-item-gsap">
                <div className="feature-icon-gsap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                </div>
                <h3>Compositing</h3>
                <p>Multi-pass layer integration</p>
              </div>
              <div className="cgi-feature-item-gsap">
                <div className="feature-icon-gsap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <h3>Real-time</h3>
                <p>GPU-accelerated rendering</p>
              </div>
            </div>
          </div>
        </section>

        <section id="lighting" className="topic-section section-lighting-gsap" aria-labelledby="section-lighting-title">
          <div className="lighting-container-gsap">
            <div className="lighting-split-gsap">
              <div className="lighting-content-gsap">
                <div className="lighting-badge-gsap">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
                  </svg>
                  <span>Lighting & Rendering</span>
                </div>
                <h2 id="section-lighting-title" className="lighting-title-gsap">
                  Professional Lighting
                </h2>
                <p className="lighting-description-gsap">
                  Sculpt light, shadow, and atmosphere with physically-based rendering. HDRIs, area lights, and volumetrics for both offline and real-time pipelines.
                </p>

                <div className="lighting-techniques-gsap">
                  <div className="technique-item-gsap">
                    <div className="technique-icon-gsap">01</div>
                    <div className="technique-content-gsap">
                      <h4>Three-Point Lighting</h4>
                      <p>Key, fill, and rim lights for depth</p>
                    </div>
                  </div>
                  <div className="technique-item-gsap">
                    <div className="technique-icon-gsap">02</div>
                    <div className="technique-content-gsap">
                      <h4>HDRI Environments</h4>
                      <p>Image-based lighting for realism</p>
                    </div>
                  </div>
                  <div className="technique-item-gsap">
                    <div className="technique-icon-gsap">03</div>
                    <div className="technique-content-gsap">
                      <h4>Volumetric Effects</h4>
                      <p>God rays and atmospheric fog</p>
                    </div>
                  </div>
                  <div className="technique-item-gsap">
                    <div className="technique-icon-gsap">04</div>
                    <div className="technique-content-gsap">
                      <h4>Global Illumination</h4>
                      <p>Indirect lighting bounces</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lighting-visual-gsap">
                <div className="lighting-stage-gsap">
                  <div className="light-beam-gsap light-key-gsap"></div>
                  <div className="light-beam-gsap light-fill-gsap"></div>
                  <div className="light-beam-gsap light-rim-gsap"></div>
                  <div className="light-subject-gsap"></div>
                  <div className="light-particles-gsap">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="light-particle-gsap" style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${2 + Math.random() * 2}s`
                      }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <div className="footer-logo">Cine3D Studio</div>
            <p className="footer-copy">Concept cinematic landing page built with Vite, React, and WebGL.</p>
          </div>
          <div className="footer-right">
            <a href="#top" className="footer-link">
              Back to top
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
