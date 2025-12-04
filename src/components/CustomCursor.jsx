import { useEffect, useRef, useState } from 'react'
import './CustomCursor.css'

function CustomCursor() {
  const rocketRef = useRef(null)
  const [particles, setParticles] = useState([])
  const [isBlasting, setIsBlasting] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [velocity, setVelocity] = useState({ x: 0, y: 0 })
  const prevPosition = useRef({ x: 0, y: 0 })
  const currentPosition = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const rocket = rocketRef.current
    let animationFrameId

    const moveCursor = (e) => {
      currentPosition.current = { x: e.clientX, y: e.clientY }
      
      if (rocket) {
        rocket.style.left = e.clientX + 'px'
        rocket.style.top = e.clientY + 'px'
      }
    }

    const updatePhysics = () => {
      // Calculate velocity
      const dx = currentPosition.current.x - prevPosition.current.x
      const dy = currentPosition.current.y - prevPosition.current.y
      
      // Smooth velocity with lerp
      const newVelocityX = velocity.x * 0.8 + dx * 0.2
      const newVelocityY = velocity.y * 0.8 + dy * 0.2
      
      setVelocity({ x: newVelocityX, y: newVelocityY })
      
      // Calculate rotation based on horizontal movement
      const targetRotation = Math.max(-30, Math.min(30, newVelocityX * 2))
      const smoothRotation = rotation * 0.85 + targetRotation * 0.15
      setRotation(smoothRotation)
      
      // Update previous position
      prevPosition.current = { ...currentPosition.current }
      
      animationFrameId = requestAnimationFrame(updatePhysics)
    }

    updatePhysics()
    document.addEventListener('mousemove', moveCursor)

    const handleClick = (e) => {
      setIsBlasting(true)
      
      // Create blast particles
      const newParticles = []
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: Date.now() + i,
          x: e.clientX,
          y: e.clientY,
          angle: (Math.PI * 2 * i) / 20,
          velocity: 2 + Math.random() * 3,
        })
      }
      setParticles(newParticles)

      // Reset after animation
      setTimeout(() => {
        setIsBlasting(false)
        setParticles([])
      }, 800)
    }

    const handleMouseEnter = () => {
      if (rocket) {
        rocket.classList.add('rocket-hover')
      }
    }

    const handleMouseLeave = () => {
      if (rocket) {
        rocket.classList.remove('rocket-hover')
      }
    }

    document.addEventListener('mousemove', moveCursor)
    document.addEventListener('click', handleClick)

    const interactiveElements = document.querySelectorAll('a, button, input, textarea, select')
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    })

    return () => {
      document.removeEventListener('mousemove', moveCursor)
      document.removeEventListener('click', handleClick)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [rotation, velocity])

  const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2)
  const thrustIntensity = Math.min(speed / 10, 1)

  return (
    <>
      <div 
        ref={rocketRef} 
        className={`rocket-cursor ${isBlasting ? 'blasting' : ''}`}
        style={{
          '--rotation': `${rotation}deg`,
          '--thrust': thrustIntensity,
        }}
      >
        <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Rocket body */}
          <path d="M16 4 L20 16 L16 24 L12 16 Z" fill="url(#rocketGradient)" stroke="#00ffff" strokeWidth="1.5"/>
          {/* Rocket window */}
          <circle cx="16" cy="12" r="3" fill="#00ffff" opacity="0.6"/>
          {/* Rocket fins */}
          <path d="M12 16 L8 20 L12 20 Z" fill="#ff00ff"/>
          <path d="M20 16 L24 20 L20 20 Z" fill="#ff00ff"/>
          {/* Rocket flame - dynamic based on speed */}
          <path d="M14 24 L16 28 L18 24" fill="#ff6600" className="rocket-flame" opacity={0.8 + thrustIntensity * 0.2}>
            <animate attributeName="d" 
              values="M14 24 L16 28 L18 24;M14 24 L16 30 L18 24;M14 24 L16 28 L18 24" 
              dur={`${0.15 / (1 + thrustIntensity)}s`}
              repeatCount="indefinite"/>
          </path>
          {/* Additional flame particles when moving fast */}
          {thrustIntensity > 0.3 && (
            <>
              <circle cx="14" cy="26" r="2" fill="#ff9900" opacity="0.6" className="flame-particle"/>
              <circle cx="18" cy="26" r="2" fill="#ff9900" opacity="0.6" className="flame-particle"/>
            </>
          )}
          <defs>
            <linearGradient id="rocketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00ffff"/>
              <stop offset="100%" stopColor="#0088ff"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Blast particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="blast-particle"
          style={{
            left: particle.x + 'px',
            top: particle.y + 'px',
            '--angle': particle.angle + 'rad',
            '--velocity': particle.velocity,
          }}
        />
      ))}
    </>
  )
}

export default CustomCursor
