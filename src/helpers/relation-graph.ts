import { RelationType, RELATION_TYPE_LEVELS, RELATION_TYPE_REVERSE, RELATION_TYPE_VALUES, mergeRelationTypes } from "@/constants/project"

/**
 * 关系图构建器类
 */
export class RelationGraphBuilder<E> {
    constructor(private graph: RelationGraph<E>) {}

    /**
     * 在图中添加两个节点之间的有向关系。
     */
    addRelation(from: E, relation: RelationType, to: E, getId: (element: E) => string): void {
        const fromIndex = this.graph.getIdIndex(getId(from))
        const toIndex = this.graph.getIdIndex(getId(to))
        
        if (fromIndex === undefined) {
            throw new Error("From element is not in graph.")
        }
        if (toIndex === undefined) {
            throw new Error("To element is not in graph.")
        }

        this.graph.addRelationInternal(fromIndex, toIndex, relation)
    }
}

/**
 * 关系图类，用于计算项目之间的关联拓扑
 */
export class RelationGraph<E> {
    // 以二维数组表示的，index为[from][to]的entity之间的关系
    private map: (RelationType | null)[][]
    
    // 将entity的id映射到其index
    private idMapper: Map<string, number>
    
    // 元素数组
    private elements: E[]

    constructor(elements: E[], getId: (element: E) => string, initializer: (builder: RelationGraphBuilder<E>) => void) {
        this.elements = elements
        this.idMapper = new Map()
        this.map = []

        // 初始化时对全部entity进行扫描，确认无重复，并将id映射存入map
        elements.forEach((element, index) => {
            const id = getId(element)
            if (this.idMapper.has(id)) {
                throw new Error(`Element[${index}] is duplicated.`)
            }
            this.idMapper.set(id, index)
        })

        // 初始化二维数组
        for (let i = 0; i < elements.length; i++) {
            this.map[i] = []
            for (let j = 0; j < elements.length; j++) {
                this.map[i][j] = null
            }
        }

        // 执行关系初始化代码块
        const builder = new RelationGraphBuilder(this)
        initializer(builder)

        // 执行关系传播代码块
        for (let i = 0; i < this.map.length; i++) {
            this.spread(i)
        }
    }

    /**
     * 获取元素ID对应的索引
     */
    getIdIndex(id: string): number | undefined {
        return this.idMapper.get(id)
    }

    /**
     * 内部方法：添加关系
     */
    addRelationInternal(fromIndex: number, toIndex: number, relation: RelationType): void {
        const oldFromToValue = this.map[fromIndex][toIndex]
        if (oldFromToValue === null || RELATION_TYPE_LEVELS[oldFromToValue] < RELATION_TYPE_LEVELS[relation]) {
            this.map[fromIndex][toIndex] = relation
        }

        const reverseRelation = RELATION_TYPE_REVERSE[relation]
        const oldToFromValue = this.map[toIndex][fromIndex]
        if (oldToFromValue === null || RELATION_TYPE_LEVELS[oldToFromValue] < RELATION_TYPE_LEVELS[reverseRelation]) {
            this.map[toIndex][fromIndex] = reverseRelation
        }
    }

    /**
     * 将当前的有限的拓扑图中的关系传播到全部联通节点，使任意两个联通节点之间的关系可直接查询。
     */
    private spread(thisIndex: number): void {
        // 记录传播过程中已经遍历过的节点，防止重复遍历
        const been = new Set<number>()
        // BFS的队列
        const queue: number[] = []
        
        // 处理初始节点
        been.add(thisIndex)
        this.map[thisIndex].forEach((relationOfThisToGoal, goalIndex) => {
            if (relationOfThisToGoal !== null) {
                queue.push(goalIndex)
                been.add(goalIndex)
            }
        })

        while (queue.length > 0) {
            const currentIndex = queue.shift()!
            const relationOfThisToCurrent = this.map[thisIndex][currentIndex]!
            const mapper = this.map[currentIndex]
            
            for (let goalIndex = 0; goalIndex < mapper.length; goalIndex++) {
                const relationOfCurrentToGoal = mapper[goalIndex]
                if (relationOfCurrentToGoal !== null) {
                    // 根据this->current和current->goal的关系，计算this->goal的关系
                    const relationOfThisToGoal = thisIndex === currentIndex 
                        ? relationOfCurrentToGoal 
                        : mergeRelationTypes(relationOfThisToCurrent, relationOfCurrentToGoal)
                    
                    // 在目标节点没有遍历过，或者在关系更新过的情况下将goal节点放入队列
                    if (this.putNewRelation(thisIndex, goalIndex, relationOfThisToGoal) || !been.has(goalIndex)) {
                        queue.push(goalIndex)
                        been.add(goalIndex)
                    }
                }
            }
        }
    }

    /**
     * 按照规约在关系表中更新关系。只有新关系大于旧关系时才会正确放入，并返回True。
     */
    private putNewRelation(from: number, to: number, newRelation: RelationType): boolean {
        if (from === to) return false
        
        const oldRelation = this.map[from][to]
        if (oldRelation === null || RELATION_TYPE_LEVELS[oldRelation] < RELATION_TYPE_LEVELS[newRelation]) {
            this.map[from][to] = newRelation
            this.map[to][from] = RELATION_TYPE_REVERSE[newRelation]
            return true
        }
        return false
    }

    /**
     * 获得图中指定节点的全量拓扑，即它对其他所有节点的关系表。
     * 只有存在关系的节点才会被列出。
     */
    get(element: E, getId: (element: E) => string): Record<RelationType, E[]> {
        const relations: Record<RelationType, E[]> = {} as Record<RelationType, E[]>
        const elementIndex = this.idMapper.get(getId(element))
        
        if (elementIndex === undefined) {
            throw new Error("Element is not in graph.")
        }

        // 初始化所有关系类型为空数组
        for (const relationType of RELATION_TYPE_VALUES) {
            relations[relationType] = []
        }

        this.map[elementIndex].forEach((relation, index) => {
            if (relation !== null) {
                relations[relation].push(this.elements[index])
            }
        })

        return relations
    }
} 