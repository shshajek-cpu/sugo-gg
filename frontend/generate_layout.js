
const fs = require('fs');

const rawNodes = [
    { "index": 0, "row": 1, "col": 3, "type": "common" },
    { "index": 1, "row": 1, "col": 2, "type": "common" },
    { "index": 2, "row": 1, "col": 1, "type": "unique" },
    { "index": 3, "row": 1, "col": 7, "type": "legend" },
    { "index": 4, "row": 1, "col": 6, "type": "common" },
    { "index": 5, "row": 1, "col": 5, "type": "rare" },
    { "index": 6, "row": 1, "col": 11, "type": "unique" },
    { "index": 7, "row": 1, "col": 10, "type": "common" },
    { "index": 8, "row": 1, "col": 9, "type": "rare" },
    { "index": 9, "row": 2, "col": 4, "type": "common" },
    { "index": 10, "row": 2, "col": 3, "type": "legend" },
    { "index": 11, "row": 2, "col": 1, "type": "common" },
    { "index": 12, "row": 2, "col": 8, "type": "common" },
    { "index": 13, "row": 2, "col": 7, "type": "common" },
    { "index": 14, "row": 2, "col": 5, "type": "common" },
    { "index": 15, "row": 2, "col": 11, "type": "common" },
    { "index": 16, "row": 2, "col": 9, "type": "common" },
    { "index": 17, "row": 3, "col": 1, "type": "rare" },
    { "index": 18, "row": 3, "col": 5, "type": "common" },
    { "index": 19, "row": 3, "col": 3, "type": "common" },
    { "index": 20, "row": 3, "col": 2, "type": "common" },
    { "index": 21, "row": 3, "col": 9, "type": "legend" },
    { "index": 22, "row": 3, "col": 7, "type": "common" },
    { "index": 23, "row": 3, "col": 6, "type": "legend" },
    { "index": 24, "row": 3, "col": 11, "type": "rare" },
    { "index": 25, "row": 3, "col": 10, "type": "common" },
    { "index": 26, "row": 4, "col": 2, "type": "common" },
    { "index": 27, "row": 4, "col": 5, "type": "common" },
    { "index": 28, "row": 4, "col": 9, "type": "common" },
    { "index": 29, "row": 4, "col": 7, "type": "common" },
    { "index": 30, "row": 4, "col": 11, "type": "common" },
    { "index": 31, "row": 5, "col": 3, "type": "legend" },
    { "index": 32, "row": 5, "col": 2, "type": "common" },
    { "index": 33, "row": 5, "col": 1, "type": "common" },
    { "index": 34, "row": 5, "col": 7, "type": "common" },
    { "index": 35, "row": 5, "col": 6, "type": "common" },
    { "index": 36, "row": 5, "col": 5, "type": "common" },
    { "index": 37, "row": 5, "col": 4, "type": "common" },
    { "index": 38, "row": 5, "col": 11, "type": "common" },
    { "index": 39, "row": 5, "col": 10, "type": "common" },
    { "index": 40, "row": 5, "col": 9, "type": "common" },
    { "index": 41, "row": 5, "col": 8, "type": "rare" },
    { "index": 42, "row": 6, "col": 4, "type": "common" },
    { "index": 43, "row": 6, "col": 1, "type": "legend" },
    { "index": 44, "row": 6, "col": 8, "type": "common" },
    { "index": 45, "row": 6, "col": 6, "type": "start" },
    { "index": 46, "row": 6, "col": 11, "type": "legend" },
    { "index": 47, "row": 7, "col": 1, "type": "common" },
    { "index": 48, "row": 7, "col": 5, "type": "common" },
    { "index": 49, "row": 7, "col": 4, "type": "rare" },
    { "index": 50, "row": 7, "col": 3, "type": "common" },
    { "index": 51, "row": 7, "col": 2, "type": "common" },
    { "index": 52, "row": 7, "col": 9, "type": "legend" },
    { "index": 53, "row": 7, "col": 8, "type": "common" },
    { "index": 54, "row": 7, "col": 7, "type": "common" },
    { "index": 55, "row": 7, "col": 6, "type": "common" },
    { "index": 56, "row": 7, "col": 11, "type": "common" },
    { "index": 57, "row": 7, "col": 10, "type": "common" },
    { "index": 58, "row": 8, "col": 1, "type": "common" },
    { "index": 59, "row": 8, "col": 5, "type": "common" },
    { "index": 60, "row": 8, "col": 3, "type": "common" },
    { "index": 61, "row": 8, "col": 10, "type": "common" },
    { "index": 62, "row": 8, "col": 7, "type": "common" },
    { "index": 63, "row": 9, "col": 3, "type": "legend" },
    { "index": 64, "row": 9, "col": 2, "type": "common" },
    { "index": 65, "row": 9, "col": 1, "type": "rare" },
    { "index": 66, "row": 9, "col": 7, "type": "common" },
    { "index": 67, "row": 9, "col": 6, "type": "legend" },
    { "index": 68, "row": 9, "col": 5, "type": "common" },
    { "index": 69, "row": 9, "col": 11, "type": "rare" },
    { "index": 70, "row": 9, "col": 10, "type": "common" },
    { "index": 71, "row": 9, "col": 9, "type": "common" },
    { "index": 72, "row": 10, "col": 4, "type": "common" },
    { "index": 73, "row": 10, "col": 3, "type": "common" },
    { "index": 74, "row": 10, "col": 1, "type": "common" },
    { "index": 75, "row": 10, "col": 8, "type": "common" },
    { "index": 76, "row": 10, "col": 7, "type": "common" },
    { "index": 77, "row": 10, "col": 5, "type": "common" },
    { "index": 78, "row": 10, "col": 11, "type": "common" },
    { "index": 79, "row": 10, "col": 9, "type": "legend" },
    { "index": 80, "row": 11, "col": 1, "type": "unique" },
    { "index": 81, "row": 11, "col": 5, "type": "legend" },
    { "index": 82, "row": 11, "col": 3, "type": "rare" },
    { "index": 83, "row": 11, "col": 2, "type": "common" },
    { "index": 84, "row": 11, "col": 9, "type": "common" },
    { "index": 85, "row": 11, "col": 7, "type": "rare" },
    { "index": 86, "row": 11, "col": 6, "type": "common" },
    { "index": 87, "row": 11, "col": 11, "type": "unique" },
    { "index": 88, "row": 11, "col": 10, "type": "common" }
];

