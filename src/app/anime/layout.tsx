import type { Metadata } from "next"
import React from "react"

export const metadata: Metadata = {
    title: {
        template: '%s | 动画 | REEL HUB',
        default: '动画 | REEL HUB',
    }
}

export default function RootLayout({ children }: {children: React.ReactNode}) {
    return children
}