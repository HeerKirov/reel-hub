"use client"

import { memo, useCallback, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Box, Button, CloseButton, Dialog, Flex, IconButton, Portal, Table, Text } from "@chakra-ui/react"
import { RiAddLine, RiDeleteBinLine } from "react-icons/ri"
import { DateTimePicker, NumberInput, Select, Textarea } from "@/components/form"
import { ShoppingType, SHOPPING_TYPE_SELECT_ITEMS, SHOPPING_TYPE_LABEL } from "@/constants/purchase"
import { PurchaseWithProjectSchema } from "@/schemas/purchase"
import { createPurchase, deletePurchase, updatePurchase } from "@/services/purchase"
import { handleActionResult } from "@/helpers/action"
import { dates, numbers } from "@/helpers/primitive"
import { useEffectComputed } from "@/helpers/hooks"

export function PurchaseDetailTable({ projectId, data }: { projectId: string, data: PurchaseWithProjectSchema[] }) {
    const [dialogContext, setDialogContext] = useState<{mode: "edit" | "create", data: PurchaseWithProjectSchema | null} | null>(null)

    const openCreate = useCallback(() => {
        setDialogContext({ mode: "create", data: null })
    }, [])

    const openEdit = useCallback((row: PurchaseWithProjectSchema) => {
        setDialogContext({ mode: "edit", data: row })
    }, [])

    const closeDialog = useCallback(() => {
        setDialogContext(null)
    }, [])

    return (
        <>
            <Flex justify="flex-end" my="2">
                <Button variant="outline" size="sm" onClick={openCreate}>
                    <RiAddLine /> 添加消费
                </Button>
            </Flex>

            <Table.Root size="sm">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>类型</Table.ColumnHeader>
                        <Table.ColumnHeader>说明</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="right">金额</Table.ColumnHeader>
                        <Table.ColumnHeader>消费时间</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {data.length === 0 ? (
                        <Table.Row>
                            <Table.Cell colSpan={4}>
                                <Text color="fg.muted" textAlign="center" py="6">暂无消费记录</Text>
                            </Table.Cell>
                        </Table.Row>
                    ) : (
                        data.map((row) => (
                            <PurchaseDetailTableRow key={row.id} row={row} onClick={openEdit}/>
                        ))
                    )}
                </Table.Body>
            </Table.Root>

            <PurchaseDetailDialog projectId={projectId} open={!!dialogContext} mode={dialogContext?.mode ?? null} data={dialogContext?.data ?? null} onClose={closeDialog}/>
        </>
    )
}

interface PurchaseDetailDialogProps { 
    projectId: string
    open: boolean
    mode: "edit" | "create" | null
    data: PurchaseWithProjectSchema | null
    onClose: () => void
}