// Constants
const CELL_SIZE = 80;
const CENTER_ROW = 6;
const CENTER_COL = 6;

// 1. Calculate distances and sort
const processedNodes = rawNodes.map(node => {
    const dr = node.row - CENTER_ROW;
    const dc = node.col - CENTER_COL;
    const dist = Math.abs(dr) + Math.abs(dc); // Manhattan distance for diamond shape
    // const dist = Math.sqrt(dr*dr + dc*dc); // Euclidean for circle

    // Use Manhattan because daevanion nodes often connect cardinally
    return { ...node, dist, originalIndex: node.index };
});

// Sort: Primary by distance, Secondary by angle/row/col for stability
processedNodes.sort((a, b) => {
    if (a.dist !== b.dist) return a.dist - b.dist;
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
});

// 2. Re-index and calculate coordinates
const layout = processedNodes.map((node, newIndex) => {
    return {
        id: newIndex,
        x: (node.col - 1) * CELL_SIZE, // 0-based pixel coords
        y: (node.row - 1) * CELL_SIZE,
        type: node.type,
        // Store original row/col for connection checking
        row: node.row,
        col: node.col,
        connections: []
    };
});

// 3. Connect neighbors
// Create a map for quick lookup: "row,col" -> id
const nodeMap = new Map();
layout.forEach(node => {
    nodeMap.set(`${node.row},${node.col}`, node.id);
});

layout.forEach(node => {
    const neighbors = [
        { r: node.row - 1, c: node.col }, // Up
        { r: node.row + 1, c: node.col }, // Down
        { r: node.row, c: node.col - 1 }, // Left
        { r: node.row, c: node.col + 1 }  // Right
    ];

    neighbors.forEach(n => {
        const key = `${n.r},${n.c}`;
        if (nodeMap.has(key)) {
            node.connections.push(nodeMap.get(key));
        }
    });

    // Clean up temporary props
    // delete node.row;
    // delete node.col;
});

// 4. Generate TS Output
const output = `export interface NodePosition {
    id: number;
    x: number;
    y: number;
    row: number;
    col: number;
    type: 'common' | 'rare' | 'unique' | 'legend' | 'start';
    connections: number[];
}

export const DAEVANION_LAYOUT: NodePosition[] = ${JSON.stringify(layout, null, 4)};

export const TOTAL_NODES = ${layout.length};
`;

console.log(output);
