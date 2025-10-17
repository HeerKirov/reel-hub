"use client"
import Cropper from "cropperjs"
import { useState, useRef, ChangeEvent, useEffect } from "react"
import { Box, BoxProps, Button, CloseButton, Dialog, Image, Portal } from "@chakra-ui/react"
import emptyCover from "@/assets/empty.jpg"
import "cropperjs/dist/cropper.css"

export interface CropperProps extends BoxProps {
    src?: string | Blob | null
    aspectRatio?: number
    onCropChange?: (value: Blob) => void
}

export function CropperFileUploader(props: CropperProps) {
    const { src: originSrc, aspectRatio = 1, onCropChange, ...attrs } = props
    const [isOpen, setIsOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedFile(file)
            setIsOpen(true)
        }
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleClose = () => {
        setIsOpen(false)
        setSelectedFile(null)
    }

    const handleSave = (blob: Blob) => {
        onCropChange?.(blob)
        handleClose()
    }

    const src = originSrc instanceof Blob ? URL.createObjectURL(originSrc) : (originSrc ?? emptyCover.src)

    return <Box {...attrs} position="relative">
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" style={{display: 'none'}}/>
        <Box onClick={handleClick} cursor="pointer" borderWidth="1px" borderStyle="dashed" borderRadius="md" overflow="hidden">
            <Image aspectRatio={aspectRatio} width="100%" objectFit="cover" src={src} alt="上传图片"/>
        </Box>

        <Dialog.Root open={isOpen} onOpenChange={details => setIsOpen(details.open)} placement="center" motionPreset="slide-in-bottom">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    {!!selectedFile && <DialogContent file={selectedFile} aspectRatio={aspectRatio} onClose={handleClose} onSave={handleSave}/>}
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    </Box>
}

function DialogContent(props: { file: File, aspectRatio: number, onClose: () => void, onSave: (value: Blob) => void }) {
    const imageRef = useRef<HTMLImageElement>(null)
    const cropperInstance = useRef<Cropper | null>(null)

    const handleSave = async () => {
        const croppedData: Blob | null = await new Promise(resolve => cropperInstance.current?.getCroppedCanvas().toBlob(blob => resolve(blob), 'image/jpeg'))
        if(croppedData) props.onSave(croppedData)
    }

    useEffect(() => {
        const reader = new FileReader()
        reader.readAsDataURL(props.file)
        reader.onloadend = e => {
            if(!cropperInstance.current) cropperInstance.current = new Cropper(imageRef.current!, {
                aspectRatio: props.aspectRatio,
                viewMode: 1,
                autoCropArea: 1
            })

            cropperInstance.current.replace(e.target!.result as string)
        }
    }, [props.file])

    return <Dialog.Content maxWidth="800px" maxHeight="80vh">
        <Dialog.Header>
            <Dialog.Title>裁剪</Dialog.Title>
            <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={props.onClose}/>
            </Dialog.CloseTrigger>
        </Dialog.Header>
        
        <Dialog.Body>
            <Box position="relative" maxHeight="60vh">
                <img ref={imageRef} src={emptyCover.src} alt="裁剪预览"/>
            </Box>
        </Dialog.Body>

        <Dialog.Footer>
            <Button variant="outline" onClick={props.onClose}>取消</Button>
            <Button colorPalette="blue" onClick={handleSave}>确定</Button>
        </Dialog.Footer>
    </Dialog.Content>
}