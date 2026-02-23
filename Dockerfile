# Dùng Node.js 20 LTS làm base image
FROM node:20

# Cài đặt Claude Code CLI (giả định có trên npm)
RUN npm install -g @anthropic-ai/claude-code

# Tạo user non-root để không chạy bằng root
RUN useradd -m developer

# Chuyển sang user mới
USER developer

# Thư mục làm việc mặc định
WORKDIR /workspace

# Khi container khởi động sẽ gọi "claude"
ENTRYPOINT ["claude"]
