'use client'

import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
}

export default function InteractiveStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const starsRef = useRef<Star[]>([])
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasSize()

    // Create stars
    const createStars = () => {
      const stars: Star[] = []
      const numStars = Math.floor((window.innerWidth * window.innerHeight) / 8000) // Density based on screen size
      
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3, // Slow drift
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.3
        })
      }
      
      starsRef.current = stars
    }
    createStars()

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const stars = starsRef.current
      const mouse = mouseRef.current
      const connectionDistance = 150
      const mouseInfluenceDistance = 200

      // Update and draw stars
      stars.forEach((star, i) => {
        // Slow drift
        star.x += star.vx
        star.y += star.vy

        // Wrap around edges
        if (star.x < 0) star.x = canvas.width
        if (star.x > canvas.width) star.x = 0
        if (star.y < 0) star.y = canvas.height
        if (star.y > canvas.height) star.y = 0

        // Draw star
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(168, 85, 247, ${star.opacity})` // Purple color
        ctx.fill()

        // Calculate distance to mouse
        const dx = mouse.x - star.x
        const dy = mouse.y - star.y
        const distanceToMouse = Math.sqrt(dx * dx + dy * dy)

        // Draw connections to nearby stars when mouse is close
        if (distanceToMouse < mouseInfluenceDistance) {
          stars.forEach((otherStar, j) => {
            if (i >= j) return // Avoid duplicate lines

            const dx2 = star.x - otherStar.x
            const dy2 = star.y - otherStar.y
            const distance = Math.sqrt(dx2 * dx2 + dy2 * dy2)

            if (distance < connectionDistance) {
              // Calculate opacity based on distance to mouse
              const mouseFactor = 1 - distanceToMouse / mouseInfluenceDistance
              const distanceFactor = 1 - distance / connectionDistance
              const lineOpacity = mouseFactor * distanceFactor * 0.4

              // Draw connection line
              ctx.beginPath()
              ctx.moveTo(star.x, star.y)
              ctx.lineTo(otherStar.x, otherStar.y)
              
              // Create gradient line
              const gradient = ctx.createLinearGradient(star.x, star.y, otherStar.x, otherStar.y)
              gradient.addColorStop(0, `rgba(168, 85, 247, ${lineOpacity})`)
              gradient.addColorStop(0.5, `rgba(147, 51, 234, ${lineOpacity * 1.2})`)
              gradient.addColorStop(1, `rgba(168, 85, 247, ${lineOpacity})`)
              
              ctx.strokeStyle = gradient
              ctx.lineWidth = 1
              ctx.stroke()

              // Add glow effect
              ctx.strokeStyle = `rgba(168, 85, 247, ${lineOpacity * 0.3})`
              ctx.lineWidth = 3
              ctx.stroke()
            }
          })

          // Make stars glow more when mouse is near
          const glowOpacity = (1 - distanceToMouse / mouseInfluenceDistance) * 0.6
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2)
          const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 3)
          glowGradient.addColorStop(0, `rgba(168, 85, 247, ${glowOpacity})`)
          glowGradient.addColorStop(1, 'rgba(168, 85, 247, 0)')
          ctx.fillStyle = glowGradient
          ctx.fill()
        }
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Event listeners
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', () => {
      setCanvasSize()
      createStars()
    })

    // Start animation
    animate()

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', setCanvasSize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}

