import React, { memo } from "react"
import NextLink from "next/link"
import { Breadcrumb } from "@chakra-ui/react"
import { NAVIGATIONS } from "@/constants/ui"

export const NavigationBreadcrumb = memo(function NavigationBreadcrumb(props: {url?: string, detail?: string, detailIcon?: React.ReactNode}) {
    const nItem = props.url ? NAVIGATIONS.find(n => props.url!.startsWith(n.href)) : undefined
    const nsItem = nItem?.children?.find(n => props.url!.startsWith(n.href))

    const link1 = nItem && <Breadcrumb.Item>
        <Breadcrumb.Link asChild><NextLink href={nItem.href}>{nItem.icon} {nItem.label}</NextLink></Breadcrumb.Link>
    </Breadcrumb.Item>

    const link2 = nsItem && <Breadcrumb.Item>
        <Breadcrumb.Link asChild><NextLink href={nsItem.href}>{nsItem.icon} {nsItem.label}</NextLink></Breadcrumb.Link>
    </Breadcrumb.Item>

    const link3 = props.detail && <Breadcrumb.Item>
        <Breadcrumb.Link>{props.detailIcon} {props.detail}</Breadcrumb.Link>
    </Breadcrumb.Item>

    return (
        <Breadcrumb.Root py="3">
            <Breadcrumb.List>
                {link1}
                {link1 && (link2 || link3) ? <Breadcrumb.Separator/> : undefined}
                {link2}
                {(link1 || link2) && link3 ? <Breadcrumb.Separator/> : undefined}
                {link3}
            </Breadcrumb.List>
        </Breadcrumb.Root>
    )
})