"use client"
import React from "react"
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { Button, ChakraProvider } from "@chakra-ui/react"
import { system } from "@/config/theme"

export function Wrapper({ children }: { children: React.ReactNode }) {
    return <SessionProvider>
        <ThemeProvider>
            <ChakraProvider value={system}>
                {children}
            </ChakraProvider>
        </ThemeProvider>
    </SessionProvider>
}

export function LoginButton() {
    const { data: session } = useSession()
    const login = async () => {
        if(session?.user) {
            await signOut()
        }else{
            await signIn("auth-service")
        }
    }

    return <Button type="submit" variant="surface" onClick={login}>
        {session?.user ? "Logout" : "Login"}
    </Button>
}