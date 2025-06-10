
export type SelectItem<T> = {
    label: string
    value: T
    color: string
}

export type SelectItemWithDesc<T> = SelectItem<T> & {desc: string[]}