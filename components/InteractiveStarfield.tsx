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
  const animationFrameRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Accent color from design system (coral)
    const accentColor = { r: 249, g: 112, b: 102 }

    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasSize()

    const createStars = () => {
      const stars: Star[] = []
      // Reduced density for cleaner look
      const numStars = Math.floor((window.innerWidth * window.innerHeight) / 12000)
      
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          radius: Math.random() * 1.2 + 0.4,
          opacity: Math.random() * 0.4 + 0.2
        })
      }
      
      starsRef.current = stars
    }
    createStars()

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const stars = starsRef.current
      const mouse = mouseRef.current
      const connectionDistance = 120
      const mouseInfluenceDistance = 150

      stars.forEach((star, i) => {
        // Slow drift
        star.x += star.vx
        star.y += star.vy

        // Wrap around edges
        if (star.x < 0) star.x = canvas.width
        if (star.x > canvas.width) star.x = 0
        if (star.y < 0) star.y = canvas.height
        if (star.y > canvas.height) star.y = 0

        // Draw star (white with low opacity for subtlety)
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.6})`
        ctx.fill()

        // Calculate distance to mouse
        const dx = mouse.x - star.x
        const dy = mouse.y - star.y
        const distanceToMouse = Math.sqrt(dx * dx + dy * dy)

        // Draw connections when mouse is close
        if (distanceToMouse < mouseInfluenceDistance) {
          stars.forEach((otherStar, j) => {
            if (i >= j) return

            const dx2 = star.x - otherStar.x
            const dy2 = star.y - otherStar.y
            const distance = Math.sqrt(dx2 * dx2 + dy2 * dy2)

            if (distance < connectionDistance) {
              const mouseFactor = 1 - distanceToMouse / mouseInfluenceDistance
              const distanceFactor = 1 - distance / connectionDistance
              const lineOpacity = mouseFactor * distanceFactor * 0.25

              // Draw connection line using accent color
              ctx.beginPath()
              ctx.moveTo(star.x, star.y)
              ctx.lineTo(otherStar.x, otherStar.y)
              
              const gradient = ctx.createLinearGradient(star.x, star.y, otherStar.x, otherStar.y)
              gradient.addColorStop(0, `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, ${lineOpacity})`)
              gradient.addColorStop(0.5, `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, ${lineOpacity * 1.2})`)
              gradient.addColorStop(1, `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, ${lineOpacity})`)
              
              ctx.strokeStyle = gradient
              ctx.lineWidth = 1
              ctx.stroke()
            }
          })

          // Subtle glow when mouse is near
          const glowOpacity = (1 - distanceToMouse / mouseInfluenceDistance) * 0.3
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2)
          const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * 2.5)
          glowGradient.addColorStop(0, `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, ${glowOpacity})`)
          glowGradient.addColorStop(1, `rgba(${accentColor.r}, ${accentColor.g}, ${accentColor.b}, 0)`)
          ctx.fillStyle = glowGradient
          ctx.fill()
        }
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      setCanvasSize()
      createStars()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    animate()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  )
}
