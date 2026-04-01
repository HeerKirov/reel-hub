"use client"
import { memo, useCallback } from "react"
import { RiGamepadLine } from "react-icons/ri"
import { Field, Flex, Checkbox, CheckboxGroup, Fieldset } from "@chakra-ui/react"
import { Select } from "@/components/form"
import { ProjectUpdateEditor } from "@/components/app/project-editor"
import { GameDetailSchema, GameForm } from "@/schemas/project-game"
import { OnlineType, ONLINE_TYPE_ITEMS, PLATFORM_ITEMS } from "@/constants/game"
import { ProjectType } from "@/constants/project"
import { deleteProjectGame, updateProjectGame } from "@/services/project-game"

export interface GameExtra {
    platform: string[]
    onlineType: OnlineType | null
}

export interface GameInfoTabProps {
    platform: string[]
    onlineType: OnlineType | null
    setPlatform: (platform: string[]) => void
    setOnlineType: (onlineType: OnlineType | null) => void
}

export const GameInfoTab = memo(function GameInfoTab({ extra, setExtra }: { extra: GameExtra, setExtra: (field: keyof GameExtra, value: GameExtra[keyof GameExtra]) => void }) {
    const setOnlineType = useCallback((value: OnlineType | null) => setExtra("onlineType", value), [setExtra])
    const setPlatform = useCallback((values: string[]) => setExtra("platform", values), [setExtra])

    return (
        <Flex direction="column" gap="3">
            <Fieldset.Root>   
                <Fieldset.Legend>平台</Fieldset.Legend>
                <CheckboxGroup value={extra.platform} onValueChange={setPlatform}>
                    <Flex flexWrap="wrap" gap="3">
                        {PLATFORM_ITEMS.map(item => (
                            <Checkbox.Root key={item.value} value={item.value}>
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                                <Checkbox.Label>{item.label}</Checkbox.Label>
                            </Checkbox.Root>
                        ))}
                    </Flex>
                </CheckboxGroup>
            </Fieldset.Root>
            <Field.Root flex={{ base: "1 1 100%", sm: "1 1 calc(50% - 8px)" }}>
                <Field.Label>联机类型</Field.Label>
                <Select value={extra.onlineType} onValueChange={setOnlineType} items={ONLINE_TYPE_ITEMS} placeholder="联机类型" />
            </Field.Root>
        </Flex>
    )
})

export function Wrapper({ data }: { data: GameDetailSchema }) {
    const tabs = [{ label: "游戏信息", icon: <RiGamepadLine />, content: GameInfoTab }]

    const dataToExtra = (data: GameDetailSchema): GameExtra => ({
        platform: [...data.platform],
        onlineType: data.onlineType
    })

    const extraToForm = (extra: GameExtra): Partial<GameForm> => ({
        platform: extra.platform,
        onlineType: extra.onlineType
    })

    return <ProjectUpdateEditor data={data} type={ProjectType.GAME} update={updateProjectGame} delete={deleteProjectGame} dataToExtra={dataToExtra} extraToForm={extraToForm} tabs={tabs} />
}
