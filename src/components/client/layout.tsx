"use client"
import { memo } from "react"
import { ButtonGroup, IconButton, Pagination, SystemStyleObject } from "@chakra-ui/react"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"

export const PageRouter = memo(function PageRouter({ ...attrs}: SystemStyleObject) {
    return (
        <Pagination.Root count={20} pageSize={2} defaultPage={1}>
            <ButtonGroup {...attrs} variant="outline" size="xs">
                <Pagination.PrevTrigger asChild>
                    <IconButton>
                        <LuChevronLeft />
                    </IconButton>
                </Pagination.PrevTrigger>

                {/*<Pagination.PageText />*/}
                <Pagination.Items
                    render={(page) => (
                        <IconButton variant={{ base: "outline", _selected: "solid" }}>
                            {page.value}
                        </IconButton>
                    )}
                />

                <Pagination.NextTrigger asChild>
                    <IconButton>
                        <LuChevronRight />
                    </IconButton>
                </Pagination.NextTrigger>
            </ButtonGroup>
        </Pagination.Root>
    )
})