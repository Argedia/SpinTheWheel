import { useEffect, useMemo, useRef, useState } from "react"
import { Box, Button, Stack } from "@chakra-ui/react"
import { useColorModeValue } from "./ui/color-mode"

type Slice = {
  label: string
  weight: number
  color: string
}

type WeightedWheelProps = {
  slices: Slice[]
  onResult: (label: string | null) => void
}

const SPIN_DURATION_MS = 3600

export function WeightedWheel({ slices, onResult }: WeightedWheelProps) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const timerRef = useRef<number | null>(null)
  const wheelBg = useColorModeValue("#f8fafc", "#0b1221")
  const borderColor = useColorModeValue("#1f2937", "#111827")
  const pointerColor = useColorModeValue("#f43f5e", "#f472b6")

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const processedSlices = useMemo(() => {
    const total = slices.reduce((sum, slice) => sum + slice.weight, 0)
    if (!total) return []
    let current = -90 // start at top

    return slices.map((slice) => {
      const angle = (slice.weight / total) * 360
      const startAngle = current
      const endAngle = current + angle
      const centerAngle = startAngle + angle / 2
      current = endAngle
      return { ...slice, startAngle, endAngle, centerAngle }
    })
  }, [slices])

  const arcPath = (start: number, end: number, radius = 180) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const startRad = toRad(start)
    const endRad = toRad(end)
    const largeArcFlag = end - start <= 180 ? "0" : "1"
    const x1 = radius * Math.cos(startRad)
    const y1 = radius * Math.sin(startRad)
    const x2 = radius * Math.cos(endRad)
    const y2 = radius * Math.sin(endRad)

    return `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
  }

  const handleSpin = () => {
    if (isSpinning || processedSlices.length === 0) return

    const totalWeight = processedSlices.reduce((sum, slice) => sum + slice.weight, 0)
    let target = Math.random() * totalWeight
    let winnerIndex = 0

    for (let i = 0; i < processedSlices.length; i += 1) {
      const weight = processedSlices[i]?.weight ?? 0
      if (target < weight) {
        winnerIndex = i
        break
      }
      target -= weight
    }

    const targetSlice = processedSlices[winnerIndex]
    const pointerAngle = -90
    const currentNormalized = ((rotation % 360) + 360) % 360
    const desired =
      pointerAngle - targetSlice.centerAngle - currentNormalized
    const normalize = (angle: number) => ((angle % 360) + 360) % 360
    const offset = normalize(desired)
    const spins = 6 + Math.floor(Math.random() * 3)
    const nextRotation = rotation + spins * 360 + offset

    setIsSpinning(true)
    setRotation(nextRotation)
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setIsSpinning(false)
      onResult(targetSlice.label)
    }, SPIN_DURATION_MS)
  }

  if (!processedSlices.length) {
    return (
      <Box
        border="1px dashed"
        borderColor={borderColor}
        rounded="lg"
        p={6}
        textAlign="center"
        bg={wheelBg}
      >
        Agrega nombres para habilitar la ruleta.
      </Box>
    )
  }

  return (
    <Stack align="center" gap={4}>
      <Box position="relative" w="100%" maxW="440px">
        <Box
          position="absolute"
          top="-10px"
          left="50%"
          transform="translateX(-50%)"
          zIndex={2}
        >
          <Box
            w="0"
            h="0"
            borderLeft="14px solid transparent"
            borderRight="14px solid transparent"
            borderTop={`22px solid ${pointerColor}`}
            filter="drop-shadow(0 8px 12px rgba(0,0,0,0.35))"
          />
        </Box>

        <Box
          position="relative"
          mx="auto"
          w="100%"
          maxW="440px"
          aspectRatio={1}
          rounded="full"
          boxShadow="xl"
          overflow="hidden"
          bg={wheelBg}
          border={`4px solid ${borderColor}`}
        >
          <svg
            viewBox="-200 -200 400 400"
            style={{
              width: "100%",
              height: "100%",
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.19, 1, 0.22, 1)`
                : "none",
            }}
          >
            {processedSlices.map((slice, idx) => (
              <g key={`${slice.label}-${idx}`}>
                <path d={arcPath(slice.startAngle, slice.endAngle)} fill={slice.color} />
                <text
                  x="0"
                  y="0"
                  fontSize="16"
                  fontWeight="800"
                  fill="#0b1221"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${slice.centerAngle}) translate(120)`}
                  style={{
                    paintOrder: "stroke",
                    stroke: "rgba(255,255,255,0.9)",
                    strokeWidth: 5,
                    strokeLinejoin: "round",
                  }}
                >
                  {slice.label}
                </text>
              </g>
            ))}
          </svg>
        </Box>
      </Box>

      <Button
        colorScheme="pink"
        size="lg"
        onClick={handleSpin}
        loadingText="Girando..."
        isLoading={isSpinning}
        width="220px"
      >
        Girar la ruleta
      </Button>
    </Stack>
  )
}
