import { useRef, useEffect } from 'react'
import * as THREE from 'three'

function RobotDemo() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const robotRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0e27)
    scene.fog = new THREE.Fog(0x0a0e27, 10, 50)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    )
    camera.position.set(0, 3, 12)
    camera.lookAt(0, 2, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Mouse interaction variables
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }
    let targetRotationY = 0
    let targetRotationX = 0
    let currentRotationY = 0
    let currentRotationX = 0
    let autoRotate = true
    let mouseIdleTimer = null

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x4a5a8a, 0.5)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1)
    keyLight.position.set(5, 10, 5)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    scene.add(keyLight)

    const rimLight1 = new THREE.PointLight(0x4fd5ff, 1.5, 20)
    rimLight1.position.set(-5, 5, 5)
    scene.add(rimLight1)

    const rimLight2 = new THREE.PointLight(0xff4fb8, 1.2, 20)
    rimLight2.position.set(5, 3, -5)
    scene.add(rimLight2)

    // Create Robot
    const robot = new THREE.Group()
    robotRef.current = robot

    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x4fd5ff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x4fd5ff,
      emissiveIntensity: 0.2
    })

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4fb8,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xff4fb8,
      emissiveIntensity: 0.3
    })

    const darkMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2040,
      metalness: 0.7,
      roughness: 0.3
    })

    // Head
    const headGeometry = new THREE.BoxGeometry(1.2, 1, 1.2)
    const head = new THREE.Mesh(headGeometry, bodyMaterial)
    head.position.y = 3.5
    head.castShadow = true
    robot.add(head)

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16)
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1
    })
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    leftEye.position.set(-0.3, 3.6, 0.6)
    robot.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial)
    rightEye.position.set(0.3, 3.6, 0.6)
    robot.add(rightEye)

    // Antenna
    const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8)
    const antenna = new THREE.Mesh(antennaGeometry, accentMaterial)
    antenna.position.y = 4.25
    robot.add(antenna)

    const antennaBallGeometry = new THREE.SphereGeometry(0.15, 16, 16)
    const antennaBall = new THREE.Mesh(antennaBallGeometry, accentMaterial)
    antennaBall.position.y = 4.6
    robot.add(antennaBall)

    // Torso
    const torsoGeometry = new THREE.BoxGeometry(1.5, 1.8, 1)
    const torso = new THREE.Mesh(torsoGeometry, bodyMaterial)
    torso.position.y = 2
    torso.castShadow = true
    robot.add(torso)

    // Chest panel
    const panelGeometry = new THREE.BoxGeometry(1, 1.2, 0.1)
    const panel = new THREE.Mesh(panelGeometry, accentMaterial)
    panel.position.set(0, 2, 0.51)
    robot.add(panel)

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8)
    
    const leftUpperArm = new THREE.Mesh(armGeometry, darkMaterial)
    leftUpperArm.position.set(-1, 2.3, 0)
    leftUpperArm.castShadow = true
    robot.add(leftUpperArm)

    const rightUpperArm = new THREE.Mesh(armGeometry, darkMaterial)
    rightUpperArm.position.set(1, 2.3, 0)
    rightUpperArm.castShadow = true
    robot.add(rightUpperArm)

    // Forearms
    const leftForearm = new THREE.Mesh(armGeometry, bodyMaterial)
    leftForearm.position.set(-1, 0.8, 0)
    leftForearm.castShadow = true
    robot.add(leftForearm)

    const rightForearm = new THREE.Mesh(armGeometry, bodyMaterial)
    rightForearm.position.set(1, 0.8, 0)
    rightForearm.castShadow = true
    robot.add(rightForearm)

    // Hands
    const handGeometry = new THREE.SphereGeometry(0.25, 16, 16)
    
    const leftHand = new THREE.Mesh(handGeometry, accentMaterial)
    leftHand.position.set(-1, 0, 0)
    leftHand.castShadow = true
    robot.add(leftHand)

    const rightHand = new THREE.Mesh(handGeometry, accentMaterial)
    rightHand.position.set(1, 0, 0)
    rightHand.castShadow = true
    robot.add(rightHand)

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 8)
    
    const leftUpperLeg = new THREE.Mesh(legGeometry, darkMaterial)
    leftUpperLeg.position.set(-0.4, 0.3, 0)
    leftUpperLeg.castShadow = true
    robot.add(leftUpperLeg)

    const rightUpperLeg = new THREE.Mesh(legGeometry, darkMaterial)
    rightUpperLeg.position.set(0.4, 0.3, 0)
    rightUpperLeg.castShadow = true
    robot.add(rightUpperLeg)

    // Lower legs
    const leftLowerLeg = new THREE.Mesh(legGeometry, bodyMaterial)
    leftLowerLeg.position.set(-0.4, -1.2, 0)
    leftLowerLeg.castShadow = true
    robot.add(leftLowerLeg)

    const rightLowerLeg = new THREE.Mesh(legGeometry, bodyMaterial)
    rightLowerLeg.position.set(0.4, -1.2, 0)
    rightLowerLeg.castShadow = true
    robot.add(rightLowerLeg)

    // Feet
    const footGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.6)
    
    const leftFoot = new THREE.Mesh(footGeometry, accentMaterial)
    leftFoot.position.set(-0.4, -2.1, 0.1)
    leftFoot.castShadow = true
    robot.add(leftFoot)

    const rightFoot = new THREE.Mesh(footGeometry, accentMaterial)
    rightFoot.position.set(0.4, -2.1, 0.1)
    rightFoot.castShadow = true
    robot.add(rightFoot)

    robot.position.y = 2
    scene.add(robot)

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1e3f,
      metalness: 0.3,
      roughness: 0.8
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    ground.receiveShadow = true
    scene.add(ground)

    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x4fd5ff, 0x2a3a5a)
    gridHelper.material.opacity = 0.3
    gridHelper.material.transparent = true
    scene.add(gridHelper)

    // Mouse event handlers
    const handleMouseDown = (e) => {
      isDragging = true
      autoRotate = false
      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      }
      renderer.domElement.style.cursor = 'grabbing'
      
      // Clear idle timer
      if (mouseIdleTimer) {
        clearTimeout(mouseIdleTimer)
      }
    }

    const handleMouseMove = (e) => {
      if (!isDragging) return

      const deltaX = e.clientX - previousMousePosition.x
      const deltaY = e.clientY - previousMousePosition.y

      // Update target rotations based on mouse movement
      targetRotationY += deltaX * 0.01
      targetRotationX += deltaY * 0.01

      // Clamp vertical rotation
      targetRotationX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, targetRotationX))

      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      }
    }

    const handleMouseUp = () => {
      isDragging = false
      renderer.domElement.style.cursor = 'grab'
      
      // Resume auto-rotate after 3 seconds of inactivity
      mouseIdleTimer = setTimeout(() => {
        autoRotate = true
      }, 3000)
    }

    const handleMouseLeave = () => {
      if (isDragging) {
        isDragging = false
        renderer.domElement.style.cursor = 'grab'
        
        // Resume auto-rotate after 3 seconds
        mouseIdleTimer = setTimeout(() => {
          autoRotate = true
        }, 3000)
      }
    }

    const handleWheel = (e) => {
      e.preventDefault()
      
      // Zoom in/out with mouse wheel
      const zoomSpeed = 0.1
      const newZ = camera.position.z + (e.deltaY > 0 ? zoomSpeed : -zoomSpeed)
      
      // Clamp zoom distance
      camera.position.z = Math.max(8, Math.min(20, newZ))
    }

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown)
    renderer.domElement.addEventListener('mousemove', handleMouseMove)
    renderer.domElement.addEventListener('mouseup', handleMouseUp)
    renderer.domElement.addEventListener('mouseleave', handleMouseLeave)
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false })
    renderer.domElement.style.cursor = 'grab'

    // Touch events for mobile
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true
        autoRotate = false
        previousMousePosition = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        }
      }
    }

    const handleTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return
      e.preventDefault()

      const deltaX = e.touches[0].clientX - previousMousePosition.x
      const deltaY = e.touches[0].clientY - previousMousePosition.y

      targetRotationY += deltaX * 0.01
      targetRotationX += deltaY * 0.01
      targetRotationX = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, targetRotationX))

      previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    }

    const handleTouchEnd = () => {
      isDragging = false
      mouseIdleTimer = setTimeout(() => {
        autoRotate = true
      }, 3000)
    }

    renderer.domElement.addEventListener('touchstart', handleTouchStart)
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false })
    renderer.domElement.addEventListener('touchend', handleTouchEnd)

    // Animation loop
    let time = 0
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      time += 0.01

      if (robot) {
        // Smooth interpolation for rotations
        currentRotationY += (targetRotationY - currentRotationY) * 0.1
        currentRotationX += (targetRotationX - currentRotationX) * 0.1

        // Apply rotations
        if (autoRotate) {
          // Auto-rotate when not being dragged
          robot.rotation.y = time * 0.2
          robot.rotation.x = 0
        } else {
          // User-controlled rotation
          robot.rotation.y = currentRotationY
          robot.rotation.x = currentRotationX
        }

        // Animate head
        head.rotation.y = Math.sin(time * 0.8) * 0.2
        head.rotation.x = Math.sin(time * 0.5) * 0.1

        // Animate arms
        leftUpperArm.rotation.z = Math.sin(time) * 0.3
        rightUpperArm.rotation.z = -Math.sin(time) * 0.3
        leftForearm.rotation.z = Math.sin(time * 1.2) * 0.2
        rightForearm.rotation.z = -Math.sin(time * 1.2) * 0.2

        // Animate antenna
        antennaBall.scale.setScalar(1 + Math.sin(time * 3) * 0.2)

        // Pulse eyes
        const eyeIntensity = 0.8 + Math.sin(time * 2) * 0.2
        leftEye.material.emissiveIntensity = eyeIntensity
        rightEye.material.emissiveIntensity = eyeIntensity
      }

      // Animate lights
      rimLight1.intensity = 1.5 + Math.sin(time * 1.5) * 0.3
      rimLight2.intensity = 1.2 + Math.cos(time * 1.8) * 0.3

      // Camera follows robot when auto-rotating, stays fixed when dragging
      if (autoRotate) {
        camera.position.x = Math.sin(time * 0.2) * 2
        camera.position.y = 3 + Math.sin(time * 0.15) * 0.5
      }
      camera.lookAt(0, 2, 0)

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      
      // Remove mouse event listeners
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('mousedown', handleMouseDown)
        renderer.domElement.removeEventListener('mousemove', handleMouseMove)
        renderer.domElement.removeEventListener('mouseup', handleMouseUp)
        renderer.domElement.removeEventListener('mouseleave', handleMouseLeave)
        renderer.domElement.removeEventListener('wheel', handleWheel)
        renderer.domElement.removeEventListener('touchstart', handleTouchStart)
        renderer.domElement.removeEventListener('touchmove', handleTouchMove)
        renderer.domElement.removeEventListener('touchend', handleTouchEnd)
      }
      
      // Clear timers
      if (mouseIdleTimer) {
        clearTimeout(mouseIdleTimer)
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
    }
  }, [])

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        borderRadius: '1.5rem',
        overflow: 'hidden'
      }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Interactive hint overlay */}
      <div 
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '0.8rem 1.5rem',
          background: 'rgba(10, 14, 39, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(79, 213, 255, 0.4)',
          borderRadius: '50px',
          color: '#4fd5ff',
          fontSize: '0.85rem',
          fontWeight: '600',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(79, 213, 255, 0.3)',
          animation: 'fadeInOut 3s ease-in-out infinite'
        }}
      >
        <span style={{ marginRight: '0.5rem' }}>🖱️</span>
        Drag to Rotate • Scroll to Zoom
      </div>
      
      <style>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default RobotDemo
