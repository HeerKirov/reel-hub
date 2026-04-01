import type { Metadata } from "next"
import NextLink from "next/link"
import { RiSettings2Fill } from "react-icons/ri"
import { Breadcrumb, Container } from "@chakra-ui/react"
import { retrieveUserPreference } from "@/services/user-preference"
import { unwrapQueryResult } from "@/helpers/result"
import { InlineError } from "@/components/app/inline-error"
import { UserPreferenceForm } from "./components"

export const metadata: Metadata = {
    title: "偏好设置"
}

export default async function UserPreferencePage() {
    const result = await retrieveUserPreference()
    const { data, error } = unwrapQueryResult(result)
    if (error) {
        return <InlineError error={error} />
    }

    return (
        <Container maxW="container.xl">
            <Breadcrumb.Root py="3">
                <Breadcrumb.List>
                    <Breadcrumb.Item>
                        <Breadcrumb.Link asChild>
                            <NextLink href="/user/preference"><RiSettings2Fill/> 偏好设置</NextLink>
                        </Breadcrumb.Link>
                    </Breadcrumb.Item>
                </Breadcrumb.List>
            </Breadcrumb.Root>
            <UserPreferenceForm initial={data} />
        </Container>
    )
}
