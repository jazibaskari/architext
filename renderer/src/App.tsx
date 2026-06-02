import { useState, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Position,
  Handle,
  Background,
  BackgroundVariant,
  BaseEdge,
  EdgeLabelRenderer,
} from "@xyflow/react";
import type { Node, Edge, EdgeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface ArchitecturePayload {
  nodes: Node[];
  edges: Edge[];
}

declare global {
  interface Window {
    renderDiagram: (payload: ArchitecturePayload) => void;
  }
}

interface NodeData {
  label: string;
  boxType?: string;
  color?: string;
  col?: number;
  row?: number;
}

const THEME_COLORS: Record<string, string> = {
  // Users, Entry points, Edge
  user: "#5ec2de",
  client: "#5ec2de",
  gateway: "#5ec2de",
  edge: "#5ec2de",

  // Frontend, UI, Web
  ui: "#00d2ff",
  ux: "#00d2ff",
  frontend: "#00d2ff",
  web: "#00d2ff",
  mobile: "#00d2ff",

  // Backend, APIs
  backend: "#6dd6a4",
  api: "#6dd6a4",
  server: "#6dd6a4",
  microservice: "#6dd6a4",
  controller: "#6dd6a4",

  //Serverless, Actions, Workers, Scripts
  action: "#ffd580",
  worker: "#ffd580",
  serverless: "#ffd580",
  job: "#ffd580",
  function: "#ffd580",
  script: "#ffd580",

  // Data, State, Databases, ML Pipelines
  data: "#f19ab2",
  database: "#f19ab2",
  state: "#f19ab2",
  pipeline: "#f19ab2",
  cache: "#f19ab2",
  storage: "#f19ab2",
  model: "#f19ab2",

  // Observability, Testing, Tracing, Logging
  testing: "#b48ead",
  observability: "#b48ead",
  monitoring: "#b48ead",
  analytics: "#b48ead",
  tracing: "#b48ead",
  logging: "#b48ead",
  metric: "#b48ead",

  // External Services, AI Providers, Auth
  external: "#eaa051",
  ai: "#eaa051",
  llm: "#eaa051",
  auth: "#eaa051",
  thirdparty: "#eaa051",

  default: "#888888",
};

const getNodeColor = (boxType?: string, overrideColor?: string) => {
  if (overrideColor) return overrideColor;
  if (!boxType) return THEME_COLORS.default;
  return THEME_COLORS[boxType.toLowerCase()] || THEME_COLORS.default;
};

const HighArchEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  sourceHandleId,
  targetHandleId,
  labelStyle,
  labelBgStyle,
}: EdgeProps) => {
  const ARCH_HEIGHT = 100;

  const isBottomLoop =
    sourceHandleId?.toLowerCase().includes("bottom") ||
    targetHandleId?.toLowerCase().includes("bottom");

  const midX = (sourceX + targetX) / 2;

  const controlY = isBottomLoop
    ? Math.max(sourceY, targetY) + ARCH_HEIGHT
    : Math.min(sourceY, targetY) - ARCH_HEIGHT;

  const offsetY = isBottomLoop ? 10 : -10;
  const edgePath = `M ${sourceX},${
    sourceY + offsetY
  } Q ${midX},${controlY} ${targetX},${targetY + offsetY}`;

  const labelX = midX;
  const labelY = isBottomLoop ? controlY - 25 : controlY + 25;

  const customLabelStyle = (labelStyle || {}) as any;
  const customLabelBgStyle = (labelBgStyle || {}) as any;

  return (
    <>
      <BaseEdge path={edgePath} style={{ strokeWidth: 2, stroke: "#5ec2de" }} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              background: customLabelBgStyle.fill || "#16161a",
              color: customLabelStyle.fill || "#a3a3a3",
              opacity: customLabelBgStyle.fillOpacity ?? 1,
              fontWeight: customLabelStyle.fontWeight || 500,
              fontSize: customLabelStyle.fontSize || 11,
              fontFamily: customLabelStyle.fontFamily || "monospace",
              padding: "4px 4px",
              borderRadius: 4,
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const ImageNode = ({ data }: { data: NodeData }) => {
  const resolvedColor = getNodeColor(data.boxType, data.color);

  return (
    <div
      style={{
        padding: "12px 24px",
        border: `2px solid ${resolvedColor}`,
        borderRadius: "8px",
        background: "#16161a",
        color: resolvedColor,
        fontFamily: "monospace",
        fontSize: "14px",
        fontWeight: 600,
        textAlign: "center",
        minWidth: "160px",
        position: "relative",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        style={{ opacity: 0, left: "50%" }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{ opacity: 0, left: "50%" }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        style={{ opacity: 0, left: "50%" }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{ opacity: 0, left: "50%" }}
      />
    </div>
  );
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const COL_WIDTH = 350;
  const ROW_HEIGHT = 130;

  const layoutedNodes = nodes.map((node) => {
    const nodeData = node.data as unknown as NodeData;
    const col = nodeData?.col ?? 0;
    const row = nodeData?.row ?? 0;

    return {
      ...node,
      type: "imageNode",
      position: { x: col * COL_WIDTH, y: row * ROW_HEIGHT },
    };
  });

  const layoutedEdges = edges.map((edge) => {
    const isArchEdge =
      edge.sourceHandle?.toLowerCase().includes("top") ||
      edge.targetHandle?.toLowerCase().includes("top") ||
      edge.sourceHandle?.toLowerCase().includes("bottom") ||
      edge.targetHandle?.toLowerCase().includes("bottom");

    return {
      ...edge,
      type: isArchEdge ? "highArch" : "bezier",
      pathOptions: { curvature: 0.6 },

      labelStyle: {
        fill: "#8b949e",
        color: "#8b949e",
        fontWeight: 500,
        fontSize: 11,
        fontFamily: "monospace",
      },
      labelBgStyle: { fill: "#2c2c2c", fillOpacity: 1 },
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
};

export default function HeadlessRenderer() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const nodeTypes = useMemo(() => ({ imageNode: ImageNode }), []);
  const edgeTypes = useMemo(() => ({ highArch: HighArchEdge }), []);

  useEffect(() => {
    window.renderDiagram = (jsonPayload: ArchitecturePayload) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(jsonPayload.nodes || [], jsonPayload.edges || []);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    };
  }, []);

  return (
    <div
      style={{ width: "1280px", height: "1024px", backgroundColor: "#111113" }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        colorMode="dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#222"
        />
      </ReactFlow>
    </div>
  );
}
