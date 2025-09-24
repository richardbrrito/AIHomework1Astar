"use client";

import { useState } from "react";

export default function Home() {
  const [pieces, setPieces] = useState<string[]>([]);
  const [board, setBoard] = useState<number[]>([]);
  const [win, setWin] = useState(false);

  // Slice uploaded image into 9 tiles
  function sliceImage(image: HTMLImageElement): string[] {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const pieces: string[] = [];

    const size = Math.min(image.width, image.height);
    const pieceSize = size / 3;

    canvas.width = pieceSize;
    canvas.height = pieceSize;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.clearRect(0, 0, pieceSize, pieceSize);
        ctx.drawImage(
          image,
          col * pieceSize,
          row * pieceSize,
          pieceSize,
          pieceSize,
          0,
          0,
          pieceSize,
          pieceSize
        );
        pieces.push(canvas.toDataURL());
      }
    }

    return pieces;
  }

  interface Node {
    board: number[];
    blankIndex: number;
    path: number[][];
    cost: number;
  }

  function manhattan(board: number[]) {
    let dist = 0;
    for (let i = 0; i < 9; i++) {
      if (board[i] === 8) continue;
      const x1 = Math.floor(i / 3),
        y1 = i % 3;
      const x2 = Math.floor(board[i] / 3),
        y2 = board[i] % 3;
      dist += Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }
    return dist;
  }

  function aStarSolve(startBoard: number[]): number[][] {
    const visited = new Set<string>();
    const queue: Node[] = [
      {
        board: startBoard,
        blankIndex: startBoard.indexOf(8),
        path: [startBoard],
        cost: manhattan(startBoard),
      },
    ];

    while (queue.length) {
      queue.sort((a, b) => a.cost - b.cost);
      const node = queue.shift()!;
      const key = node.board.join(",");
      if (visited.has(key)) continue;
      visited.add(key);

      if (arraysEqual(node.board, [...Array(9).keys()])) {
        return node.path;
      }

      const { blankIndex, board: b } = node;
      const moves = [-1, 1, -3, 3];
      for (let move of moves) {
        const newIndex = blankIndex + move;
        const row = Math.floor(blankIndex / 3),
          col = blankIndex % 3;
        const newRow = Math.floor(newIndex / 3),
          newCol = newIndex % 3;

        if (newIndex < 0 || newIndex > 8) continue;
        if (Math.abs(newRow - row) + Math.abs(newCol - col) !== 1) continue;

        const newBoard = [...b];
        [newBoard[blankIndex], newBoard[newIndex]] = [
          newBoard[newIndex],
          newBoard[blankIndex],
        ];

        queue.push({
          board: newBoard,
          blankIndex: newIndex,
          path: [...node.path, newBoard],
          cost: manhattan(newBoard) + node.path.length,
        });
      }
    }

    return [];
  }

  // Check if a board is solvable
  function isSolvable(arr: number[]) {
    let inv = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] !== 8 && arr[j] !== 8 && arr[i] > arr[j]) inv++;
      }
    }
    return inv % 2 === 0;
  }

  function shuffleBoard(): number[] {
    let arr = [...Array(9).keys()]; // 0-8
    do {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    } while (!isSolvable(arr) || arraysEqual(arr, [...Array(9).keys()]));
    return arr;
  }

  const handleShuffle = () => {
    if (pieces.length === 0) return;
    const shuffled = shuffleBoard();
    setBoard(shuffled);
    setWin(false);
  };

  function arraysEqual(a: number[], b: number[]) {
    return a.every((val, i) => val === b[i]);
  }

  const handleSolve = () => {
    if (pieces.length === 0) return;
    const path = aStarSolve(board);
    if (path.length === 0) return;

    path.forEach((state, idx) => {
      setTimeout(() => {
        setBoard(state);
        if (idx === path.length - 1) setWin(true);
      }, idx * 500);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        const slices = sliceImage(img);
        setPieces(slices);

        const shuffled = shuffleBoard();
        setBoard(shuffled);
        setWin(false);
      };
    }
  };

  const handleMove = (index: number) => {
    const blankIndex = board.indexOf(8);
    const row = Math.floor(index / 3);
    const col = index % 3;
    const blankRow = Math.floor(blankIndex / 3);
    const blankCol = blankIndex % 3;

    if (Math.abs(row - blankRow) + Math.abs(col - blankCol) === 1) {
      const newBoard = [...board];
      [newBoard[index], newBoard[blankIndex]] = [
        newBoard[blankIndex],
        newBoard[index],
      ];
      setBoard(newBoard);
      if (arraysEqual(newBoard, [...Array(9).keys()])) setWin(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-900 text-white py-4 px-8">
        <h1 className="text-2xl font-bold">AI Homework 1</h1>
      </header>

      <main className="flex flex-1 items-center justify-center bg-gray-100">
        <div className="max-w-2xl bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-semibold mb-4 text-center text-black">
            Welcome to the 8-Puzzle Solver
          </h2>
          <p className="text-gray-600 text-justify">
            Upload an image to generate an interactive 8-puzzle game. Shuffle it
            and try solving manually, or watch the optimal A* solution step by
            step.
          </p>

          <div className="flex justify-center mt-6 space-x-4">
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="fileInput"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              Upload Image
            </label>
          </div>

          {pieces.length > 0 && (
            <div className="flex flex-col items-center mt-6">
              <p className="text-gray-700 font-medium mb-2 text-center">
                Puzzle:
              </p>

              {/* Puzzle grid */}
              <div className="grid grid-cols-3 grid-rows-3 gap-1 w-72 h-72">
                {board.map((tileIndex, i) => (
                  <div
                    key={i}
                    onClick={() => handleMove(i)}
                    className="flex items-center justify-center bg-gray-200 overflow-hidden cursor-pointer"
                  >
                    {tileIndex !== 8 && (
                      <img
                        src={pieces[tileIndex]}
                        alt={`Tile ${tileIndex}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Shuffle & Solve buttons */}
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={handleShuffle}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Shuffle
                </button>
                <button
                  onClick={handleSolve}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Solve
                </button>
              </div>

              {win && (
                <p className="text-green-600 font-bold mt-4">
                  You solved the puzzle! 🎉
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-4 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Richard Brito
        </p>
      </footer>
    </div>
  );
}
