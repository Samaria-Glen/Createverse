/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/
import { useEffect, useMemo, useState } from 'react'
import { Edge, EdgeChange, Node, NodeChange, useKeyPress } from 'reactflow'
import { v4 as uuidv4 } from 'uuid'

import { useBehaveGraphFlow } from './useBehaveGraphFlow'

type BehaveGraphFlow = ReturnType<typeof useBehaveGraphFlow>

export const useSelectionHandler = ({
  nodes,
  onNodesChange,
  onEdgesChange
}: Pick<BehaveGraphFlow, 'onNodesChange' | 'onEdgesChange'> & {
  nodes: Node[]
}) => {
  const ctrlCPressed = useKeyPress(['Control+c', 'Meta+c'])
  const ctrlVPressed = useKeyPress(['Control+v', 'Meta+v'])
  const [selectedNodes, setSelectedNodes] = useState([] as Node[])
  const [selectedEdges, setSelectedEdges] = useState([] as Edge[])

  const [copiedNodes, setCopiedNodes] = useState([] as Node[])
  const [copiedEdges, setCopiedEdges] = useState([] as Edge[])

  const copyNodes = () => {
    setCopiedNodes(selectedNodes)
    setCopiedEdges(selectedEdges)
  }

  const pasteNodes = () => {
    const minPosLeft = Math.min(...copiedNodes.map((node) => node.position.x))
    const maxPosLeft = Math.max(...copiedNodes.map((node) => node.position.x))
    const nodeMaxPosX = copiedNodes.reduce(
      (maxNode, currentNode) => (currentNode.position.x > maxNode.position.x ? currentNode : maxNode),
      copiedNodes[0]
    )

    const nodeIdMap = new Map<string, string>()
    const newNodes = copiedNodes.map((node) => {
      nodeIdMap[node.id] = uuidv4()
      return {
        ...node,
        id: nodeIdMap[node.id],
        position: {
          x: maxPosLeft + (node.position.x - minPosLeft) + nodeMaxPosX.width! + 20,
          y: node.position.y
        }
      }
    })

    const newEdgeChange: EdgeChange[] = copiedEdges.map((edge) => {
      return {
        type: 'add',
        item: {
          ...edge,
          id: uuidv4(),
          source: nodeIdMap[edge.source],
          target: nodeIdMap[edge.target]
        }
      }
    })

    const newNodeChange: NodeChange[] = newNodes.map((node) => ({
      type: 'add',
      item: node
    }))

    onNodesChange(newNodeChange)
    onEdgesChange(newEdgeChange)
    setCopiedNodes(newNodes)
  }

  const onSelectionChange = useMemo(
    () => (elements) => {
      setSelectedNodes(elements.nodes)
      setSelectedEdges(elements.edges)
    },
    [selectedNodes]
  )

  useEffect(() => {
    if (!ctrlCPressed || selectedNodes.length === 0) return
    copyNodes()
  }, [ctrlCPressed])

  useEffect(() => {
    if (!ctrlVPressed || copiedNodes.length === 0) return
    pasteNodes()
  }, [ctrlVPressed])

  return { onSelectionChange }
}
