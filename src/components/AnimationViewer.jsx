import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

function AnimationViewer() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentFrame, setCurrentFrame] = useState(0)
  const ballsRef = useRef([])
  const cubesRef = useRef([])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return undefined

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0e27)
    scene.fog = new THREE.Fog(0x0a0e27, 8, 20)

    // Grid
    const gridHelper = new THREE.GridHelper(12, 24, 0x00ffff, 0x1a2540)
    gridHelper.material.opacity = 0.4
    gridHelper.material.transparent = true
    scene.add(gridHelper)

    // Add platform
    const platformGeo = new THREE.BoxGeometry(10, 0.2, 10)
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x1a2540,
      metalness: 0.8,
      roughness: 0.2,
    })
    const platform = new THREE.Mesh(platformGeo, platformMat)
    platform.position.y = -0.1
    scene.add(platform)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(3, 2, 3)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enablePan = false
    controls.minDistance = 2
    controls.maxDistance = 8
    controls.target.set(0, 0.8, 0)

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    const key = new THREE.DirectionalLight(0xffffff, 1.2)
    key.position.set(5, 10, 5)
    key.castShadow = true
    const fill = new THREE.DirectionalLight(0x00ffff, 0.6)
    fill.position.set(-5, 5, 5)
    const rim = new THREE.DirectionalLight(0xff00ff, 0.4)
    rim.position.set(-3, 3, -5)
    const accent = new THREE.PointLight(0x00ff80, 1, 10)
    accent.position.set(0, 3, 0)
    scene.add(ambient, key, fill, rim, accent)

    // Create central morphing torus knot
    const balls = []
    const torusGeo = new THREE.TorusKnotGeometry(0.8, 0.3, 100, 16)
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x00ffff,
      emissiveIntensity: 0.3,
    })
    const torusKnot = new THREE.Mesh(torusGeo, torusMat)
    torusKnot.position.y = 2
    scene.add(torusKnot)
    balls.push({ mesh: torusKnot, type: 'torus' })

    // Create orbiting rings
    const cubes = []
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(1.5 + i * 0.5, 0.08, 16, 100)
      const ringMat = new THREE.MeshStandardMaterial({
        color: [0x00ffff, 0xff00ff, 0x00ff80][i],
        metalness: 0.8,
        roughness: 0.2,
        emissive: [0x00ffff, 0xff00ff, 0x00ff80][i],
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.7,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.y = 2
      scene.add(ring)
      cubes.push({
        mesh: ring,
        type: 'ring',
        rotSpeed: 0.3 + i * 0.2,
        tiltAngle: (i * Math.PI) / 3,
      })
    }

    // Create particle system
    const particleCount = 200
    const particlesGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 1 + Math.random() * 2
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.random() * 4
      positions[i * 3 + 2] = Math.sin(angle) * radius

      const colorChoice = Math.floor(Math.random() * 3)
      if (colorChoice === 0) {
        colors[i * 3] = 0
        colors[i * 3 + 1] = 1
        colors[i * 3 + 2] = 1
      } else if (colorChoice === 1) {
        colors[i * 3] = 1
        colors[i * 3 + 1] = 0
        colors[i * 3 + 2] = 1
      } else {
        colors[i * 3] = 0
        colors[i * 3 + 1] = 1
        colors[i * 3 + 2] = 0.5
      }

      sizes[i] = Math.random() * 0.05 + 0.02
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    particlesGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const particlesMat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(particlesGeo, particlesMat)
    scene.add(particles)
    cubes.push({ mesh: particles, type: 'particles' })

    ballsRef.current = balls
    cubesRef.current = cubes

    const resize = () => {
      const { clientWidth, clientHeight } = container
      if (!clientWidth || !clientHeight) return
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }

    resize()
    window.addEventListener('resize', resize)

    let time = 0
    let frameId

    const animate = () => {
      if (isPlaying) {
        time += 0.016
        setCurrentFrame(Math.floor((time * 24) % 120))

        // Animate central torus knot
        ballsRef.current.forEach((ballData) => {
          const { mesh, type } = ballData
          if (type === 'torus') {
            // Rotate and morph
            mesh.rotation.x += 0.01
            mesh.rotation.y += 0.015
            mesh.rotation.z += 0.008
            
            // Pulsing scale
            const pulse = Math.sin(time * 2) * 0.1 + 1
            mesh.scale.set(pulse, pulse, pulse)
            
            // Float up and down
            mesh.position.y = 2 + Math.sin(time * 0.8) * 0.3
          }
        })

        // Animate rings and particles
        cubesRef.current.forEach((cubeData) => {
          const { mesh, type, rotSpeed, tiltAngle } = cubeData
          
          if (type === 'ring') {
            // Rotate rings on different axes
            mesh.rotation.x = Math.sin(time * 0.5) * 0.5 + tiltAngle
            mesh.rotation.y += 0.01 * rotSpeed
            mesh.rotation.z = Math.cos(time * 0.3) * 0.3
            
            // Pulse opacity
            mesh.material.opacity = 0.5 + Math.sin(time * 2 + tiltAngle) * 0.2
          } else if (type === 'particles') {
            // Rotate particle system
            mesh.rotation.y += 0.002
            
            // Animate particles
            const positions = mesh.geometry.attributes.position.array
            for (let i = 0; i < positions.length; i += 3) {
              const angle = time * 0.5 + i * 0.01
              const radius = 1 + Math.sin(time + i * 0.1) * 0.5
              positions[i] = Math.cos(angle) * radius
              positions[i + 1] += Math.sin(time * 2 + i * 0.05) * 0.01
              positions[i + 2] = Math.sin(angle) * radius
              
              // Keep particles in bounds
              if (positions[i + 1] > 4) positions[i + 1] = 0
              if (positions[i + 1] < 0) positions[i + 1] = 4
            }
            mesh.geometry.attributes.position.needsUpdate = true
          }
        })
      }

      controls.update()
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      controls.dispose()
      renderer.dispose()
      scene.clear()
    }
  }, [isPlaying])

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div ref={containerRef} className="animation-viewer">
      <canvas ref={canvasRef} className="animation-viewer-canvas" />
    </div>
  )
}

export default AnimationViewer
