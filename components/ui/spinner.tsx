'use client'

export function Spinner({ size = 60 }: { size?: number }) {
    return (
        <div
            className="spinner"
            style={{ width: size, height: size }}
        />
    )
}
