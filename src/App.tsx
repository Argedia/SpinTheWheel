import { useMemo, useState, type ChangeEvent } from "react"
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { WeightedWheel } from "./components/WeightedWheel"
import { Toaster, toaster } from "./components/ui/toaster"
import { useColorModeValue } from "./components/ui/color-mode"
import "./App.css"

const COLORS = [
  "#f97316",
  "#06b6d4",
  "#a855f7",
  "#22c55e",
  "#e11d48",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
]

type EntrySummary = {
  label: string
  count: number
}

const parseEntries = (raw: string) => {
  const parsed: string[] = []

  raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [namePart, repeatPart] = line.split(",").map((piece) => piece.trim())
      if (!namePart) return

      const repeatCount =
        repeatPart && !Number.isNaN(Number(repeatPart)) && Number(repeatPart) > 0
          ? Math.min(Number(repeatPart), 50)
          : 1

      for (let i = 0; i < repeatCount; i += 1) {
        parsed.push(namePart)
      }
    })

  return parsed
}

const summarizeEntries = (entries: string[]): EntrySummary[] => {
  const counter = new Map<string, number>()

  entries.forEach((item) => {
    counter.set(item, (counter.get(item) ?? 0) + 1)
  })

  return Array.from(counter.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function App() {
  const [rawInput, setRawInput] = useState<string>(
    ["Ana", "Bruno, 2", "Clara", "Diego"].join("\n"),
  )
  const [entries, setEntries] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const surface = useColorModeValue("white", "gray.800")
  const cardBorder = useColorModeValue("gray.200", "gray.700")
  const subtleBg = useColorModeValue("gray.50", "gray.900")
  const textMuted = useColorModeValue("gray.600", "gray.300")
  const textSubtle = useColorModeValue("gray.500", "gray.400")
  const resultBg = useColorModeValue("green.50", "green.900")
  const resultBorder = useColorModeValue("green.200", "green.700")
  const resultLabel = useColorModeValue("green.700", "green.200")
  const resultHeading = useColorModeValue("green.800", "green.100")

  const entrySummary = useMemo(() => summarizeEntries(entries), [entries])

  const slices = useMemo(
    () =>
      entrySummary.map((item, index) => ({
        label: item.label,
        weight: item.count,
        color: COLORS[index % COLORS.length],
      })),
    [entrySummary],
  )

  const handleApplyText = () => {
    const parsed = parseEntries(rawInput)

    if (!parsed.length) {
      toaster.create({
        type: "warning",
        title: "No hay datos",
        description: "No encontramos nombres en el texto. Revisa el formato.",
      })
      return
    }

    setEntries(parsed)
    setSelected(null)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result ?? "") as string
      const parsed = parseEntries(text)

      if (!parsed.length) {
        toaster.create({
          type: "warning",
          title: "Archivo vacío",
          description: "El archivo no tiene el formato esperado.",
        })
        return
      }

      setRawInput(text.trim())
      setEntries(parsed)
      setSelected(null)
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    setEntries([])
    setSelected(null)
  }

  return (
    <>
      <Toaster />
      <Container maxW="6xl" py={{ base: 8, md: 12 }}>
        <Stack gap={8}>
          <Stack gap={2}>
            <Heading size="2xl">Spin the Wheel</Heading>
            <Text color={textMuted} maxW="3xl">
              Ingresa nombres en la caja de texto o sube un archivo CSV/TXT con el formato{" "}
              <strong>Nombre, Repeticiones</strong> (repeticiones es opcional). Cada repetición
              aumenta la probabilidad de ser elegido.
            </Text>
          </Stack>

          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
            <GridItem>
              <Card.Root variant="outline" height="100%" bg={surface} borderColor={cardBorder}>
                <Card.Header>
                  <Stack gap={1}>
                    <Heading size="md">Participantes</Heading>
                    <Text fontSize="sm" color={textSubtle}>
                      Procesamos cada línea como "Nombre, Repeticiones".
                    </Text>
                  </Stack>
                </Card.Header>
                <Card.Body>
                  <Stack gap={4}>
                    <Textarea
                      value={rawInput}
                      onChange={(event) => setRawInput(event.target.value)}
                      placeholder="Ejemplo: Ana,2"
                      minH="180px"
                      resize="vertical"
                      fontFamily="mono"
                      bg={surface}
                      borderColor={cardBorder}
                    />
                    <HStack gap={3}>
                      <Button colorScheme="teal" onClick={handleApplyText}>
                        Usar texto
                      </Button>
                      <Button variant="ghost" onClick={handleClear}>
                        Limpiar lista
                      </Button>
                    </HStack>

                    <Box
                      border="1px dashed"
                      borderColor={cardBorder}
                      rounded="lg"
                      p={3}
                      bg={subtleBg}
                    >
                      <Stack gap={3}>
                        <Text fontWeight="medium">Subir CSV o TXT</Text>
                        <Input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileChange}
                        />
                        <Text fontSize="sm" color={textSubtle}>
                          Ejemplo de línea: <code>Carlos,3</code>
                        </Text>
                      </Stack>
                    </Box>

                    <Stack gap={2}>
                      <HStack justifyContent="space-between">
                        <Text fontWeight="semibold">
                          Entradas activas ({entries.length})
                        </Text>
                        {selected && (
                          <Badge colorScheme="purple">Último ganador: {selected}</Badge>
                        )}
                      </HStack>
                      {entries.length === 0 ? (
                        <Text color={textSubtle} fontSize="sm">
                          Agrega nombres para ver el desglose.
                        </Text>
                      ) : (
                        <VStack gap={2} align="stretch" maxH="200px" overflowY="auto">
                          {entrySummary.map((item, index) => (
                            <HStack
                              key={item.label}
                              justifyContent="space-between"
                              bg={surface}
                              border="1px solid"
                              borderColor={cardBorder}
                              rounded="md"
                              px={3}
                              py={2}
                              boxShadow="sm"
                            >
                              <HStack gap={3}>
                                <Box
                                  w={3}
                                  h={3}
                                  rounded="full"
                                  bg={COLORS[index % COLORS.length]}
                                />
                                <Text fontWeight="medium">{item.label}</Text>
                              </HStack>
                              <Badge colorScheme="teal">{item.count}x</Badge>
                            </HStack>
                          ))}
                        </VStack>
                      )}
                    </Stack>
                  </Stack>
                </Card.Body>
              </Card.Root>
            </GridItem>

            <GridItem>
              <Card.Root variant="outline" height="100%" bg={surface} borderColor={cardBorder}>
                <Card.Body>
                  <Stack align="center" gap={6}>
                    <Box w="100%" maxW="480px">
                      <WeightedWheel
                        slices={slices}
                        onResult={(winner) => setSelected(winner)}
                      />
                    </Box>

                    {selected ? (
                      <Box
                        bg={resultBg}
                        border="1px solid"
                        borderColor={resultBorder}
                        rounded="lg"
                        px={4}
                        py={3}
                        textAlign="center"
                        boxShadow="sm"
                        minW="260px"
                      >
                        <Text fontSize="sm" color={resultLabel}>
                          Resultado
                        </Text>
                        <Heading size="lg" color={resultHeading}>
                          {selected}
                        </Heading>
                      </Box>
                    ) : (
                      <Text color={textSubtle}>
                        Presiona "Girar" en la ruleta para elegir un ganador.
                      </Text>
                    )}
                  </Stack>
                </Card.Body>
              </Card.Root>
            </GridItem>
          </Grid>
        </Stack>
      </Container>
    </>
  )
}

export default App
