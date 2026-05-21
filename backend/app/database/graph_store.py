import networkx as nx
from typing import List, Dict, Any, Tuple

class LocalGraphStore:
    """
    A Graph Database connector supporting relational associations and multi-hop cognitive traversal.
    Automatically falls back to a high-performance NetworkX graph when local dev mode is active.
    Fleshes out D3-compatible nodes and links for the interactive frontend visualization.
    """
    def __init__(self):
        self.graph = nx.DiGraph()

    def add_node(self, node_id: int, label: str, metadata: Dict[str, Any] = None) -> None:
        """
        Adds a node to the cognitive memory graph.
        """
        if metadata is None:
            metadata = {}
        self.graph.add_node(node_id, label=label, **metadata)

    def add_edge(self, source_id: int, target_id: int, relation: str, weight: float = 1.0) -> None:
        """
        Adds an association edge between two cognitive memories.
        """
        if self.graph.has_node(source_id) and self.graph.has_node(target_id):
            self.graph.add_edge(source_id, target_id, relation=relation, weight=weight)

    def get_related_nodes(self, node_id: int, max_depth: int = 2) -> List[Tuple[int, Dict[str, Any], str]]:
        """
        Performs multi-hop traversal to retrieve closely associated memories and relationship types.
        """
        if not self.graph.has_node(node_id):
            return []
            
        related = []
        # BFS traversal for multi-hop memory retrieval
        visited = {node_id}
        queue = [(node_id, 0)]
        
        while queue:
            curr, depth = queue.pop(0)
            if depth >= max_depth:
                continue
                
            for neighbor in self.graph.neighbors(curr):
                if neighbor not in visited:
                    visited.add(neighbor)
                    edge_data = self.graph.get_edge_data(curr, neighbor)
                    relation = edge_data.get("relation", "ASSOCIATED_WITH")
                    node_data = self.graph.nodes[neighbor]
                    related.append((neighbor, node_data, relation))
                    queue.append((neighbor, depth + 1))
                    
        return related

    def delete_node(self, node_id: int) -> None:
        """
        Safely removes a cognitive node and its surrounding connections.
        """
        if self.graph.has_node(node_id):
            self.graph.remove_node(node_id)

    def get_d3_graph(self) -> Dict[str, Any]:
        """
        Converts the active NetworkX graph into D3-compatible nodes and links for frontend drawing.
        """
        nodes = []
        links = []
        
        for node_id, attrs in self.graph.nodes(data=True):
            nodes.append({
                "id": str(node_id),
                "label": attrs.get("label", f"Memory #{node_id}"),
                "type": attrs.get("type", "episodic"),
                "importance": attrs.get("importance", 5.0)
            })
            
        for source, target, attrs in self.graph.edges(data=True):
            links.append({
                "source": str(source),
                "target": str(target),
                "type": attrs.get("relation", "RELATED_TO"),
                "weight": attrs.get("weight", 1.0)
            })
            
        return {"nodes": nodes, "links": links}

# Singleton graph database store for local development
graph_store = LocalGraphStore()
