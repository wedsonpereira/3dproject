import { useEffect, useRef } from 'react'

function SmokeSimulation() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    const particles = []

    class SmokeParticle {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = width / 2 + (Math.random() - 0.5) * 40
        this.baseX = this.x
        this.y = height + 30
        this.vy = -0.5 - Math.random() * 1.2
        this.vx = (Math.random() - 0.5) * 0.3
        this.life = 1
        this.decay = 0.002 + Math.random() * 0.003
        this.size = 20 + Math.random() * 30
        this.maxSize = 80 + Math.random() * 60
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.01
        this.turbulencePhase = Math.random() * Math.PI * 2
        this.turbulenceSpeed = 0.01 + Math.random() * 0.02
        this.turbulenceAmp = 20 + Math.random() * 30
        this.opacity = 0.4 + Math.random() * 0.3
        this.gray = 60 + Math.random() * 40
      }

      update() {
        this.turbulencePhase += this.turbulenceSpeed
        this.x = this.baseX + Math.sin(this.turbulencePhase) * this.turbulenceAmp * (1 - this.life)
        this.baseX += this.vx
        this.y += this.vy
        this.vy *= 0.998
        this.life -= this.decay
        this.rotation += this.rotationSpeed
        
        // Grow as it rises
        const growthFactor = 1 - this.life
        this.size = 20 + growthFactor * this.maxSize

        return this.life > 0 && this.y > -100
      }

      draw() {
        const alpha = Math.pow(this.life, 0.7) * this.opacity
        const gray = this.gray + (1 - this.life) * 60

        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)
        ctx.globalAlpha = alpha

        // Multiple overlapping circles for fluffy effect
        for (let i = 0; i < 4; i++) {
          const offsetX = Math.cos(i * Math.PI / 2) * this.size * 0.3
          const offsetY = Math.sin(i * Math.PI / 2) * this.size * 0.3
          const layerSize = this.size * (0.6 + i * 0.15)

          const gradient = ctx.createRadialGradient(
            offsetX, offsetY, 0,
            offsetX, offsetY, layerSize
          )
          gradient.addColorStop(0, `rgba(${gray + 30}, ${gray + 30}, ${gray + 35}, 0.8)`)
          gradient.addColorStop(0.3, `rgba(${gray + 10}, ${gray + 10}, ${gray + 15}, 0.5)`)
          gradient.addColorStop(0.6, `rgba(${gray}, ${gray}, ${gray + 5}, 0.3)`)
          gradient.addColorStop(1, `rgba(${gray - 20}, ${gray - 20}, ${gray - 15}, 0)`)

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(offsetX, offsetY, layerSize, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      }
    }

    // Initialize particles at different heights
    for (let i = 0; i < 40; i++) {
      const p = new SmokeParticle()
      p.y = height - (i / 40) * height * 1.5
      p.life = 0.3 + Math.random() * 0.7
      p.size = 20 + (1 - p.life) * p.maxSize
      particles.push(p)
    }

    let animationId

    function animate() {
      // Subtle fade for trails
      ctx.fillStyle = 'rgba(15, 18, 25, 0.08)'
      ctx.fillRect(0, 0, width, height)

      // Spawn new particles
      if (particles.length < 50 && Math.random() < 0.3) {
        particles.push(new SmokeParticle())
      }

      // Sort by y for proper layering (back to front)
      particles.sort((a, b) => b.y - a.y)

      // Update and draw
      for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
          particles.splice(i, 1)
        }
      }

      for (const p of particles) {
        p.draw()
      }

      // Subtle ambient glow at source
      const sourceGlow = ctx.createRadialGradient(
        width / 2, height + 30, 0,
        width / 2, height + 30, 80
      )
      sourceGlow.addColorStop(0, 'rgba(100, 100, 110, 0.3)')
      sourceGlow.addColorStop(1, 'rgba(50, 50, 60, 0)')
      ctx.fillStyle = sourceGlow
      ctx.fillRect(width / 2 - 80, height - 50, 160, 80)

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      style={{ width: '100%', height: '100%', display: 'block', background: '#0f1219' }}
    />
  )
}

export default SmokeSimulation
