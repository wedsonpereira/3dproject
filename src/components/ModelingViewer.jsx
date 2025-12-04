import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import ladkiModel from '../assets/ladki.glb?url'

function ModelingViewer() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const modelRef = useRef(null)
  const mixerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return undefined

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0e27)

    // Circular base/pedestal for the model
    const baseGeometry = new THREE.CylinderGeometry(1.2, 1.4, 0.15, 64)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2540,
      metalness: 0.8,
      roughness: 0.3,
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.y = -0.075
    base.receiveShadow = true
    scene.add(base)

    // Glowing ring around base
    const ringGeometry = new THREE.TorusGeometry(1.3, 0.03, 16, 100)
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x4fd5ff,
      emissive: 0x4fd5ff,
      emissiveIntensity: 0.5,
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.01
    scene.add(ring)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Camera
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 1.5, 4)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.enablePan = true
    controls.minDistance = 1
    controls.maxDistance = 10
    controls.target.set(0, 1, 0)

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.0)
    scene.add(ambient)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0)
    keyLight.position.set(5, 10, 7)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x4fd5ff, 0.8)
    fillLight.position.set(-5, 5, 5)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xff4fb8, 0.5)
    rimLight.position.set(0, 3, -5)
    scene.add(rimLight)

    // Ground plane for shadows
    const groundGeo = new THREE.PlaneGeometry(20, 20)
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.3 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Load GLB model
    const loader = new GLTFLoader()
    loader.load(
      ladkiModel,
      (gltf) => {
        const model = gltf.scene
        modelRef.current = model

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        // Scale to fit nicely in view (target height ~2 units)
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim
        model.scale.setScalar(scale)

        // Recalculate after scaling
        box.setFromObject(model)
        box.getCenter(center)

        // Position model so feet are on ground
        model.position.x = -center.x
        model.position.z = -center.z
        model.position.y = -box.min.y

        // Enable shadows
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })

        scene.add(model)

        // Handle animations if present
        if (gltf.animations && gltf.animations.length > 0) {
          mixerRef.current = new THREE.AnimationMixer(model)
          const action = mixerRef.current.clipAction(gltf.animations[0])
          action.play()
        }

        // Update camera target to model center
        controls.target.set(0, size.y * scale / 2, 0)
        controls.update()

        setIsLoading(false)
      },
      (progress) => {
        // Loading progress
        console.log('Loading:', (progress.loaded / progress.total * 100).toFixed(0) + '%')
      },
      (error) => {
        console.error('Error loading model:', error)
        setIsLoading(false)
      }
    )

    // Resize handler
    const resize = () => {
      const { clientWidth, clientHeight } = container
      if (!clientWidth || !clientHeight) return
      renderer.setSize(clientWidth, clientHeight, false)
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }

    setTimeout(resize, 50)
    window.addEventListener('resize', resize)

    // Animation loop
    const clock = new THREE.Clock()
    let frameId
    const animate = () => {
      frameId = requestAnimationFrame(animate)
      const delta = clock.getDelta()

      if (mixerRef.current) {
        mixerRef.current.update(delta)
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      controls.dispose()
      renderer.dispose()

      if (modelRef.current) {
        modelRef.current.traverse((child) => {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose())
            } else {
              child.material.dispose()
            }
          }
        })
        scene.remove(modelRef.current)
      }

      scene.clear()
    }
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {isLoading && (
        <div className="modeling-viewer-loader">
          <div className="modeling-viewer-spinner" />
          <p>Loading Model...</p>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '0.6rem 1.2rem',
          background: 'rgba(10, 14, 39, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(79, 213, 255, 0.3)',
          borderRadius: '50px',
          color: '#4fd5ff',
          fontSize: '0.75rem',
          fontWeight: '500',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        🖱️ Drag to Rotate • Scroll to Zoom
      </div>
    </div>
  )
}

export default ModelingViewer
