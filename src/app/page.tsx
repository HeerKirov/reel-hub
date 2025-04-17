import { Button } from "@chakra-ui/react"
import { LoginButton } from "@/app/components"
import { getSession } from "@/helpers/next"

export default async function Home() {
    const session = await getSession()

    return (
        <>
            <div>
                <LoginButton/>
                <Button variant="outline">
                    {session?.user ? (JSON.stringify(session.user)) : "(None)"}
                </Button>
            </div>
        </>
    )
}
