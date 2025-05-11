import { Text, TextProps } from "@chakra-ui/react"

export function WrappedText({ text, ...attrs }: {text?: string | null} & TextProps) {
    return text?.split("\n").map((line, i) => (
        <Text key={i} {...attrs}>
            {line}
        </Text>
    ))
}

