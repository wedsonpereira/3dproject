import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function FloatingWireCube() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const scene = new THREE.Scene()
    scene.background = null

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })

    const size = 4
    const camera = new THREE.OrthographicCamera(-size, size, size, -size, 0.1, 100)
    camera.position.set(0, 0, 10)
    camera.lookAt(0, 0, 0)

    const resize = () => {
      const { clientWidth, clientHeight } = container
      if (!clientWidth || !clientHeight) return
      renderer.setSize(clientWidth, clientHeight, false)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      const aspect = clientWidth / clientHeight
      camera.left = -size * aspect
      camera.right = size * aspect
      camera.top = size
      camera.bottom = -size
      camera.updateProjectionMatrix()
    }

    resize()

    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)

    const key = new THREE.DirectionalLight(0x4fd5ff, 0.9)
    key.position.set(4, 6, 8)
    scene.add(key)

    const geo = new THREE.BoxGeometry(3, 3, 3)
    const edges = new THREE.EdgesGeometry(geo)
    const mat = new THREE.LineBasicMaterial({ color: 0x4fd5ff, transparent: true, opacity: 0.9 })
    const cube = new THREE.LineSegments(edges, mat)
    scene.add(cube)

    let frameId
    const clock = new THREE.Clock()

    const animate = () => {
      const t = clock.getElapsedTime()
      cube.rotation.x = t * 0.35
      cube.rotation.y = t * 0.55

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    animate()

    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      renderer.dispose()
      geo.dispose()
      edges.dispose()
      mat.dispose()
    }
  }, [])

  return (
    <div ref={containerRef} className="floating-wire-cube">
      <canvas ref={canvasRef} className="floating-wire-cube-canvas" />
    </div>
  )
}

export default FloatingWireCube
