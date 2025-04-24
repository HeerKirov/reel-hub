import React from "react"
import {
    RiBarChartBoxAiLine,
    RiBookmark3Line, RiBookOpenFill,
    RiDatabase2Fill, RiFilmFill, RiGamepadFill, RiImageFill,
    RiPenNibLine, RiPulseFill, RiTvLine
} from "react-icons/ri"

export type NavigationSubItem = {label: string, href: string, icon: React.ReactNode}

export type NavigationItem = NavigationSubItem & {theme: string, children: NavigationSubItem[]}

export const NAVIGATIONS: NavigationItem[] = [
    {
        label: "动画", href: "/anime", icon: <RiTvLine/>, theme: "blue",
        children: [
            {label: "数据库", href: "/anime/database", icon: <RiDatabase2Fill/>},
            {label: "订阅", href: "/anime/subscription", icon: <RiBookmark3Line/>},
            {label: "时间线", href: "/anime/timeline", icon: <RiPulseFill/>},
            {label: "评价", href: "/anime/comment", icon: <RiPenNibLine/>},
            {label: "统计", href: "/anime/statistics", icon: <RiBarChartBoxAiLine/>},
        ]
    },
    {
        label: "游戏", href: "/game", icon: <RiGamepadFill/>, theme: "green",
        children: [
            {label: "数据库", href: "/game/database", icon: <RiDatabase2Fill/>},
            {label: "游玩记录", href: "/game/record", icon: <RiPulseFill/>},
            {label: "评价", href: "/game/comment", icon: <RiPenNibLine/>},
            {label: "统计", href: "/game/statistics", icon: <RiBarChartBoxAiLine/>},
        ]
    },
    {
        label: "电影", href: "/movie", icon: <RiFilmFill/>, theme: "orange",
        children: [
            {label: "数据库", href: "/movie/database", icon: <RiDatabase2Fill/>},
            {label: "观看记录", href: "/movie/record", icon: <RiPulseFill/>},
            {label: "评价", href: "/movie/comment", icon: <RiPenNibLine/>},
            {label: "统计", href: "/movie/statistics", icon: <RiBarChartBoxAiLine/>},
        ]
    },
    {
        label: "小说", href: "/novel", icon: <RiBookOpenFill/>, theme: "cyan",
        children: [
            {label: "数据库", href: "/novel/database", icon: <RiDatabase2Fill/>},
            {label: "足迹", href: "/novel/record", icon: <RiPulseFill/>},
            {label: "评价", href: "/novel/comment", icon: <RiPenNibLine/>},
            {label: "统计", href: "/novel/statistics", icon: <RiBarChartBoxAiLine/>},
        ]
    },
    {
        label: "漫画", href: "/manga", icon: <RiImageFill/>, theme: "pink",
        children: [
            {label: "数据库", href: "/manga/database", icon: <RiDatabase2Fill/>},
            {label: "足迹", href: "/manga/record", icon: <RiPulseFill/>},
            {label: "评价", href: "/manga/comment", icon: <RiPenNibLine/>},
            {label: "统计", href: "/manga/statistics", icon: <RiBarChartBoxAiLine/>},
        ]
    },
]