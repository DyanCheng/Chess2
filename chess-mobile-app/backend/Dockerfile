# Bước 1: Môi trường Build
FROM node:20-alpine AS builder

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Copy các file quản lý thư viện vào trước để tận dụng cache
COPY package*.json ./

# Cài đặt toàn bộ thư viện (bao gồm cả thư viện dev để build code)
RUN npm install

# Copy toàn bộ mã nguồn dự án vào container
COPY . .

# Build mã nguồn TypeScript sang JavaScript (lưu vào thư mục dist/)
RUN npm run build

# Bước 2: Môi trường Chạy (Production)
FROM node:20-alpine

WORKDIR /app

# Chỉ copy lại các file thực sự cần thiết từ Bước 1
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Thông báo container sẽ chạy ở cổng 3000
EXPOSE 3000

# Lệnh khởi động server khi container chạy
CMD ["npm", "run", "start:prod"]