'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three-stdlib';

const ThreeScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cubesRef = useRef<THREE.Mesh[]>([]);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 10, 20);
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Initialize renderer with performance optimizations
    const renderer = new THREE.WebGLRenderer({
      antialias: false, // Disable antialiasing for better performance
      alpha: true,
      powerPreference: "high-performance" // Prioritize performance over quality
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap; // Use basic shadows for performance
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xedae00, 1.5, 100);
    pointLight.position.set(-5, -5, 5);
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 1024;
    pointLight.shadow.mapSize.height = 1024;
    scene.add(pointLight);

    // Create floating cubes with different geometries
    const geometries = [
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.ConeGeometry(0.3, 0.6, 8),
      new THREE.TorusGeometry(0.3, 0.1, 16, 32)
    ];

    const materials = [
      new THREE.MeshStandardMaterial({
        color: 0xedae00,
        metalness: 0.7,
        roughness: 0.2,
        emissive: 0xedae00,
        emissiveIntensity: 0.1
      }),
      new THREE.MeshStandardMaterial({
        color: 0x00aaff,
        metalness: 0.5,
        roughness: 0.3,
        emissive: 0x00aaff,
        emissiveIntensity: 0.1
      }),
      new THREE.MeshStandardMaterial({
        color: 0xaa00ff,
        metalness: 0.8,
        roughness: 0.1,
        emissive: 0xaa00ff,
        emissiveIntensity: 0.1
      })
    ];

    // Reduce object count for better performance
    for (let i = 0; i < 15; i++) {
      const geometry = geometries[i % geometries.length];
      const material = materials[i % materials.length];
      const mesh = new THREE.Mesh(geometry, material);

      // Random position
      mesh.position.x = (Math.random() - 0.5) * 10;
      mesh.position.y = (Math.random() - 0.5) * 10;
      mesh.position.z = (Math.random() - 0.5) * 10;

      // Store random values for animation
      (mesh.userData as any).speedX = (Math.random() - 0.5) * 0.01;
      (mesh.userData as any).speedY = (Math.random() - 0.5) * 0.01;
      (mesh.userData as any).speedZ = (Math.random() - 0.5) * 0.01;
      (mesh.userData as any).rotationSpeedX = (Math.random() - 0.5) * 0.01;
      (mesh.userData as any).rotationSpeedY = (Math.random() - 0.5) * 0.01;
      (mesh.userData as any).rotationSpeedZ = (Math.random() - 0.5) * 0.01;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      scene.add(mesh);
      cubesRef.current.push(mesh);
    }

    // Add a subtle particle system for background
    const particleCount = 200; // Reduced for performance
    const particles = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 30;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.03,
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      const elapsedTime = clockRef.current.getElapsedTime();

      // Rotate cubes
      cubesRef.current.forEach(cube => {
        cube.rotation.x += (cube.userData as any).rotationSpeedX;
        cube.rotation.y += (cube.userData as any).rotationSpeedY;
        cube.rotation.z += (cube.userData as any).rotationSpeedZ;

        // Move cubes in floating motion
        cube.position.x += (cube.userData as any).speedX;
        cube.position.y += (cube.userData as any).speedY;
        cube.position.z += (cube.userData as any).speedZ;

        // Reset position if too far
        if (Math.abs(cube.position.x) > 10) (cube.userData as any).speedX *= -1;
        if (Math.abs(cube.position.y) > 10) (cube.userData as any).speedY *= -1;
        if (Math.abs(cube.position.z) > 10) (cube.userData as any).speedZ *= -1;

        // Add subtle pulsing effect (optimized)
        const scale = 1 + Math.sin(elapsedTime * 2 + cube.id) * 0.02;
        cube.scale.set(scale, scale, scale);
      });

      // Rotate particle system slowly
      particleSystem.rotation.y = elapsedTime * 0.02;

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      // Dispose geometries and materials
      geometries.forEach(geom => geom.dispose());
      materials.forEach(mat => {
        if (mat instanceof THREE.Material) {
          mat.dispose();
        }
      });

      // Remove event listener
      const currentContainer = containerRef.current;
      if (currentContainer && rendererRef.current) {
        currentContainer.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full absolute inset-0 z-0"
      style={{ minHeight: '100vh' }}
    />
  );
};

export default ThreeScene;