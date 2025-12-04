import { useEffect, useRef } from 'react'

function WaterSimulation() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    const drops = []
    const splashes = []
    const ripples = []
    const poolHeight = 80
    const poolY = height - poolHeight

    // Water drop
    class WaterDrop {
      constructor() {
        this.reset()
      }

      reset() {
        this.x = width / 2 + (Math.random() - 0.5) * 80
        this.y = -20
        this.vy = 6 + Math.random() * 4
        this.vx = (Math.random() - 0.5) * 1
        this.size = 3 + Math.random() * 4
        this.length = 15 + Math.random() * 20
        this.opacity = 0.6 + Math.random() * 0.4
      }

      update() {
        this.y += this.vy
        this.x += this.vx
        this.vy += 0.4 // gravity

        if (this.y >= poolY - 5) {
          // Create splash
          for (let i = 0; i < 5 + Math.random() * 5; i++) {
            splashes.push(new Splash(this.x, poolY))
          }
          // Create ripple
          ripples.push(new Ripple(this.x, poolY + 10))
          this.reset()
        }
        return true
      }

      draw() {
        // Draw elongated drop
        const gradient = ctx.createLinearGradient(
          this.x, this.y - this.length,
          this.x, this.y
        )
        gradient.addColorStop(0, `rgba(180, 220, 255, 0)`)
        gradient.addColorStop(0.3, `rgba(180, 220, 255, ${this.opacity * 0.5})`)
        gradient.addColorStop(1, `rgba(220, 240, 255, ${this.opacity})`)

        ctx.strokeStyle = gradient
        ctx.lineWidth = this.size
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(this.x, this.y - this.length)
        ctx.lineTo(this.x, this.y)
        ctx.stroke()

        // Bright tip
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Splash particle
    class Splash {
      constructor(x, y) {
        this.x = x
        this.y = y
        this.vx = (Math.random() - 0.5) * 6
        this.vy = -3 - Math.random() * 5
        this.size = 1 + Math.random() * 3
        this.life = 1
        this.decay = 0.03 + Math.random() * 0.02
        this.gravity = 0.3
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.vy += this.gravity
        this.vx *= 0.98
        this.life -= this.decay

        // Bounce off pool surface
        if (this.y > poolY && this.vy > 0) {
          this.vy *= -0.3
          this.y = poolY
        }

        return this.life > 0
      }

      draw() {
        const alpha = this.life * 0.8
        ctx.fillStyle = `rgba(200, 230, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2)
        ctx.fill()

        // Highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`
        ctx.beginPath()
        ctx.arc(this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Ripple
    class Ripple {
      constructor(x, y) {
        this.x = x
        this.y = y
        this.radius = 5
        this.maxRadius = 60 + Math.random() * 40
        this.life = 1
        this.speed = 1.5 + Math.random() * 0.5
      }

      update() {
        this.radius += this.speed
        this.life = 1 - (this.radius / this.maxRadius)
        return this.radius < this.maxRadius
      }

      draw() {
        const alpha = this.life * 0.6

        // Outer ring
        ctx.strokeStyle = `rgba(150, 200, 255, ${alpha * 0.5})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(this.x, this.y, this.radius, this.radius * 0.3, 0, 0, Math.PI * 2)
        ctx.stroke()

        // Inner highlight
        ctx.strokeStyle = `rgba(200, 230, 255, ${alpha})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(this.x, this.y, this.radius * 0.7, this.radius * 0.2, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // Initialize drops
    for (let i = 0; i < 8; i++) {
      const drop = new WaterDrop()
      drop.y = Math.random() * height * 0.7
      drops.push(drop)
    }

    let animationId
    let time = 0

    function animate() {
      time += 0.02

      // Clear
      ctx.fillStyle = 'rgba(8, 20, 35, 0.3)'
      ctx.fillRect(0, 0, width, height)

      // Draw pool with waves
      const poolGradient = ctx.createLinearGradient(0, poolY, 0, height)
      poolGradient.addColorStop(0, 'rgba(30, 80, 120, 0.9)')
      poolGradient.addColorStop(0.3, 'rgba(20, 60, 100, 0.95)')
      poolGradient.addColorStop(1, 'rgba(10, 40, 70, 1)')

      ctx.fillStyle = poolGradient
      ctx.beginPath()
      ctx.moveTo(0, poolY)
      
      // Wavy surface
      for (let x = 0; x <= width; x += 10) {
        const waveY = poolY + Math.sin(x * 0.03 + time * 2) * 3 + Math.sin(x * 0.05 + time * 3) * 2
        ctx.lineTo(x, waveY)
      }
      ctx.lineTo(width, height)
      ctx.lineTo(0, height)
      ctx.closePath()
      ctx.fill()

      // Surface highlight
      ctx.strokeStyle = 'rgba(150, 200, 255, 0.4)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let x = 0; x <= width; x += 5) {
        const waveY = poolY + Math.sin(x * 0.03 + time * 2) * 3 + Math.sin(x * 0.05 + time * 3) * 2
        if (x === 0) ctx.moveTo(x, waveY)
        else ctx.lineTo(x, waveY)
      }
      ctx.stroke()

      // Caustics effect on pool
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 5; i++) {
        const cx = (width / 6) * (i + 1) + Math.sin(time + i) * 20
        const cy = poolY + 30 + Math.cos(time * 0.7 + i) * 10
        const causticGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40)
        causticGradient.addColorStop(0, 'rgba(100, 180, 255, 0.15)')
        causticGradient.addColorStop(1, 'rgba(50, 100, 150, 0)')
        ctx.fillStyle = causticGradient
        ctx.fillRect(cx - 40, cy - 20, 80, 40)
      }
      ctx.globalCompositeOperation = 'source-over'

      // Spawn drops
      if (drops.length < 10 && Math.random() < 0.1) {
        drops.push(new WaterDrop())
      }

      // Update and draw ripples (behind drops)
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (!ripples[i].update()) {
          ripples.splice(i, 1)
        } else {
          ripples[i].draw()
        }
      }

      // Update and draw drops
      for (const drop of drops) {
        drop.update()
        drop.draw()
      }

      // Update and draw splashes
      for (let i = splashes.length - 1; i >= 0; i--) {
        if (!splashes[i].update()) {
          splashes.splice(i, 1)
        } else {
          splashes[i].draw()
        }
      }

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
      style={{ width: '100%', height: '100%', display: 'block', background: '#081423' }}
    />
  )
}

export default WaterSimulation
