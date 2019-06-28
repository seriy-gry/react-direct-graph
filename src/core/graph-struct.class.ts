import { INodeInput, NodeType } from "./node.interface";

const isMultiple = (obj: { [id: string]: string[] }, id: string): boolean =>
    obj[id] && obj[id].length > 1;

function union<T>(setA: Set<T>, setB: Set<T>) {
    var _union = new Set(setA);
    setB.forEach(elem => _union.add(elem))
    return _union;
}

/**
 * @class GraphStruct
 * Frame parent-class to simplify graph
 * elements recognition
 */
export class GraphStruct<T> {
    protected _list: INodeInput<T>[] = [];
    private _nodesMap: { [id: string]: INodeInput<T> } = {};
    private _incomesByNodeIdMap: { [id: string]: string[] } = {};
    private _outcomesByNodeIdMap: { [id: string]: string[] } = {};
    private _loopsByNodeIdMap: { [id: string]: string[] } = {};
    constructor(list: INodeInput<T>[]) {
        this.applyList(list);
    }
    /**
     * Fill graph with new nodes
     * @param list input linked list of nodes
     */
    applyList(list: INodeInput<T>[]): void {
        this._incomesByNodeIdMap = {};
        this._outcomesByNodeIdMap = {};
        this._nodesMap = {};
        this._loopsByNodeIdMap = {};
        this._list = list;
        this._nodesMap = list.reduce((map, node) => {
            if (map[node.id])
                throw new Error(`Duplicate id ${node.id}`);
            map[node.id] = node;
            return map
        }, {});
        this.detectIncomesAndOutcomes()
    }
    detectIncomesAndOutcomes() {
        this._list.reduce((totalSet, node) => {
            if (totalSet.has(node.id)) return totalSet
            return union(totalSet, this.traverseVertically(node, new Set(), totalSet))
        }, new Set<string>())
        if (Object.values(this._loopsByNodeIdMap).length) console.log(this._loopsByNodeIdMap);
    }
    traverseVertically(
        node: INodeInput<T>,
        branchSet: Set<string>,
        totalSet:  Set<string>,
    ):Set<string> {
        if (branchSet.has(node.id))
            throw new Error(`Duplicate incomes for node id ${node.id}`);
        branchSet.add(node.id)
        totalSet.add(node.id)
        node.next.forEach((outcomeId) => {
            // skip loops which are already detected
            if (this.isLoopEdge(node.id, outcomeId)) return
            // detect loops
            if (branchSet.has(outcomeId)) {
                this._loopsByNodeIdMap[outcomeId] = this._loopsByNodeIdMap[
                    outcomeId
                ]
                    ? Array.from(new Set([...this._loopsByNodeIdMap[outcomeId], node.id]))
                    : [node.id];
                return;
            }
            this._incomesByNodeIdMap[outcomeId] = this._incomesByNodeIdMap[
                outcomeId
            ]
                ? Array.from(new Set([...this._incomesByNodeIdMap[outcomeId], node.id]))
                : [node.id];
            this._outcomesByNodeIdMap[node.id] = this._outcomesByNodeIdMap[
                node.id
            ]
                ? Array.from(new Set([...this._outcomesByNodeIdMap[node.id], outcomeId]))
                : [outcomeId];
            totalSet = this.traverseVertically(this._nodesMap[outcomeId], new Set(branchSet), totalSet)
            return
        });
        
        return totalSet
    }
    /**
     * Get graph roots.
     * Roots is nodes without incomes
     */
    roots(): INodeInput<T>[] {
        return this._list.filter(node => this.isRoot(node.id));
    }
    /**
     * Get type of node
     * @param id id of node
     * @returns type of the node
     */
    protected nodeType(id: string): NodeType {
        let nodeType = NodeType.Simple;
        switch (true) {
            case this.isRoot(id) && this.isSplit(id):
                nodeType = NodeType.RootSplit;
                break;
            case this.isRoot(id):
                nodeType = NodeType.RootSimple;
                break;
            case this.isSplit(id):
                nodeType = NodeType.Split;
                break;
            case this.isJoin(id):
                nodeType = NodeType.Join;
                break;
        }
        return nodeType;
    }
    /**
     * Whether or node is split
     * @param id id of node
     */
    private isSplit(id: string): boolean {
        return isMultiple(this._outcomesByNodeIdMap, id);
    }
    /**
     * Whether or node is join
     * @param id id of node
     */
    private isJoin(id: string): boolean {
        return isMultiple(this._incomesByNodeIdMap, id);
    }
    /**
     * Whether or node is root
     * @param id id of node
     */
    private isRoot(id: string): boolean {
        return (
            !this._incomesByNodeIdMap[id] ||
            !this._incomesByNodeIdMap[id].length
        );
    }
    private isLoopEdge(nodeId: string, outcomeId: string):boolean {
        return this._loopsByNodeIdMap[outcomeId] && this._loopsByNodeIdMap[outcomeId].includes(nodeId)
    }
    /**
     * Get outcomes of node by id
     * @param id id of node
     */
    protected outcomes(id: string): string[] {
        return this._outcomesByNodeIdMap[id] || [];
    }
    /**
     * Get incomes of node by id
     * @param id id of node
     */
    protected incomes(id: string): string[] {
        return this._incomesByNodeIdMap[id];
    }
    /**
     * Get node by id
     * @param id node id
     */
    protected node(id: string): INodeInput<T> {
        return this._nodesMap[id];
    }
    /**
     * Check if item has unresolved incomes
     * @param item item to check
     */
}
