import { useEffect, useRef } from 'react'

function FireSimulation() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Fire configuration
    const fireWidth = 120
    const fireX = width / 2
    const fireBaseY = height - 20

    // Particle arrays
    const flames = []
    const embers = []
    const smoke = []

    // Flame particle - the main fire effect
    class Flame {
      constructor() {
        this.reset()
      }

      reset() {
        // Spawn at base with some horizontal spread
        const spread = (Math.random() - 0.5) * fireWidth
        this.x = fireX + spread
        this.originX = this.x
        this.y = fireBaseY
        
        // Velocity - mostly upward with slight horizontal drift
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = -2 - Math.random() * 2.5
        
        // Life and decay
        this.life = 1
        this.decay = 0.008 + Math.random() * 0.012
        
        // Size - larger at base, shrinks as it rises
        this.baseSize = 25 + Math.random() * 35
        this.size = this.baseSize
        
        // Flickering
        this.flickerSpeed = 0.1 + Math.random() * 0.15
        this.flickerPhase = Math.random() * Math.PI * 2
        this.flickerAmp = 0.2 + Math.random() * 0.3
        
        // Turbulence for realistic movement
        this.turbPhase = Math.random() * Math.PI * 2
        this.turbSpeed = 0.03 + Math.random() * 0.04
        this.turbAmp = 15 + Math.random() * 20
        
        // Color temperature (affects hue)
        this.temp = Math.random()
      }

      update(deltaTime) {
        // Turbulent horizontal movement
        this.turbPhase += this.turbSpeed
        const turbulence = Math.sin(this.turbPhase) * this.turbAmp * (1 - this.life * 0.5)
        this.x = this.originX + turbulence + this.vx * (1 - this.life) * 50
        
        // Vertical movement - accelerates slightly upward
        this.y += this.vy
        this.vy *= 0.99
        this.originX += this.vx
        
        // Decay
        this.life -= this.decay
        
        // Size changes - grows slightly then shrinks
        const lifeCurve = Math.sin(this.life * Math.PI)
        this.size = this.baseSize * lifeCurve * 0.8
        
        // Flickering
        this.flickerPhase += this.flickerSpeed

        return this.life > 0
      }

      draw() {
        if (this.size <= 0) return

        const flicker = 1 + Math.sin(this.flickerPhase) * this.flickerAmp * this.life
        const currentSize = this.size * flicker
        const alpha = Math.pow(this.life, 0.6) * 0.9

        // Color based on life (height in flame)
        // Bottom: bright yellow/white, Middle: orange, Top: red/dark
        const progress = 1 - this.life
        
        let r, g, b
        if (progress < 0.15) {
          // Core - white/yellow
          r = 255
          g = 240 + Math.random() * 15
          b = 180 + this.temp * 50
        } else if (progress < 0.35) {
          // Inner flame - bright yellow
          const t = (progress - 0.15) / 0.2
          r = 255
          g = 240 - t * 80
          b = 180 - t * 150
        } else if (progress < 0.6) {
          // Middle - orange
          const t = (progress - 0.35) / 0.25
          r = 255
          g = 160 - t * 100
          b = 30 - t * 30
        } else {
          // Outer - red to dark red
          const t = (progress - 0.6) / 0.4
          r = 255 - t * 120
          g = 60 - t * 60
          b = 0
        }

        // Draw flame with multiple layers for depth
        ctx.globalCompositeOperation = 'lighter'
        
        // Outer glow
        const outerGrad = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, currentSize * 1.5
        )
        outerGrad.addColorStop(0, `rgba(${r}, ${g * 0.5}, 0, ${alpha * 0.3})`)
        outerGrad.addColorStop(0.5, `rgba(${r * 0.7}, ${g * 0.3}, 0, ${alpha * 0.15})`)
        outerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        
        ctx.fillStyle = outerGrad
        ctx.beginPath()
        ctx.arc(this.x, this.y, currentSize * 1.5, 0, Math.PI * 2)
        ctx.fill()

        // Main flame body
        const mainGrad = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, currentSize
        )
        mainGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`)
        mainGrad.addColorStop(0.4, `rgba(${r}, ${g * 0.7}, ${b * 0.5}, ${alpha * 0.8})`)
        mainGrad.addColorStop(0.7, `rgba(${r * 0.8}, ${g * 0.4}, 0, ${alpha * 0.4})`)
        mainGrad.addColorStop(1, 'rgba(80, 20, 0, 0)')

        ctx.fillStyle = mainGrad
        ctx.beginPath()
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2)
        ctx.fill()

        // Bright core for hottest flames
        if (progress < 0.3 && this.life > 0.5) {
          const coreGrad = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, currentSize * 0.4
          )
          coreGrad.addColorStop(0, `rgba(255, 255, 240, ${alpha * 0.8})`)
          coreGrad.addColorStop(0.5, `rgba(255, 255, 200, ${alpha * 0.4})`)
          coreGrad.addColorStop(1, 'rgba(255, 200, 100, 0)')
          
          ctx.fillStyle = coreGrad
          ctx.beginPath()
          ctx.arc(this.x, this.y, currentSize * 0.4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Ember/spark particle
    class Ember {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = fireX + (Math.random() - 0.5) * fireWidth * 0.8
        this.y = fireBaseY - Math.random() * 50
        this.vx = (Math.random() - 0.5) * 2
        this.vy = -2 - Math.random() * 4
        this.life = 1
        this.decay = 0.01 + Math.random() * 0.02
        this.size = 1 + Math.random() * 2.5
        this.brightness = 0.7 + Math.random() * 0.3
        this.twinkleSpeed = 0.2 + Math.random() * 0.3
        this.twinklePhase = Math.random() * Math.PI * 2
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.vy += 0.02 // slight gravity
        this.vx *= 0.99
        this.life -= this.decay
        this.twinklePhase += this.twinkleSpeed
        
        // Wind drift
        this.vx += (Math.random() - 0.5) * 0.1

        return this.life > 0 && this.y > -20
      }

      draw() {
        const twinkle = 0.5 + Math.sin(this.twinklePhase) * 0.5
        const alpha = this.life * this.brightness * twinkle

        ctx.globalCompositeOperation = 'lighter'
        
        // Glow
        const glowGrad = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size * 4
        )
        glowGrad.addColorStop(0, `rgba(255, 180, 50, ${alpha * 0.6})`)
        glowGrad.addColorStop(0.5, `rgba(255, 100, 20, ${alpha * 0.2})`)
        glowGrad.addColorStop(1, 'rgba(255, 50, 0, 0)')
        
        ctx.fillStyle = glowGrad
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2)
        ctx.fill()

        // Bright core
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Smoke particle rising from fire
    class Smoke {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = fireX + (Math.random() - 0.5) * fireWidth * 0.5
        this.originX = this.x
        this.y = fireBaseY - 80 - Math.random() * 40
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = -0.3 - Math.random() * 0.5
        this.life = 1
        this.decay = 0.003 + Math.random() * 0.004
        this.size = 15 + Math.random() * 20
        this.maxSize = 50 + Math.random() * 30
        this.turbPhase = Math.random() * Math.PI * 2
        this.turbSpeed = 0.02 + Math.random() * 0.02
        this.rotation = Math.random() * Math.PI * 2
        this.rotSpeed = (Math.random() - 0.5) * 0.02
      }

      update() {
        this.turbPhase += this.turbSpeed
        this.x = this.originX + Math.sin(this.turbPhase) * 30 * (1 - this.life)
        this.originX += this.vx
        this.y += this.vy
        this.life -= this.decay
        this.size = this.size + (this.maxSize - this.size) * 0.02
        this.rotation += this.rotSpeed

        return this.life > 0 && this.y > -50
      }

      draw() {
        const alpha = this.life * 0.25
        const gray = 40 + (1 - this.life) * 30

        ctx.globalCompositeOperation = 'source-over'
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size)
        grad.addColorStop(0, `rgba(${gray + 20}, ${gray + 20}, ${gray + 25}, ${alpha})`)
        grad.addColorStop(0.5, `rgba(${gray}, ${gray}, ${gray + 5}, ${alpha * 0.6})`)
        grad.addColorStop(1, `rgba(${gray - 10}, ${gray - 10}, ${gray - 5}, 0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(0, 0, this.size, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      }
    }

    let animationId
    let lastTime = 0

    function animate(currentTime) {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      // Dark background with slight fade for trails
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(8, 4, 2, 0.25)'
      ctx.fillRect(0, 0, width, height)

      // Ambient base glow
      const baseGlow = ctx.createRadialGradient(
        fireX, fireBaseY + 10, 0,
        fireX, fireBaseY + 10, 180
      )
      baseGlow.addColorStop(0, 'rgba(255, 100, 20, 0.4)')
      baseGlow.addColorStop(0.3, 'rgba(255, 50, 0, 0.2)')
      baseGlow.addColorStop(0.6, 'rgba(150, 30, 0, 0.1)')
      baseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.globalCompositeOperation = 'lighter'
      ctx.fillStyle = baseGlow
      ctx.beginPath()
      ctx.arc(fireX, fireBaseY + 10, 180, 0, Math.PI * 2)
      ctx.fill()

      // Ground reflection
      const groundGlow = ctx.createLinearGradient(0, fireBaseY, 0, height)
      groundGlow.addColorStop(0, 'rgba(255, 80, 20, 0.3)')
      groundGlow.addColorStop(1, 'rgba(100, 30, 0, 0.1)')
      ctx.fillStyle = groundGlow
      ctx.fillRect(fireX - 100, fireBaseY, 200, height - fireBaseY)

      // Spawn new particles
      if (flames.length < 80) {
        flames.push(new Flame())
        flames.push(new Flame())
      }
      
      if (Math.random() < 0.4 && embers.length < 30) {
        embers.push(new Ember())
      }
      
      if (Math.random() < 0.15 && smoke.length < 15) {
        smoke.push(new Smoke())
      }

      // Update and draw smoke (behind fire)
      ctx.globalCompositeOperation = 'source-over'
      for (let i = smoke.length - 1; i >= 0; i--) {
        if (!smoke[i].update()) {
          smoke.splice(i, 1)
        } else {
          smoke[i].draw()
        }
      }

      // Sort flames by y position for proper layering
      flames.sort((a, b) => b.y - a.y)

      // Update and draw flames
      for (let i = flames.length - 1; i >= 0; i--) {
        if (!flames[i].update(deltaTime)) {
          flames.splice(i, 1)
        } else {
          flames[i].draw()
        }
      }

      // Update and draw embers (on top)
      for (let i = embers.length - 1; i >= 0; i--) {
        if (!embers[i].update()) {
          embers.splice(i, 1)
        } else {
          embers[i].draw()
        }
      }

      ctx.globalCompositeOperation = 'source-over'
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block', 
        background: 'linear-gradient(to bottom, #0a0604 0%, #080402 100%)' 
      }}
    />
  )
}

export default FireSimulation
