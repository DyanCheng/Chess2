// Bổ sung các hàm kiểm tra trạng thái ván đấu vào lớp ChessGame
  public isGameOver(): boolean {
    return this.checkStalemate() || this.checkInsufficientMaterial();
  }

  // GAME-011: Kiểm tra Stalemate (Hết nước đi nhưng không bị chiếu)
  public checkStalemate(): boolean {
    // Duyệt qua tất cả các quân của lượt hiện tại, nếu còn ít nhất 1 nước đi hợp lệ thì chưa stalemate
    const grid = this.board.getGrid();
    const lastMove = this.moveHistory[this.moveHistory.length - 1];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = grid[r][c];
        if (piece && piece.color === this.currentTurn) {
          // Thử đi đến tất cả các ô trên bàn cờ
          for (let tr = 0; tr < 8; tr++) {
            for (let tc = 0; tc < 8; tc++) {
              if (MoveValidator.isValidMove(grid, { row: r, col: c }, { row: tr, col: tc }, lastMove)) {
                return false; // Còn ít nhất 1 nước đi hợp lệ -> không phải stalemate
              }
            }
          }
        }
      }
    }
    return true; // Không còn nước nào đi được
  }

  // GAME-012: Kiểm tra thiếu quân (Insufficient Material) để chiếu hết
  public checkInsufficientMaterial(): boolean {
    const grid = this.board.getGrid();
    const pieces: { type: string; color: string }[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = grid[r][c];
        if (piece) {
          pieces.push({ type: piece.type, color: piece.color });
        }
      }
    }

    // Chỉ còn 2 Vua
    if (pieces.length === 2) return true;

    // Vua + Mã hoặc Vua + Tượng đấu với Vua đơn lẻ
    if (pieces.length === 3) {
      const hasMinorPiece = pieces.some(p => p.type === 'knight' || p.type === 'bishop');
      if (hasMinorPiece) return true;
    }

    return false;
  }

  // GAME-015: Serialize trạng thái ván đấu (để lưu vào Database hoặc gửi qua WebSocket)
  public serializeState(): string {
    return JSON.stringify({
      board: this.board.getGrid(),
      currentTurn: this.currentTurn,
      moveHistory: this.moveHistory
    });
  }

  // GAME-015: Restore trạng thái ván đấu từ Database
  public restoreState(serializedData: string): boolean {
    try {
      const data = JSON.parse(serializedData);
      // Gán lại dữ liệu cho game
      this.currentTurn = data.currentTurn;
      this.moveHistory = data.moveHistory;
      // Khôi phục mảng board grid
      const grid = this.board.getGrid();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          grid[r][c] = data.board[r][c];
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }git status