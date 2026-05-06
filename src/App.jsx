import { useState, useCallback, useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

// ── Tree Data ─────────────────────────────────────────────────────────────────
const TREE = {
  id: "root", label: "Root", meta: "Root node · depth 0",
  children: [
    { id: "A", label: "Node A", meta: "Child of Root · depth 1", children: [
        { id: "A1", label: "Node A1", meta: "Child of A · depth 2", children: [
            { id: "A1a", label: "Node A1a", meta: "Leaf · depth 3", children: [] },
            { id: "A1b", label: "Node A1b", meta: "Leaf · depth 3", children: [] },
        ]},
        { id: "A2", label: "Node A2", meta: "Child of A · depth 2", children: [
            { id: "A2a", label: "Node A2a", meta: "Leaf · depth 3", children: [] },
        ]},
    ]},
    { id: "B", label: "Node B", meta: "Child of Root · depth 1", children: [
        { id: "B1", label: "Node B1", meta: "Child of B · depth 2", children: [
            { id: "B1a", label: "Node B1a", meta: "Leaf · depth 3", children: [] },
            { id: "B1b", label: "Node B1b", meta: "Leaf · depth 3", children: [] },
        ]},
        { id: "B2", label: "Node B2", meta: "Child of B · depth 2", children: [
            { id: "B2a", label: "Node B2a", meta: "Leaf · depth 3", children: [] },
        ]},
    ]},
    { id: "C", label: "Node C", meta: "Child of Root · depth 1", children: [
        { id: "C1", label: "Node C1", meta: "Child of C · depth 2", children: [
            { id: "C1a", label: "Node C1a", meta: "Leaf · depth 3", children: [] },
        ]},
        { id: "C2", label: "Node C2", meta: "Child of C · depth 2", children: [
            { id: "C2a", label: "Node C2a", meta: "Leaf · depth 3", children: [] },
            { id: "C2b", label: "Node C2b", meta: "Leaf · depth 3", children: [] },
        ]},
    ]},
  ],
};

// ── Layout constants ──────────────────────────────────────────────────────────
const NW = 130, NH = 44, HG = 28, VG = 90;

function subtreeWidth(node, collapsed) {
  if (!node.children.length || collapsed.has(node.id)) return NW;
  const cw = node.children.map((c) => subtreeWidth(c, collapsed));
  return Math.max(NW, cw.reduce((s, w) => s + w, 0) + HG * (node.children.length - 1));
}

function buildGraph(node, collapsed, cx, cy, nodes, edges, searchTerm, selected) {
  const isCollapsed = collapsed.has(node.id);
  const hasChildren = node.children.length > 0;
  const isMatch = !!searchTerm && node.label.toLowerCase().includes(searchTerm.toLowerCase());

  nodes.push({
    id: node.id,
    type: "treeNode",
    position: { x: cx - NW / 2, y: cy },
    // smooth position transitions
    style: { transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)" },
    data: { label: node.label, meta: node.meta || "", hasChildren, isCollapsed, isSelected: selected === node.id, isMatch },
  });

  if (!isCollapsed && node.children.length) {
    const widths = node.children.map((c) => subtreeWidth(c, collapsed));
    const total = widths.reduce((s, w) => s + w, 0) + HG * (node.children.length - 1);
    let startX = cx - total / 2;
    node.children.forEach((child, i) => {
      const childCX = startX + widths[i] / 2;
      edges.push({
        id: `${node.id}-${child.id}`,
        source: node.id,
        target: child.id,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#475569", strokeWidth: 1.5, transition: "all 0.35s ease" },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#475569", width: 12, height: 12 },
      });
      buildGraph(child, collapsed, childCX, cy + NH + VG, nodes, edges, searchTerm, selected);
      startX += widths[i] + HG;
    });
  }
}

// ── Custom Node ───────────────────────────────────────────────────────────────
function TreeNode({ id, data }) {
  const { label, meta, hasChildren, isCollapsed, isSelected, isMatch } = data;
  const [hovered, setHovered] = useState(false);
  const [badgeHovered, setBadgeHovered] = useState(false);
  const [justToggled, setJustToggled] = useState(false);

  const bg = isMatch
    ? "#f59e0b"
    : isSelected
    ? "#1d4ed8"
    : hovered
    ? "linear-gradient(160deg,#263548,#131f30)"
    : "linear-gradient(160deg,#1e293b,#0f172a)";

  const border = isMatch
    ? "2px solid #d97706"
    : isSelected
    ? "2px solid #93c5fd"
    : hovered
    ? "1.5px solid #64748b"
    : "1.5px solid #334155";

  const handleToggle = () => {
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 400);
    window.__toggle && window.__toggle(id);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: NW, height: NH,
        background: bg, border, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
        boxShadow: isSelected
          ? "0 0 0 3px rgba(59,130,246,0.4),0 4px 16px rgba(0,0,0,0.5)"
          : hovered
          ? "0 6px 20px rgba(0,0,0,0.6)"
          : "0 4px 12px rgba(0,0,0,0.4)",
        fontFamily: "'IBM Plex Mono',monospace",
        cursor: "default",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        transition: "all 0.18s ease",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, pointerEvents: "none" }} />

      <span style={{
        color: isMatch ? "#1e293b" : "#e2e8f0",
        fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", userSelect: "none",
      }}>
        {label}
      </span>

      {hasChildren && (
        <div
          onMouseDown={(e) => { e.stopPropagation(); handleToggle(); }}
          onMouseEnter={() => setBadgeHovered(true)}
          onMouseLeave={() => setBadgeHovered(false)}
          style={{
            position: "absolute", bottom: -13, left: "50%",
            transform: `translateX(-50%) scale(${justToggled ? 1.35 : badgeHovered ? 1.15 : 1}) rotate(${justToggled ? "180deg" : "0deg"})`,
            width: 22, height: 22, borderRadius: "50%",
            background: isCollapsed ? "#f59e0b" : "#475569",
            border: "2px solid #080f1a",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", zIndex: 10,
            boxShadow: badgeHovered ? "0 0 8px rgba(245,158,11,0.5)" : "0 2px 6px rgba(0,0,0,0.5)",
            transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <span style={{
            color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1, pointerEvents: "none",
            display: "block",
            transition: "transform 0.25s ease",
            transform: isCollapsed ? "rotate(0deg)" : "rotate(0deg)",
          }}>
            {isCollapsed ? "+" : "−"}
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}

const nodeTypes = { treeNode: TreeNode };

// ── Info Panel ────────────────────────────────────────────────────────────────
function InfoPanel({ nodeId, nodeData, collapsed }) {
  if (!nodeId || !nodeData) return null;
  return (
    <div style={{
      position: "absolute", bottom: 50, right: 16,
      background: "#0f172a", border: "1px solid #334155",
      borderRadius: 12, padding: "14px 18px", zIndex: 20,
      minWidth: 180, maxWidth: 220,
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{ color: "#93c5fd", fontWeight: 700, fontSize: 12, marginBottom: 8, fontFamily: "'IBM Plex Mono',monospace" }}>
        {nodeData.label}
      </div>
      <div style={{ color: "#94a3b8", fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1.8 }}>
        <div>{nodeData.meta}</div>
        <div style={{ marginTop: 4, color: "#64748b" }}>
          Children: {nodeData.hasChildren ? (collapsed.has(nodeId) ? "hidden" : "visible") : "none"}
        </div>
        <div style={{ color: "#64748b" }}>
          Status: {collapsed.has(nodeId) ? "🟡 Collapsed" : "🟢 Expanded"}
        </div>
      </div>
    </div>
  );
}

// ── Inner component (needs ReactFlow context) ─────────────────────────────────
function TreeFlow() {
  const [collapsed, setCollapsed] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [selectedData, setSelectedData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  const toggle = useCallback((id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    // re-fit after animation settles
    setTimeout(() => fitView({ duration: 400, padding: 0.3 }), 380);
  }, [fitView]);

  useEffect(() => {
    window.__toggle = toggle;
    return () => { delete window.__toggle; };
  }, [toggle]);

  useEffect(() => {
    const ns = [], es = [];
    buildGraph(TREE, collapsed, 0, 0, ns, es, searchTerm, selected);
    setNodes(ns);
    setEdges(es);
  }, [collapsed, searchTerm, selected]);

  const onNodeClick = useCallback((_, node) => {
    setSelected((prev) => (prev === node.id ? null : node.id));
    setSelectedData((prev) => (prev?.label === node.data.label ? null : node.data));
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#080f1a", display: "flex", flexDirection: "column", fontFamily: "'IBM Plex Mono',monospace" }}>

      {/* Header */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid #1e293b", background: "#0a1628", display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
        <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          🌲 Tree View
        </span>

        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 13, pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Search nodes…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "7px 12px 7px 32px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 11, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", gap: 16, marginLeft: "auto" }}>
          {[["#f59e0b","Collapsed/Match"],["#2563eb","Selected"],["#334155","Expanded"]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              <span style={{ color: "#64748b", fontSize: 10 }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.15}
          maxZoom={2.5}
          panOnScroll
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1e293b" gap={28} size={1} />
          <Controls style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
          <MiniMap
            nodeColor={(n) => n.data?.isMatch ? "#f59e0b" : n.data?.isSelected ? "#2563eb" : "#334155"}
            style={{ background: "#0a1628", border: "1px solid #1e293b", borderRadius: 8 }}
          />
        </ReactFlow>
        <InfoPanel nodeId={selected} nodeData={selectedData} collapsed={collapsed} />
      </div>

      {/* Footer */}
      <div style={{ padding: "7px 24px", borderTop: "1px solid #1e293b", color: "#475569", fontSize: 10, background: "#0a1628", flexShrink: 0, display: "flex", gap: 24 }}>
        <span>Click <b style={{color:"#64748b"}}>+/−</b> badge to expand/collapse</span>
        <span>Click node to <b style={{color:"#64748b"}}>select</b></span>
        <span>Search to <b style={{color:"#f59e0b"}}>highlight</b></span>
        <span>Scroll to zoom · Drag to pan</span>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .react-flow__node { transition: transform 0.35s cubic-bezier(0.4,0,0.2,1) !important; }
      `}</style>
    </div>
  );
}

// ── Root export (wraps with ReactFlowProvider for useReactFlow hook) ───────────
export default function App() {
  return (
    <ReactFlowProvider>
      <TreeFlow />
    </ReactFlowProvider>
  );
}
