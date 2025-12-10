import { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import './LightingDemo.css'

function LightingDemo() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const controlsRef = useRef(null)
  const lightsRef = useRef({})
  const lightSpheresRef = useRef({})
  const draggingRef = useRef(null)
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const planeRef = useRef(new THREE.Plane())

  // Lighting controls state
  const [keyLight, setKeyLight] = useState({ intensity: 1.5, color: '#ffffff', x: 5, y: 5, z: 5 })
  const [fillLight, setFillLight] = useState({ intensity: 0.6, color: '#4fd5ff', x: -5, y: 3, z: 3 })
  const [rimLight, setRimLight] = useState({ intensity: 0.8, color: '#ff4fb8', x: 0, y: -2, z: -5 })
  const [ambientLight, setAmbientLight] = useState({ intensity: 0.3, color: '#404060' })

  // Refs for state setters (to use in event handlers)
  const settersRef = useRef({ setKeyLight, setFillLight, setRimLight })
  useEffect(() => {
    settersRef.current = { setKeyLight, setFillLight, setRimLight }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a12)
    sceneRef.current = scene

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    })
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(4, 3, 8)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Orbit Controls - allows rotating the view
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 4
    controls.maxDistance = 20
    controls.target.set(0, 0, 0)
    controlsRef.current = controls

    const resize = () => {
      const { clientWidth, clientHeight } = container
      if (!clientWidth || !clientHeight) return
      renderer.setSize(clientWidth, clientHeight, false)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
    }
    resize()

    // Create rounded sphere (main object)
    const sphereGeometry = new THREE.SphereGeometry(1.5, 64, 64)
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.8,
    })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    sphere.castShadow = true
    sphere.receiveShadow = true
    scene.add(sphere)

    // Floor for shadows
    const floorGeometry = new THREE.PlaneGeometry(20, 20)
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x111122,
      roughness: 0.8,
      metalness: 0.2,
    })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -2
    floor.receiveShadow = true
    scene.add(floor)

    // Ambient light
    const ambient = new THREE.AmbientLight(0x404060, 0.3)
    scene.add(ambient)
    lightsRef.current.ambient = ambient

    // Helper function to create draggable light sphere
    const createLightSphere = (color, position, name) => {
      const geo = new THREE.SphereGeometry(0.3, 16, 16)
      const mat = new THREE.MeshBasicMaterial({ 
        color, 
        transparent: true, 
        opacity: 0.8 
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(position)
      mesh.userData.lightName = name
      mesh.userData.isDraggable = true
      scene.add(mesh)
      return mesh
    }

    // Key light (main light)
    const key = new THREE.DirectionalLight(0xffffff, 1.5)
    key.position.set(5, 5, 5)
    key.castShadow = true
    key.shadow.mapSize.width = 1024
    key.shadow.mapSize.height = 1024
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 50
    scene.add(key)
    lightsRef.current.key = key
    lightSpheresRef.current.key = createLightSphere(0xffdd77, key.position, 'key')

    // Fill light
    const fill = new THREE.DirectionalLight(0x4fd5ff, 0.6)
    fill.position.set(-5, 3, 3)
    scene.add(fill)
    lightsRef.current.fill = fill
    lightSpheresRef.current.fill = createLightSphere(0x4fd5ff, fill.position, 'fill')

    // Rim light (back light)
    const rim = new THREE.DirectionalLight(0xff4fb8, 0.8)
    rim.position.set(0, -2, -5)
    scene.add(rim)
    lightsRef.current.rim = rim
    lightSpheresRef.current.rim = createLightSphere(0xff4fb8, rim.position, 'rim')

    // Dragging logic
    const onPointerDown = (event) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, camera)
      const spheres = Object.values(lightSpheresRef.current)
      const intersects = raycasterRef.current.intersectObjects(spheres)

      if (intersects.length > 0) {
        controls.enabled = false
        draggingRef.current = intersects[0].object
        planeRef.current.setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(new THREE.Vector3()),
          draggingRef.current.position
        )
        canvas.style.cursor = 'grabbing'
      }
    }

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      if (draggingRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera)
        const intersectPoint = new THREE.Vector3()
        raycasterRef.current.ray.intersectPlane(planeRef.current, intersectPoint)
        
        if (intersectPoint) {
          draggingRef.current.position.copy(intersectPoint)
          const lightName = draggingRef.current.userData.lightName
          const light = lightsRef.current[lightName]
          if (light) {
            light.position.copy(intersectPoint)
            // Update state
            const pos = { x: intersectPoint.x, y: intersectPoint.y, z: intersectPoint.z }
            if (lightName === 'key') {
              settersRef.current.setKeyLight(prev => ({ ...prev, ...pos }))
            } else if (lightName === 'fill') {
              settersRef.current.setFillLight(prev => ({ ...prev, ...pos }))
            } else if (lightName === 'rim') {
              settersRef.current.setRimLight(prev => ({ ...prev, ...pos }))
            }
          }
        }
      } else {
        // Hover effect
        raycasterRef.current.setFromCamera(mouseRef.current, camera)
        const spheres = Object.values(lightSpheresRef.current)
        const intersects = raycasterRef.current.intersectObjects(spheres)
        canvas.style.cursor = intersects.length > 0 ? 'grab' : 'default'
      }
    }

    const onPointerUp = () => {
      if (draggingRef.current) {
        draggingRef.current = null
        controls.enabled = true
        canvas.style.cursor = 'default'
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointerleave', onPointerUp)

    // Animation
    let animationFrameId
    const animate = () => {
      controls.update()
      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerUp)
      controls.dispose()
      renderer.dispose()
      sphereGeometry.dispose()
      sphereMaterial.dispose()
      floorGeometry.dispose()
      floorMaterial.dispose()
    }
  }, [])

  // Update lights when controls change
  useEffect(() => {
    if (!lightsRef.current.key) return
    const key = lightsRef.current.key
    key.intensity = keyLight.intensity
    key.color.set(keyLight.color)
    key.position.set(keyLight.x, keyLight.y, keyLight.z)
    // Sync draggable sphere position
    if (lightSpheresRef.current.key) {
      lightSpheresRef.current.key.position.set(keyLight.x, keyLight.y, keyLight.z)
    }
  }, [keyLight])

  useEffect(() => {
    if (!lightsRef.current.fill) return
    const fill = lightsRef.current.fill
    fill.intensity = fillLight.intensity
    fill.color.set(fillLight.color)
    fill.position.set(fillLight.x, fillLight.y, fillLight.z)
    // Sync draggable sphere position
    if (lightSpheresRef.current.fill) {
      lightSpheresRef.current.fill.position.set(fillLight.x, fillLight.y, fillLight.z)
    }
  }, [fillLight])

  useEffect(() => {
    if (!lightsRef.current.rim) return
    const rim = lightsRef.current.rim
    rim.intensity = rimLight.intensity
    rim.color.set(rimLight.color)
    rim.position.set(rimLight.x, rimLight.y, rimLight.z)
    // Sync draggable sphere position
    if (lightSpheresRef.current.rim) {
      lightSpheresRef.current.rim.position.set(rimLight.x, rimLight.y, rimLight.z)
    }
  }, [rimLight])

  useEffect(() => {
    if (!lightsRef.current.ambient) return
    lightsRef.current.ambient.intensity = ambientLight.intensity
    lightsRef.current.ambient.color.set(ambientLight.color)
  }, [ambientLight])

  return (
    <div className="lighting-demo">
      {/* Container 1: Demonstration Area */}
      <div className="lighting-demo-container">
        <div className="container-header">
          <span className="container-title">3D Preview</span>
          <span className="container-hint">Drag to rotate • Drag light spheres to move</span>
        </div>
        <div ref={containerRef} className="lighting-viewport">
          <canvas ref={canvasRef} className="lighting-canvas" />
        </div>
      </div>

      {/* Container 2: Light Controls */}
      <div className="lighting-controls-container">
        <div className="container-header">
          <span className="container-title">Light Controls</span>
        </div>
        <div className="controls-content">
          <div className="light-control-group" data-light="key">
            <h4>Key Light</h4>
            <label>
              <span className="label-text">Intensity</span>
              <input type="range" min="0" max="3" step="0.1" value={keyLight.intensity}
                onChange={(e) => setKeyLight({ ...keyLight, intensity: parseFloat(e.target.value) })} />
              <span className="value">{keyLight.intensity.toFixed(1)}</span>
            </label>
            <label>
              <span className="label-text">Color</span>
              <input type="color" value={keyLight.color}
                onChange={(e) => setKeyLight({ ...keyLight, color: e.target.value })} />
            </label>
            <label>
              <span className="label-text">X</span>
              <input type="range" min="-10" max="10" step="0.5" value={keyLight.x}
                onChange={(e) => setKeyLight({ ...keyLight, x: parseFloat(e.target.value) })} />
            </label>
            <label>
              <span className="label-text">Y</span>
              <input type="range" min="-10" max="10" step="0.5" value={keyLight.y}
                onChange={(e) => setKeyLight({ ...keyLight, y: parseFloat(e.target.value) })} />
            </label>
            <label>
              <span className="label-text">Z</span>
              <input type="range" min="-10" max="10" step="0.5" value={keyLight.z}
                onChange={(e) => setKeyLight({ ...keyLight, z: parseFloat(e.target.value) })} />
            </label>
          </div>

          <div className="light-control-group" data-light="fill">
            <h4>Fill Light</h4>
            <label>
              <span className="label-text">Intensity</span>
              <input type="range" min="0" max="3" step="0.1" value={fillLight.intensity}
                onChange={(e) => setFillLight({ ...fillLight, intensity: parseFloat(e.target.value) })} />
              <span className="value">{fillLight.intensity.toFixed(1)}</span>
            </label>
            <label>
              <span className="label-text">Color</span>
              <input type="color" value={fillLight.color}
                onChange={(e) => setFillLight({ ...fillLight, color: e.target.value })} />
            </label>
            <label>
              <span className="label-text">X</span>
              <input type="range" min="-10" max="10" step="0.5" value={fillLight.x}
                onChange={(e) => setFillLight({ ...fillLight, x: parseFloat(e.target.value) })} />
            </label>
            <label>
              <span className="label-text">Y</span>
              <input type="range" min="-10" max="10" step="0.5" value={fillLight.y}
                onChange={(e) => setFillLight({ ...fillLight, y: parseFloat(e.target.value) })} />
            </label>
            <label>
              <span className="label-text">Z</span>
              <input type="range" min="-10" max="10" step="0.5" value={fillLight.z}
                onChange={(e) => setFillLight({ ...fillLight, z: parseFloat(e.target.value) })} />
            </label>
          </div>

          <div className="light-control-group" data-light="rim">
            <h4>Rim Light</h4>
            <label>
              <span className="label-text">Intensity</span>
              <input type="range" min="0" max="3" step="0.1" value={rimLight.intensity}
                onChange={(e) => setRimLight({ ...rimLight, intensity: parseFloat(e.target.value) })} />
              <span className="value">{rimLight.intensity.toFixed(1)}</span>
            </label>
            <label>
              <span className="label-text">Color</span>
              <input type="color" value={rimLight.color}
                onChange={(e) => setRimLight({ ...rimLight, color: e.target.value })} />
            </label>
            <label>
              <span className="label-text">X</span>
              <input type="range" min="-10" max="10" step="0.5" value={rimLight.x}
                onChange={(e) => setRimLight({ ...rimLight, x: parseFloat(e.target.value) })} />
            </label>
            <label>
              <span className="label-text">Y</span>
              <input type="range" min="-10" max="10" step="0.5" value={rimLight.y}
                onChange={(e) => setRimLight({ ...rimLight, y: parseFloat(e.target.value) })} />
            </label>
            <label>
              <span className="label-text">Z</span>
              <input type="range" min="-10" max="10" step="0.5" value={rimLight.z}
                onChange={(e) => setRimLight({ ...rimLight, z: parseFloat(e.target.value) })} />
            </label>
          </div>

          <div className="light-control-group" data-light="ambient">
            <h4>Ambient</h4>
            <label>
              <span className="label-text">Intensity</span>
              <input type="range" min="0" max="1" step="0.05" value={ambientLight.intensity}
                onChange={(e) => setAmbientLight({ ...ambientLight, intensity: parseFloat(e.target.value) })} />
              <span className="value">{ambientLight.intensity.toFixed(2)}</span>
            </label>
            <label>
              <span className="label-text">Color</span>
              <input type="color" value={ambientLight.color}
                onChange={(e) => setAmbientLight({ ...ambientLight, color: e.target.value })} />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LightingDemo
