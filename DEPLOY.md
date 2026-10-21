# Triển khai backend Lean Export lên Cloudflare

Website chạy đầy đủ (giao diện + backend + cơ sở dữ liệu) trên **Cloudflare Workers + D1**.
Bản GitHub Pages hiện tại vẫn hoạt động nhưng chỉ là bản tĩnh để xem trước: form sẽ tự chuyển
sang gửi qua email, trang `/admin` và Tin tức mới không dùng được ở đó.

## Backend gồm những gì

| Tính năng                                                                    | Ở đâu                                        |
| ---------------------------------------------------------------------------- | -------------------------------------------- |
| Lưu yêu cầu báo giá / liên hệ (chống spam: ô ẩn + giới hạn 5 lần/10 phút/IP) | Form trên trang Contact, Báo giá, Thị trường |
| Email báo cho sales + email xác nhận cho khách (song ngữ)                    | Qua Resend                                   |
| Trang quản trị: xem, lọc, tìm, đổi trạng thái, ghi chú, xóa, xuất CSV        | `/admin`                                     |
| Tin tức song ngữ: soạn, xem trước, nháp/đăng, ảnh bìa                        | `/admin/news` → hiển thị ở `/news`           |

Bảng dữ liệu được **tự tạo** ở lần chạy đầu tiên — không cần chạy migration.

## Cài đặt lần đầu (làm một lần)

> Các lệnh chạy trong thư mục dự án. Bạn tự đăng nhập và tự nhập mật khẩu/khóa —
> không gửi chúng cho ai và không ghi vào file trong repo.

1. **Tạo tài khoản Cloudflare** (miễn phí) tại https://dash.cloudflare.com/sign-up.
2. **Đăng nhập Wrangler** (mở trình duyệt để bạn xác nhận):
   ```sh
   npx wrangler login
   ```
3. **Tạo cơ sở dữ liệu D1**:
   ```sh
   npx wrangler d1 create lean-export
   ```
   Sao chép `database_id` in ra và dán vào `wrangler.jsonc` (thay chuỗi `00000000-…`).
4. **Đặt các khóa bí mật** (mỗi lệnh sẽ hỏi giá trị):
   ```sh
   npx wrangler secret put ADMIN_PASSWORD   # mật khẩu vào /admin
   npx wrangler secret put SESSION_SECRET   # chuỗi ngẫu nhiên ≥ 32 ký tự
   npx wrangler secret put RESEND_API_KEY   # khóa API Resend (bỏ qua nếu chưa cần email)
   ```
   Tạo chuỗi ngẫu nhiên cho `SESSION_SECRET`:
   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```
5. **Email (Resend)**: tạo tài khoản https://resend.com, xác minh tên miền gửi thư, rồi sửa
   `MAIL_FROM` và `SALES_EMAIL` trong mục `vars` của `wrangler.jsonc`.
   Chưa cấu hình email thì yêu cầu vẫn được lưu và xem trong `/admin`.
6. **Build và deploy**:
   ```sh
   npm run build:cf
   npm run deploy:cf
   ```
   Wrangler in ra địa chỉ dạng `https://lean-export.<tên-tài-khoản>.workers.dev`.
7. **Tên miền riêng** (tùy chọn): Cloudflare Dashboard → Workers & Pages → `lean-export`
   → Settings → Domains & Routes → Add custom domain.

## Tự động deploy khi push lên GitHub

Workflow `.github/workflows/deploy-cloudflare.yml` tự build + deploy mỗi lần push lên `main`,
khi repo có 2 secret sau (GitHub → Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` — tạo tại Cloudflare → My Profile → API Tokens → mẫu
  **Edit Cloudflare Workers** (thêm quyền **D1: Edit**).
- `CLOUDFLARE_ACCOUNT_ID` — xem ở trang tổng quan Workers & Pages.

Chưa có 2 secret này thì workflow tự bỏ qua, không báo lỗi.

## Chạy trên máy

```sh
cp .env.example .env     # điền ADMIN_PASSWORD, SESSION_SECRET (và RESEND_* nếu muốn thử email)
npm run dev              # dữ liệu lưu ở .data/local.sqlite (SQLite cục bộ)
```

Chạy thử đúng môi trường Cloudflare (workerd + D1 giả lập) trước khi deploy:

```sh
npm run build:cf
npm run preview:cf       # cần file dist/server/.dev.vars chứa ADMIN_PASSWORD, SESSION_SECRET
```

## Sao lưu dữ liệu

```sh
npx wrangler d1 export lean-export --remote --output backup.sql
```
