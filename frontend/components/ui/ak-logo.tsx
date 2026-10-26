"use client"

import * as React from "react"

interface AKLogoProps {
  className?: string
  showTagline?: boolean
  variant?: "full" | "icon" | "horizontal"
  light?: boolean
}

export function AKLogo({
  className = "h-8",
  showTagline = false,
  variant = "horizontal",
  light = false,
}: AKLogoProps) {
  const primaryColor = light ? "#FFFFFF" : "#23496D"
  const secondaryColor = light ? "#7DD3FC" : "#3B799B"
  const textColor = light ? "#FFFFFF" : "#23496D"
  const taglineColor = light ? "#94A3B8" : "#23496D"

  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 120 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* A shape left leg */}
        <path
          d="M45 0L0 70H25L45 35H60L45 0Z"
          fill={primaryColor}
        />
        {/* A inner peak & right leg */}
        <path
          d="M60 0L42 38L62 70H80L65 35L75 0H60Z"
          fill={primaryColor}
        />
        {/* K shape right chevron */}
        <path
          d="M65 35L105 0H82L55 45L85 70H110L72 38L65 35Z"
          fill={secondaryColor}
        />
      </svg>
    )
  }

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <svg
        viewBox="0 0 420 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        {/* Icon Mark */}
        <g id="AK-Mark">
          {/* Left leg of A */}
          <path
            d="M38 4L4 68H26L42 36H56L38 4Z"
            fill={primaryColor}
          />
          {/* A center body */}
          <path
            d="M56 4L39 39L57 68H74L60 34L71 4H56Z"
            fill={primaryColor}
          />
          {/* K right chevron */}
          <path
            d="M60 34L98 4H78L52 44L80 68H102L67 37L60 34Z"
            fill={secondaryColor}
          />
        </g>

        {/* AK PHARMA Text */}
        <text
          x="116"
          y="54"
          fill={textColor}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="48"
          letterSpacing="1"
        >
          AK PHARMA
        </text>

        {/* Tagline */}
        {showTagline && (
          <text
            x="4"
            y="98"
            fill={taglineColor}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="500"
            fontSize="22"
            letterSpacing="0.5"
          >
            Smart Solutions for Healthier Living
          </text>
        )}
      </svg>
    </div>
  )
}
