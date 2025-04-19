"use client"

import NextImage, { ImageProps as NextImageProps } from "next/image"
import * as React from "react"

import { cn } from "@/lib/utils"

interface ImageProps extends NextImageProps {
  aspectRatio?: string
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ className, aspectRatio, alt, ...props }, ref) => {
    return (
      <div
        className={cn(
          "overflow-hidden",
          aspectRatio ? `aspect-${aspectRatio}` : "aspect-square",
          className
        )}
      >
        <NextImage
          ref={ref as any}
          alt={alt}
          className="h-full w-full object-cover"
          {...props}
        />
      </div>
    )
  }
)

Image.displayName = "Image"

export { Image } 