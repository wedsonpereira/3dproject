import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

function HeroCubes() {
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

    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const frustumSize = 4
    const camera = new THREE.OrthographicCamera(
      -frustumSize / 2,
      frustumSize / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    )
    camera.position.set(0, 0, 10)
    camera.lookAt(0, 0, 0)

    const resize = () => {
      const { clientWidth, clientHeight } = container
      if (!clientWidth || !clientHeight) return
      renderer.setSize(clientWidth, clientHeight, false)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      const aspect = clientWidth / clientHeight
      const halfW = (frustumSize * aspect) / 2
      const halfH = frustumSize / 2
      camera.left = -halfW
      camera.right = halfW
      camera.top = halfH
      camera.bottom = -halfH
      camera.updateProjectionMatrix()
    }

    resize()

    // Lighting for glass effect
    const ambient = new THREE.AmbientLight(0x404060, 0.5)
    scene.add(ambient)

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5)
    keyLight.position.set(5, 5, 10)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x4fd5ff, 0.8)
    fillLight.position.set(-5, 3, 5)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight(0xff4fb8, 0.6)
    rimLight.position.set(0, -3, -5)
    scene.add(rimLight)

    // Arrays to hold cubes and shards
    const cubes = []
    const shards = []

    // Very rounded cube geometry - almost inflated look
    const cubeGeometry = new RoundedBoxGeometry(1, 1, 1, 8, 0.2)

    // Crystal clear glass with prismatic rainbow refractions
    const createGlassSpellMaterial = (seed = 0) => {
      return new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSeed: { value: seed },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vPosition;
          varying vec3 vWorldNormal;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            vPosition = position;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uSeed;
          
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          varying vec3 vPosition;
          varying vec3 vWorldNormal;

          void main() {
            vec3 normal = normalize(vNormal);
            vec3 worldNormal = normalize(vWorldNormal);
            vec3 viewDir = normalize(vViewPosition);
            
            // Fresnel - bright at edges
            float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.5);
            
            float time = uTime * 0.15 + uSeed;
            
            // === FACE COLORS - like reference image ===
            vec3 cyan = vec3(0.0, 0.85, 0.8);
            vec3 teal = vec3(0.15, 0.7, 0.65);
            vec3 magenta = vec3(0.85, 0.2, 0.55);
            vec3 pink = vec3(0.9, 0.4, 0.55);
            vec3 purple = vec3(0.45, 0.25, 0.75);
            vec3 blue = vec3(0.3, 0.4, 0.85);
            vec3 darkBlue = vec3(0.12, 0.15, 0.35);
            
            // Determine dominant face direction
            float absX = abs(worldNormal.x);
            float absY = abs(worldNormal.y);
            float absZ = abs(worldNormal.z);
            float maxAbs = max(absX, max(absY, absZ));
            
            // === ASSIGN COLOR PER FACE ===
            vec3 faceColor = vec3(0.0);
            
            // +Y face (top) - cyan/teal
            faceColor += cyan * smoothstep(0.6, 1.0, worldNormal.y);
            // -Y face (bottom) - purple/blue
            faceColor += purple * smoothstep(0.6, 1.0, -worldNormal.y);
            // +X face - magenta/pink
            faceColor += magenta * smoothstep(0.6, 1.0, worldNormal.x);
            // -X face - blue
            faceColor += blue * smoothstep(0.6, 1.0, -worldNormal.x);
            // +Z face - teal/cyan mix
            faceColor += teal * smoothstep(0.6, 1.0, worldNormal.z);
            // -Z face - purple/magenta mix
            faceColor += mix(purple, magenta, 0.5) * smoothstep(0.6, 1.0, -worldNormal.z);
            
            // === DARK CENTER ON EACH FACE ===
            // The center of each face is darker (deep blue/purple tint)
            float faceCenterDark = pow(maxAbs, 3.0) * 0.5;
            faceColor = mix(faceColor, darkBlue, faceCenterDark * (1.0 - fresnel));
            
            // === BRIGHT EDGES WHERE FACES MEET ===
            // Edges are where no single normal dominates
            float edgeBrightness = 1.0 - pow(maxAbs, 1.5);
            edgeBrightness = smoothstep(0.0, 0.4, edgeBrightness);
            
            // Edge color shifts between adjacent face colors
            vec3 edgeColor = mix(cyan, magenta, sin(time + worldNormal.x * 3.0) * 0.5 + 0.5);
            edgeColor = mix(edgeColor, pink, sin(time * 0.7 + worldNormal.y * 2.0) * 0.5 + 0.5);
            faceColor = mix(faceColor, edgeColor * 1.3, edgeBrightness);
            
            // === FRESNEL EDGE GLOW ===
            // Outer edges of cube glow bright
            vec3 fresnelColor = mix(cyan, magenta, sin(time * 0.5 + worldNormal.z) * 0.5 + 0.5);
            faceColor = mix(faceColor, fresnelColor * 1.2, fresnel * 0.6);
            
            // === GLOSSY SPECULAR HIGHLIGHTS ===
            vec3 L1 = normalize(vec3(1.5, 2.0, 1.0));
            vec3 L2 = normalize(vec3(-1.2, 1.0, 1.5));
            vec3 L3 = normalize(vec3(0.3, -0.8, 1.8));
            vec3 L4 = normalize(vec3(-0.5, 0.3, -1.0));
            
            float spec1 = pow(max(dot(reflect(-L1, normal), viewDir), 0.0), 50.0);
            float spec2 = pow(max(dot(reflect(-L2, normal), viewDir), 0.0), 35.0);
            float spec3 = pow(max(dot(reflect(-L3, normal), viewDir), 0.0), 25.0);
            float spec4 = pow(max(dot(reflect(-L4, normal), viewDir), 0.0), 20.0);
            
            vec3 specular = vec3(1.0) * spec1 * 1.3;
            specular += vec3(0.95, 0.98, 1.0) * spec2 * 0.9;
            specular += vec3(1.0, 0.96, 0.98) * spec3 * 0.6;
            specular += vec3(0.98, 1.0, 1.0) * spec4 * 0.4;
            
            // === COMBINE ===
            vec3 finalColor = faceColor;
            finalColor += specular;
            
            // Alpha
            float alpha = 0.85 + fresnel * 0.1 + (spec1 + spec2) * 0.1;
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    }

    // Shard material
    const createShardMaterial = (baseColor) => {
      return new THREE.MeshPhysicalMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0.0,
        transmission: 0.5,
        thickness: 0.2,
        side: THREE.DoubleSide,
      })
    }


    // Create shard geometries
    const shardGeometries = []
    for (let i = 0; i < 10; i++) {
      const geo = new THREE.TetrahedronGeometry(0.08 + Math.random() * 0.06, 0)
      const pos = geo.attributes.position
      for (let j = 0; j < pos.count; j++) {
        pos.setX(j, pos.getX(j) * (0.7 + Math.random() * 0.6))
        pos.setY(j, pos.getY(j) * (0.7 + Math.random() * 0.6))
        pos.setZ(j, pos.getZ(j) * (0.7 + Math.random() * 0.6))
      }
      pos.needsUpdate = true
      geo.computeVertexNormals()
      shardGeometries.push(geo)
    }

    // Shatter a cube into pieces
    const shatterCube = (cube) => {
      const pos = cube.position.clone()
      const shardCount = 40 + Math.floor(Math.random() * 15)
      
      const colors = [
        new THREE.Color(0x00e5ff),
        new THREE.Color(0xb366ff),
        new THREE.Color(0x33ff88),
        new THREE.Color(0xffffff),
        new THREE.Color(0xe0e8ff),
      ]

      for (let i = 0; i < shardCount; i++) {
        const geo = shardGeometries[Math.floor(Math.random() * shardGeometries.length)]
        const color = colors[Math.floor(Math.random() * colors.length)]
        const mat = createShardMaterial(color)
        
        const shard = new THREE.Mesh(geo, mat)
        
        const spread = 0.4
        shard.position.set(
          pos.x + (Math.random() - 0.5) * spread,
          pos.y + (Math.random() - 0.5) * spread,
          pos.z + (Math.random() - 0.5) * spread
        )
        
        shard.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        )
        
        const scale = 0.6 + Math.random() * 0.8
        shard.scale.setScalar(scale)
        
        const dir = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ).normalize()
        
        const speed = 1.5 + Math.random() * 2.5
        
        shard.userData = {
          velocity: dir.multiplyScalar(speed),
          angularVelocity: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 8
          ),
          life: 3.0 + Math.random() * 2.0,
          maxLife: 3.0 + Math.random() * 2.0,
          gravity: -2.0 - Math.random() * 1.0,
        }
        
        scene.add(shard)
        shards.push(shard)
      }
      
      scene.remove(cube)
      cube.geometry.dispose()
      cube.material.dispose()
      const idx = cubes.indexOf(cube)
      if (idx > -1) cubes.splice(idx, 1)
    }

    const checkCollision = (cube1, cube2) => {
      const dist = cube1.position.distanceTo(cube2.position)
      return dist < 0.85
    }

    const bounds = { x: 4.4, y: 3.2, z: 5.0 }
    const physics = { damping: 0.96, bounce: 0.7, maxSpeed: 12 }
    const cubeCount = 8
    const ringRadius = 3.6
    const ringHeight = 2.2

    for (let i = 0; i < cubeCount; i++) {
      const mesh = new THREE.Mesh(cubeGeometry, createGlassSpellMaterial(i * 2.0))

      const angle = (i / cubeCount) * Math.PI * 2
      mesh.position.set(
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringHeight,
        0
      )

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )

      mesh.userData.velocity = new THREE.Vector3(0, 0, 0)
      mesh.userData.baseScale = 0.9
      mesh.userData.targetScale = 0.9
      mesh.userData.alive = true
      mesh.scale.setScalar(mesh.userData.baseScale)

      scene.add(mesh)
      cubes.push(mesh)
    }


    // Interaction
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let hovered = null

    const dragState = {
      object: null,
      dragging: false,
      lastPointer: new THREE.Vector2(),
      lastTime: 0,
      velocity: new THREE.Vector3(),
    }

    const updatePointer = (event) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    const handlePointerMove = (event) => {
      updatePointer(event)

      if (!dragState.dragging) {
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects(cubes)
        const hit = hits[0]?.object ?? null

        if (hit !== hovered) {
          if (hovered && hovered.userData) {
            hovered.userData.targetScale = hovered.userData.baseScale
          }
          hovered = hit
        }

        if (hovered && hovered.userData) {
          hovered.userData.targetScale = hovered.userData.baseScale * 1.15
        }
      }

      if (dragState.dragging && dragState.object) {
        const now = performance.now()
        const dt = (now - dragState.lastTime) / 1000 || 0.016
        const dx = pointer.x - dragState.lastPointer.x
        const dy = pointer.y - dragState.lastPointer.y
        const move = new THREE.Vector3(dx * 4.0, dy * 4.0, 0)

        dragState.object.position.add(move)
        dragState.velocity.copy(move).divideScalar(Math.max(dt, 0.001))
        dragState.lastPointer.copy(pointer)
        dragState.lastTime = now
      }
    }

    const handlePointerDown = (event) => {
      updatePointer(event)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(cubes)
      const hit = hits[0]?.object ?? null

      if (hit) {
        dragState.object = hit
        dragState.dragging = true
        dragState.lastPointer.copy(pointer)
        dragState.lastTime = performance.now()
        dragState.velocity.set(0, 0, 0)
        hit.userData.targetScale = hit.userData.baseScale * 1.2
      }
    }

    const endDrag = () => {
      if (dragState.object && dragState.object.userData) {
        const v = dragState.object.userData.velocity
        if (v) {
          v.copy(dragState.velocity)
          if (v.length() > physics.maxSpeed) v.setLength(physics.maxSpeed)
        }
        dragState.object.userData.targetScale = dragState.object.userData.baseScale
      }
      dragState.object = null
      dragState.dragging = false
      dragState.velocity.set(0, 0, 0)
    }

    const handlePointerUp = () => endDrag()
    const handlePointerLeave = () => {
      endDrag()
      if (hovered && hovered.userData) {
        hovered.userData.targetScale = hovered.userData.baseScale
        hovered = null
      }
    }

    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointerleave', handlePointerLeave)


    // Animation loop
    let animationFrameId
    const clock = new THREE.Clock()

    const animate = () => {
      const dt = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      const toShatter = []
      
      for (let i = 0; i < cubes.length; i++) {
        const cube = cubes[i]
        if (!cube.userData.alive) continue

        if (cube.material.uniforms?.uTime) {
          cube.material.uniforms.uTime.value = elapsed
        }

        cube.rotation.x += dt * 0.25
        cube.rotation.y += dt * 0.35

        const currentScale = cube.scale.x
        const targetScale = cube.userData.targetScale
        const newScale = currentScale + (targetScale - currentScale) * 0.1
        cube.scale.setScalar(newScale)

        const vel = cube.userData.velocity
        if (vel && (!dragState.object || dragState.object !== cube)) {
          vel.multiplyScalar(physics.damping)

          if (vel.lengthSq() > 0.0001) {
            cube.position.addScaledVector(vel, dt)

            if (cube.position.x > bounds.x) {
              cube.position.x = bounds.x
              vel.x *= -physics.bounce
            } else if (cube.position.x < -bounds.x) {
              cube.position.x = -bounds.x
              vel.x *= -physics.bounce
            }

            if (cube.position.y > bounds.y) {
              cube.position.y = bounds.y
              vel.y *= -physics.bounce
            } else if (cube.position.y < -bounds.y) {
              cube.position.y = -bounds.y
              vel.y *= -physics.bounce
            }

            if (cube.position.z > bounds.z) {
              cube.position.z = bounds.z
              vel.z *= -physics.bounce
            } else if (cube.position.z < -bounds.z) {
              cube.position.z = -bounds.z
              vel.z *= -physics.bounce
            }
          }
        }

        for (let j = i + 1; j < cubes.length; j++) {
          const other = cubes[j]
          if (!other.userData.alive) continue
          
          const speed1 = cube.userData.velocity?.length() || 0
          const speed2 = other.userData.velocity?.length() || 0
          
          if ((speed1 > 1.5 || speed2 > 1.5) && checkCollision(cube, other)) {
            if (!toShatter.includes(cube)) toShatter.push(cube)
            if (!toShatter.includes(other)) toShatter.push(other)
          }
        }
      }

      toShatter.forEach((cube) => {
        if (dragState.object === cube) {
          dragState.object = null
          dragState.dragging = false
        }
        shatterCube(cube)
      })

      for (let i = shards.length - 1; i >= 0; i--) {
        const shard = shards[i]
        const data = shard.userData
        
        shard.position.addScaledVector(data.velocity, dt)
        data.velocity.y += data.gravity * dt
        data.velocity.multiplyScalar(0.98)
        
        shard.rotation.x += data.angularVelocity.x * dt
        shard.rotation.y += data.angularVelocity.y * dt
        shard.rotation.z += data.angularVelocity.z * dt
        data.angularVelocity.multiplyScalar(0.98)
        
        data.life -= dt
        
        const lifeRatio = data.life / data.maxLife
        shard.material.opacity = Math.max(0, lifeRatio * 0.6)
        
        const shrink = 0.5 + lifeRatio * 0.5
        shard.scale.setScalar(shrink * (0.6 + Math.random() * 0.1))
        
        if (data.life <= 0) {
          scene.remove(shard)
          shard.geometry.dispose()
          shard.material.dispose()
          shards.splice(i, 1)
        }
      }

      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
      renderer.dispose()
      cubeGeometry.dispose()
      shardGeometries.forEach((g) => g.dispose())
      cubes.forEach((c) => {
        c.geometry?.dispose()
        c.material?.dispose()
      })
      shards.forEach((s) => {
        s.geometry?.dispose()
        s.material?.dispose()
      })
    }
  }, [])

  return (
    <div ref={containerRef} className="hero-cubes">
      <canvas ref={canvasRef} className="hero-cubes-canvas" />
    </div>
  )
}

export default HeroCubes
