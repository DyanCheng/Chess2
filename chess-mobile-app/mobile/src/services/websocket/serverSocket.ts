import { io, Socket } from 'socket.io-client';
import { serverConfig } from '../serverConfig';
import { apiService } from '../api/apiService';

let socket: Socket | null = null;
let connectedUrl = '';
let connectedToken = '';

export async function getServerSocket(): Promise<Socket> {
  const url = await serverConfig.getUrl();
  if (!url) throw new Error('Chưa cấu hình máy chủ. Mở Cài đặt và nhập địa chỉ LAN của backend.');
  const token = apiService.getToken();
  if (!token) throw new Error('Đăng nhập trước khi chơi PvP.');
  if (!socket || connectedUrl !== url || connectedToken !== token) {
    socket?.disconnect();
    connectedUrl = url;
    connectedToken = token;
    socket = io(url, { autoConnect: false, transports: ['websocket'], reconnection: true, auth: { token } });
  }
  const current = socket;
  if (current.connected) return current;

  return new Promise<Socket>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Không kết nối được backend. Kiểm tra IP, cổng 8080 và mạng Wi-Fi.'));
    }, 8000);
    const onConnect = () => { cleanup(); resolve(current); };
    const onError = (error: Error) => { cleanup(); reject(error); };
    const cleanup = () => {
      clearTimeout(timeout);
      current.off('connect', onConnect);
      current.off('connect_error', onError);
    };
    current.on('connect', onConnect);
    current.on('connect_error', onError);
    current.connect();
  });
}
