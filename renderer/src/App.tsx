import { useState, useEffect } from "react";
import { ReactFlow } from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";

interface ArchitecturePayload {
  nodes: Node[];
  edges: Edge[];
}

declare global {
  interface Window {
    renderDiagram: (payload: ArchitecturePayload) => void;
  }
}

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: "TB" });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 150 / 2,
        y: nodeWithPosition.y - 50 / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function HeadlessRenderer() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    (window as unknown as Window).renderDiagram = (jsonPayload) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(jsonPayload.nodes || [], jsonPayload.edges || []);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    };
  }, []);

  return (
    <div style={{ width: "1024px", height: "768px" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView />
    </div>
  );
}
