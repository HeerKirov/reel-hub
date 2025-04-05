"use client"
import React from "react"
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@chakra-ui/react"
import { Provider } from "@/components/ui/provider"

export function Wrapper({ children }: { children: React.ReactNode }) {
    return <SessionProvider>
        <Provider>
            {children}
        </Provider>
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