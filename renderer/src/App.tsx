import { useState, useEffect } from "react";
import { ReactFlow } from "@xyflow/react";
import type { Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

declare global {
  interface Window {
    renderDiagram: (jsonPayload: { nodes: Node[]; edges: Edge[] }) => void;
  }
}

export default function HeadlessRenderer() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    window.renderDiagram = (jsonPayload) => {
      setNodes(jsonPayload.nodes || []);
      setEdges(jsonPayload.edges || []);
    };
  }, []);

  return (
    <div style={{ width: "1024px", height: "768px" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView />
    </div>
  );
}