const PurchaseDetailDialog = memo(function PurchaseDetailDialog(props: PurchaseDetailDialogProps) {
    const { projectId, open, mode, data, onClose } = props

    const router = useRouter()
    
    const [isPending, startTransition] = useTransition()
    
    const [form, setForm] = useEffectComputed<PurchaseWithProjectSchema | null, PurchaseFormValue>(data, data => ({ 
        purchaseType: data?.purchaseType ?? ShoppingType.MAIN, 
        description: data?.description ?? "", 
        cost: data?.cost ?? 0,
        purchaseTimeIso: data?.purchaseTime.toISOString() ?? new Date().toISOString()
    }))

    const setPurchaseType = useCallback((value: ShoppingType) => {
        setForm(s => ({ ...s, purchaseType: value }))
    }, [setForm])

    const setDescription = useCallback((value: string) => {
        setForm(s => ({ ...s, description: value }))
    }, [setForm])
    
    const setCost = useCallback((value: number | null) => {
        setForm(s => ({ ...s, cost: value }))
    }, [setForm])

    const setPurchaseTimeIso = useCallback((value: string | null) => {
        setForm(s => ({ ...s, purchaseTimeIso: value }))
    }, [setForm])

    const refresh = useCallback(() => {
        startTransition(() => router.refresh())
    }, [router])

    const handleOpenChange = useCallback((details: {open: boolean}) => {
        if(!details.open) onClose()
    }, [onClose])

    const handleSave = useCallback(async () => {
        if(mode === "edit") {
            if(!data || form.cost === null || !form.purchaseTimeIso) return
            const result = handleActionResult(await updatePurchase(data.id, { purchaseType: form.purchaseType, description: form.description, cost: form.cost, purchaseTime: new Date(form.purchaseTimeIso) }), { successTitle: "已保存" })
            if(result.ok) {
                onClose()
                refresh()
            }
        }else{
            if(form.cost === null || !form.purchaseTimeIso) return
            const result = handleActionResult(await createPurchase({ projectId, purchaseType: form.purchaseType, description: form.description, cost: form.cost, purchaseTime: new Date(form.purchaseTimeIso) }), { successTitle: "已添加" })
            if(result.ok) {
                onClose()
                refresh()
            }
        }
    }, [mode, data, projectId, form, onClose, refresh])

    const handleDelete = useCallback(async () => {
        if(mode !== "edit" || !data) return
        const result = handleActionResult(await deletePurchase(data.id), { successTitle: "已删除" })
        if(result.ok) {
            onClose()
            refresh()
        }
    }, [mode, data, onClose, refresh])

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange} size="md">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>{mode === "edit" ? "编辑消费记录" : "添加消费记录"}</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                        <Flex direction="column" gap="3">
                            <Box>
                                <Text fontSize="sm" mb="1" color="fg.muted">类型</Text>
                                <Select value={form.purchaseType} items={SHOPPING_TYPE_SELECT_ITEMS} onValueChange={setPurchaseType} placeholder="选择类型" />
                            </Box>
                            <Box>
                                <Text fontSize="sm" mb="1" color="fg.muted">说明</Text>
                                <Textarea value={form.description} onValueChange={setDescription} rows={3} placeholder="可选" />
                            </Box>
                            <Box>
                                <Text fontSize="sm" mb="1" color="fg.muted">金额</Text>
                                <NumberInput value={form.cost} onValueChange={setCost} min={0} placeholder="0" />
                            </Box>
                            <Box>
                                <Text fontSize="sm" mb="1" color="fg.muted">消费时间</Text>
                                <DateTimePicker mode="time" value={form.purchaseTimeIso} onValueChange={setPurchaseTimeIso} placeholder="选择时间" />
                            </Box>
                        </Flex>
                        </Dialog.Body>
                        <Dialog.Footer display="flex" gap="2" justifyContent={mode === "edit" ? "space-between" : "flex-end"}>
                            {mode === "edit" && (
                                <IconButton variant="outline" colorPalette="red" onClick={handleDelete} loading={isPending}>
                                    <RiDeleteBinLine/>
                                </IconButton>
                            )}
                            <Flex gap="2">
                                <Button variant="outline" onClick={onClose}>取消</Button>
                                <Button colorPalette="blue" onClick={handleSave} loading={isPending}>{mode === "edit" ? "保存" : "添加"}</Button>
                            </Flex>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    )
})

const PurchaseDetailTableRow = memo(function PurchaseDetailTableRow({ row, onClick }: { row: PurchaseWithProjectSchema, onClick: (row: PurchaseWithProjectSchema) => void }) {
    return (
        <Table.Row cursor="pointer" onClick={() => onClick(row)} _hover={{ bg: "bg.subtle" }}>
            <Table.Cell>{SHOPPING_TYPE_LABEL[row.purchaseType]}</Table.Cell>
            <Table.Cell><Text lineClamp={2}>{row.description || "—"}</Text></Table.Cell>
            <Table.Cell textAlign="right">{numbers.formatCurrency(row.cost)}</Table.Cell>
            <Table.Cell color="fg.muted" fontSize="sm">{dates.format(row.purchaseTime, "dailyText")}</Table.Cell>
        </Table.Row>
    )
})

interface PurchaseFormValue {
    purchaseType: ShoppingType
    description: string
    cost: number | null
    purchaseTimeIso: string | null
}