"use client"
import React from "react"
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react"
import { Button, SystemStyleObject } from "@chakra-ui/react"
import { Provider } from "@/components/ui/provider"

export function Wrapper({ children }: { children: React.ReactNode }) {
    return <SessionProvider>
        <Provider>
            {children}
        </Provider>
    </SessionProvider>
}

export function LoginButton(props: SystemStyleObject) {
    const { data: session } = useSession()
    const login = async () => {
        if(session?.user) {
            await signOut()
        }else{
            await signIn("auth-service")
        }
    }

    return <Button {...props} type="submit" variant="outline" onClick={login}>
        {session?.user ? "登出" : "登录"}
    </Button>
}