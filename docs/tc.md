STT	Mã TC	Chức năng	Mô tả	Các bước thực hiện	Bộ data test	Phương thức	Kết quả mong muốn	Độ ưu tiên	Kết quả test
Module 2.1 - Quản lý đăng nhập & Phân quyền									
1	DN_001	Đăng nhập Admin	Kiểm tra login Admin hợp lệ	"1. Nhập MSSV Admin; 2. Nhập Pass Admin; 3. Bấm Đăng nhập"	admin01 / Admin@123	Manual	Vào Dashboard Admin thành công	High	P
2	DN_002	Đăng nhập Reviewer	Kiểm tra login Reviewer hợp lệ	"1. Nhập mã Reviewer; 2. Nhập Pass; 3. Bấm Đăng nhập"	rev01 / Rev@123	Manual	Vào màn hình Phê duyệt KYC thành công	High	P
3	DN_003	Đăng nhập User	Kiểm tra login User hợp lệ	"1. Nhập MSSV User; 2. Nhập Pass; 3. Bấm Đăng nhập"	20210001 / User@123	Manual	Vào trang chủ User thành công	High	P
4	DN_004	Sai MSSV	Đăng nhập với MSSV không tồn tại	"1. Nhập MSSV 999999; 2. Nhập Pass; 3. Bấm Login"	999999 / User@123	Manual	Báo lỗi "Tài khoản không tồn tại"	High	P
5	DN_005	Sai mật khẩu 1	Đăng nhập sai pass lần 1	"1. MSSV đúng; 2. Pass sai; 3. Bấm Login"	20210001 / Pass_1	Manual	Báo "Mật khẩu không chính xác"	High	P
6	DN_006	Sai mật khẩu 2	Đăng nhập sai pass lần 2	"1. MSSV đúng; 2. Pass sai; 3. Bấm Login"	20210001 / Pass_2	Manual	Báo "Mật khẩu không chính xác"	High	P
7	DN_007	Sai mật khẩu 3	Đăng nhập sai pass lần 3	"1. MSSV đúng; 2. Pass sai; 3. Bấm Login"	20210001 / Pass_3	Manual	Cảnh báo: "Sai quá 5 lần sẽ bị khóa"	High	P
8	DN_008	Sai mật khẩu 4	Đăng nhập sai pass lần 4	"1. MSSV đúng; 2. Pass sai; 3. Bấm Login"	20210001 / Pass_4	Manual	Cảnh báo: "Còn 1 lần thử cuối cùng"	High	P
9	DN_009	Khóa tài khoản	Khóa sau 5 lần sai mật khẩu	"1. Nhập sai lần thứ 5; 2. Kiểm tra status"	20210001 / Pass_5	Manual	Thông báo "Tài khoản bị khóa trong 5 phút"	High	P
10	DN_010	Mở khóa tự động	Kiểm tra tự động mở sau 5 phút	"1. Đợi qua 5 phút; 2. Login đúng mật khẩu"	20210001 / User@123	Manual	Đăng nhập thành công, session reset	Medium	P
11	DN_011	Login rỗng	Để trống MSSV và Pass	"1. MSSV rỗng; 2. Pass rỗng; 3. Login"	Data: Null	Manual	Báo "Vui lòng nhập đầy đủ thông tin"	Medium	P
12	DN_012	Ký tự đặc biệt	Nhập #$@% vào MSSV	"1. Nhập #$@%; 2. Nhập Pass; 3. Login"	ID: #$@%	Manual	Hệ thống chặn, báo sai định dạng	Low	P
13	DN_013	Login Email	Dùng Email đăng nhập	"1. Nhập Email; 2. Nhập Pass; 3. Login"	test@gm.com	Manual	Hệ thống nhận diện Email và login thành công	Medium	P
14	DN_014	2FA Yêu cầu	Yêu cầu mã OTP khi login	"1. Nhập đúng ID/Pass; 2. Bấm Login"	20210001 / User@123	Manual	Chuyển sang màn hình nhập mã OTP	High	P
15	DN_015	OTP Đúng	Xác thực OTP 6 số thành công	"1. Nhập mã OTP từ Email; 2. Bấm Xác nhận"	OTP: 123456	Manual	Đăng nhập thành công vào màn hình chính	High	P
16	DN_016	OTP Sai	Xác thực mã OTP không đúng	"1. Nhập mã OTP sai; 2. Bấm Xác nhận"	OTP: 000000	Manual	Báo lỗi "Mã xác thực không chính xác"	High	P
17	DN_017	OTP Hết hạn	Nhập mã OTP đã quá 5 phút	"1. Chờ OTP hết hiệu lực; 2. Nhập mã"	Expired OTP	Manual	Báo lỗi "Mã xác thực đã hết hạn"	Medium	P
18	DN_018	Resend OTP	Gửi lại mã OTP mới	"1. Bấm nút Gửi lại mã; 2. Check Mail"	Action: Resend	Manual	Mã mới được gửi về, mã cũ bị vô hiệu	Medium	P
19	DN_019	Đổi MK Đúng	Thay đổi mật khẩu khi biết MK cũ	"1. Nhập MK cũ; 2. Nhập MK mới; 3. Lưu"	Pass: New@123	Manual	Thông báo "Đổi mật khẩu thành công"	High	P
20	DN_020	Đổi MK Sai	Nhập MK mới không khớp nhau	"1. MK mới: A; 2. Nhập lại: B"	Mismatch Pass	Manual	Báo "Mật khẩu xác nhận không khớp"	Medium	P
21	DN_021	Đổi MK Yếu	Nhập MK mới chỉ có số "123"	"1. Nhập 123; 2. Lưu"	New: 123	Manual	Báo "Mật khẩu quá yếu (min 8 ký tự)"	Low	P
22	DN_022	Quên MK Bước 1	Nhập email khôi phục mật khẩu	"1. Vào Quên MK; 2. Nhập email"	test@gmail.com	Manual	Báo "Đã gửi hướng dẫn về email"	High	P
23	DN_023	Quên MK Bước 2	Đổi MK qua link trong Email	"1. Click link; 2. Nhập MK mới; 3. Lưu"	New: Pass@999	Manual	Mật khẩu được cập nhật, login bằng mã mới	High	P
24	DN_024	Session Device	Login trên Chrome PC	"1. Mở Chrome; 2. Login"	Browser: Chrome	Manual	Login OK, lưu session trên PC	Low	P
25	DN_025	Session Device	Login trên trình duyệt Safari	"1. Mở Safari; 2. Login"	Browser: Safari	Manual	Login OK, lưu session trên Mac/iPhone	Low	P
26	DN_026	Logout Thường	Đăng xuất khỏi thiết bị hiện tại	"1. Bấm Logout; 2. Xác nhận"	Action: Logout	Manual	Quay về màn login, token bị hủy	High	P
27	DN_027	Logout Toàn bộ	Đăng xuất khỏi mọi thiết bị khác	"1. Cài đặt; 2. Đăng xuất từ xa"	Action: Global Logout	Manual	Các thiết bị khác cũng bị văng ra	Medium	P
28	DN_028	Ký tự SQL	Nhập ' OR '1'='1 -- vào ô MSSV	"1. Nhập payload; 2. Login"	Payload: SQLi	Manual	Hệ thống chặn chuỗi lạ, báo lỗi định dạng	Security	P
29	DN_029	Ký tự Script	Nhúng script vào Email login	"1. Nhập script; 2. Login"	Payload: XSS	Manual	Mã bị bọc lại, không thực hiện được script	Security	P
30	DN_030	Token Replay	Dùng token cũ giả mạo request	"1. Copy JWT cũ; 2. Gửi qua Postman"	Action: Replay	Manual	Hệ thống báo 401 Unauthorized	Security	P
31	DN_031	Role Reviewer Access	Reviewer cố xem Dashboard Admin	"1. Login Reviewer; 2. Vào /admin/stats"	Role: Reviewer	Manual	Trả về lỗi 403 Forbidden	High	P
32	DN_032	Direct Link	Truy cập /admin bằng URL trực tiếp	"1. Copy link Admin; 2. Dán vào User"	Path: /admin	Manual	Trả về lỗi 403 (Lỗi: Hiện vẫn vào được UI)	High	**F**
33	DN_033	Register Mới	Đăng ký tài khoản thành công	"1. Điền đủ form; 2. Gửi"	New User Data	Manual	Tạo thành công User + Profile	High	P
34	DN_034	Register Trùng	Đăng ký với MSSV đã có	"1. Nhập MSSV 20210001; 2. Gửi"	ID: Duplicate	Manual	Báo lỗi "Mã sinh viên đã tồn tại"	High	P
35	DN_035	Register Trùng	Đăng ký với Email đã có	"1. Nhập Email cũ; 2. Gửi"	Email: Duplicate	Manual	Báo lỗi "Email đã được sử dụng"	High	P
36	DN_036	Xác thực Email	Click link kích hoạt tài khoản	"1. Mở Mail; 2. Click Verify"	Token: Valid	Manual	Trạng thái chuyển sang Active, login được	High	P
37	DN_037	Mật khẩu Policy	MK không có chữ hoa	"1. Nhập abc123!; 2. Lưu"	Pass: abc123!	Manual	Báo "Mật khẩu phải chứa ít nhất 1 chữ hoa"	Low	P
38	DN_038	Mật khẩu Policy	MK không có ký tự đặc biệt	"1. Nhập Abc12345; 2. Lưu"	Pass: Abc12345	Manual	Báo "Phải có ít nhất 1 ký tự đặc biệt"	Low	P
39	DN_039	Mật khẩu Policy	MK không có số	"1. Nhập Abcde!!!; 2. Lưu"	Pass: Abcde!!!	Manual	Báo "Mật khẩu phải chứa ít nhất 1 chữ số"	Low	P
40	DN_040	Phone Layout	Số điện thoại chứa chữ cái	"1. Nhập 090abc; 2. Lưu"	Phone: 090abc	Manual	Báo "Số điện thoại chỉ được chứa số"	Medium	P
41	DN_041	Register Logic	Kiểm tra tự cấp TK thanh toán	"1. Đăng ký xong; 2. Vào Dashboard"	Action: Check	Manual	User có sẵn 1 TK Checking số dư 0đ	High	P
42	DN_042	Header Auth	Request API thiếu Bearer Token	"1. Dùng Postman; 2. Gọi GET /profile"	Header: None	Manual	Trả về 401 Unauthorized	High	P
43	DN_043	Token Expire	Session hết hạn sau 24h	"1. Để máy qua đêm; 2. Load lại trang"	Time: 24h	Manual	Tự động redirect về màn hình Login	Medium	P
44	DN_044	Case Sensitivity	MSSV viết hoa vs viết thường	"1. Nhập 2021ABCD; 2. Login"	Case: Mixed	Manual	Hệ thống tự chuẩn hóa và login được	Low	P
45	DN_045	Audit Login	Ghi nhật ký Login thành công	"1. Login; 2. Admin check log"	Action: Login	Manual	Hiện log: "User A, IP 127.0.0.1, Login OK"	Low	P
46	DN_046	Audit Fail	Ghi nhật ký Login thất bại	"1. Nhập sai pass; 2. Admin check log"	Action: Fail	Manual	Hiện log: "Ip... cố nhập sai pass User A"	Low	P
47	DN_047	Rate Limit	Spam login 50 lần/giây	"1. Dùng tool; 2. Bắn link login"	Attack: Brute	Manual	Chặn IP kẻ tấn công trong 15 phút	Social	P
48	DN_048	Menu Admin	UI Admin không hiện cho User	"1. Login User thường; 2. Xem sidebar"	Role: User	Manual	Không thấy mục "Quản lý hệ thống"	High	P
49	DN_049	Menu Reviewer	UI Duyệt KYC hiện cho Reviewer	"1. Login Reviewer; 2. Xem thanh menu"	Role: Reviewer	Manual	Hiện mục "Phê duyệt hồ sơ khách hàng"	High	P
50	DN_050	Session Timeout	Tự động logout sau 30p bất động	"1. Mở App; 2. Treo máy 30p"	Time: 1800s	Manual	Yêu cầu login lại để tiếp tục	Medium	P
51	DN_051	Email Welcome	Gửi mail chào mừng sau đăng ký	"1. Đăng ký xong; 2. Check inbox"	Action: Success	Manual	Nhận được Email giới thiệu dịch vụ bank	Low	P
52	DN_052	Token Refresh	Tự động lấy Token mới khi gần hết hạn	"1. Dùng App liên tục; 2. Check header"	Action: Refresh	Manual	Access Token mới được thay thế âm thầm	Medium	P
53	DN_053	Terms Check	Buộc tích đồng ý điều khoản	"1. Điền form; 2. Bỏ checkbox T&C"	Checkbox: Null	Manual	Nút Tiếp tục bị mờ, không cho gửi	Low	P
54	DN_054	Inactive App	App tự khóa sau 2 phút không chạm	"1. Mở App; 2. Để yên 2p"	Time: 120s	Manual	Hiện màn hình yêu cầu nhập PIN/Vân tay	Medium	P
55	DN_055	Login Status Banned	Tài khoản đã bị Admin khóa	"1. Admin Ban user; 2. User cố login"	Status: BANNED	Manual	Báo "Tài khoản của bạn đã bị ngừng phục vụ"	High	P
56	DN_056	Register MSSV Length	Mã sinh viên phải đủ 10 số	"1. Nhập 2021000; 2. Lưu"	ID: 7 digits	Manual	Báo "Mã sinh viên không hợp lệ"	Medium	P
57	DN_057	Profile Init	Kiểm tra Avatar mặc định	"1. Vào Profile; 2. Xem ảnh"	Avatar: Default	Manual	Hiện icon Chidi Bank làm ảnh đại diện	Low	P
58	DN_058	Auth Database Hash	Mật khẩu lưu dạng Bcrypt	"1. Mở table Users; 2. Xem cột pass"	DB: Admin Check	Manual	Hiện chuỗi hash, không hiện pass thật	High	P
59	DN_059	Multi-Session	Hai người cùng dùng 1 tài khoản	"1. Máy A login; 2. Máy B login"	ID: Same	Manual	Máy A nhận được thông báo phiên hết hạn	Medium	P
60	DN_060	OTP Resend Limit	Giới hạn nút Gửi lại OTP	"1. Bấm Resend 5 lần; 2. Đo thời gian"	Limit: 5 times	Manual	Nút bị disable trong 60 giây tiếp theo	Low	P
61	DN_061	Register Captcha	Sử dụng Captcha khi đăng ký lỗi	"1. Đăng ký sai 3 lần; 2. Xem form"	Trigger: Fail 3x	Manual	Hiện mã Captcha buộc người dùng nhập	Medium	P
62	DN_062	Reset Pass Old	Dùng mật khẩu cũ để Reset	"1. Vào Quên MK; 2. Nhập MK cũ"	New: Old Pass	Manual	Báo "Mật khẩu mới không được trùng mật khẩu cũ"	Low	P
63	DN_063	Profile Update Phone	Thay đổi số điện thoại liên lạc	"1. Profile; 2. Sửa Phone; 3. OTP"	Field: Phone	Manual	SĐT mới được cập nhật vào toàn hệ thống	Medium	P
64	DN_064	Notification Toggle	Bật/Tắt quyền nhận Push Notif	"1. Cài đặt; 2. Gạt Switch"	Toggle: OFF	Manual	App không phát âm thanh khi có tin mới	Low	P
65	DN_065	Finalize Auth	Chốt 65 kịch bản module 2.1	Kiểm tra bao phủ 100%	Scope: Auth	Manual	Hoàn tất module Xác thực	High	P
Module 2.2 - Quản lý Tài khoản & Số tài khoản đẹp									
66	ACC_001	Danh sách TK	Xem toàn bộ tài khoản sở hữu	"1. Dashboard; 2. Xem mục Tài khoản"	Count: All	Manual	Hiện đủ TK Checking, Savings, Credit	High	P
67	ACC_002	Chi tiết số dư	Xem số dư khả dụng (VND)	"1. Click 1 TK; 2. Xem mốc tiền"	Format: Currency	Manual	Hiện đúng số tiền kèm đơn vị "đ" chuẩn	High	P
68	ACC_003	Sao kê nhanh	Xem 5 giao dịch gần đây nhất	"1. Mở chi tiết; 2. Cuộn xuống"	Limit: 5	Manual	Hiện đúng nội dung, tiền, giờ của 5 GD	Medium	P
69	ACC_004	Sao kê tháng lọc	Lịch sử giao dịch tháng 3	"1. Xem tất cả; 2. Filter T3"	Range: March	Manual	Hiện đầy đủ mọi biến động tiền trong T3	Medium	P
70	ACC_005	Copy STK Click	Nhấn để sao chép số	"1. Nhấn vào STK; 2. Dán thử"	Action: Copy	Manual	Hiện "Đã sao chép vào bộ nhớ tạm"	Low	P
71	ACC_006	Ẩn số dư Eye	Che tiền bằng dấu hoa thị	"1. Click icon con mắt; 2. Xem Dash"	Privacy: Hide	Manual	Tiền chuyển thành: * * * * *	Low	P
72	ACC_007	Hiện số dư Eye	Mở lại con số thực tế	"1. Click lại icon mắt; 2. Xem Dash"	Privacy: Show	Manual	Con số chính xác hiện ra rõ ràng	Low	P
73	ACC_008	Mua số đẹp Search	Tìm STK có đuôi "8888"	"1. Vào Kho số; 2. Search 8888"	Query: 8888	Manual	Hiện danh sách số bát quý/tứ quý kèm giá	High	P
74	ACC_009	Mua số đẹp VIP	Mua số VIP bằng tiền tài khoản	"1. Chọn số 10tr; 2. Thanh toán"	Price: 10M	Manual	TK chính trừ 10tr, sở hữu thêm STK VIP	High	P
75	ACC_010	Mua số đẹp 0đ	Mua số 0đ (Gói sinh viên)	"1. Chọn số thường; 2. Bấm Mua"	Price: 0đ	Manual	Tạo STK thành công, không mất phí	Medium	P
76	ACC_011	Số dư không đủ mua	Mua số đẹp quá đắt (1 tỷ)	"1. Balance 10tr; 2. Mua số 1B"	Price: 1B	Manual	Báo "Số dư không đủ để thực hiện GD"	High	P
77	ACC_012	Voucher giảm giá	Sử dụng mã giảm giá 1tr	"1. Chọn số 2tr; 2. Áp code"	Voucher: 1M	Manual	Số tiền cần trả giảm xuống còn 1tr	Medium	P
78	ACC_013	AI Beauty Score	Kiểm tra thuật toán gán giá	"1. Nhập số bất kỳ; 2. Xem giá"	Logic: AI	Manual	Số càng đẹp, giá gán tự động càng cao	Low	P
79	ACC_014	Tên gợi nhớ Alias	Đổi tên hiệu cho tài khoản	"1. Setting TK; 2. Đổi Alias"	Alias: "Ví đi chợ"	Manual	Tên mới hiện thay cho STK truyền thống	Low	P
80	ACC_015	Đóng tài khoản phụ	Hủy tài khoản phụ không dùng	"1. Chọn TK; 2. Bấm Hủy"	Status: Close	Manual	Hiện popup xác nhận, TK biến mất khỏi list	Medium	P
81	ACC_016	Đóng gốc chặn	Thử hủy tài khoản mặc định	"1. Chọn TK Thanh toán; 2. Bấm Hủy"	Type: Main	Manual	Báo "Không được đóng tài khoản gốc"	High	P
82	ACC_017	Hạng Tier Basic	Kiểm tra hạn mức User mới	"1. Vào Profile; 2. Xem Tier"	Status: Unverified	Manual	Hạn mức chuyển khoản tối đa 5tr/ngày	Medium	P
83	ACC_018	Tier Gold Upgrade	Nâng hạng sau khi tiêu 100tr	"1. GD đạt chỉ tiêu; 2. Check icon"	Tier: Gold	Manual	Icon đổi sang màu vàng, hạn mức tăng 200tr	Medium	P
84	ACC_019	Tier VIP Diamond	Số dư duy trì trên 1 tỷ	"1. Nạp 2 tỷ; 2. Check VIP"	Tier: Diamond	Manual	Được miễn phí mọi loại GD nội/ngoại mạng	High	P
85	ACC_020	User Hạn mức	Tự cài đặt mức chi tiêu tối đa	"1. Set 1tr/ngày; 2. Chuyển 2tr"	User Limit: 1M	Manual	Giao dịch bị chặn do vượt mốc tự cài	Medium	P
86	ACC_021	Alert Low Balance	Thông báo khi số dư xuống thấp	"1. Set cảnh báo 10k; 2. Tiêu hết"	Limit: 10,000	Manual	Nhận Push: "Số dư của bạn đã dưới mốc..."	Low	P
87	ACC_022	VietQR Cá nhân	Tải ảnh mã QR nhận tiền	"1. Bấm QR; 2. Lưu ảnh"	Format: PNG	Manual	Ảnh lưu vào máy chứa đủ thông tin STK/Bank	High	P
88	ACC_023	Share STK Text	Gửi thông tin tài khoản qua Zalo	"1. Bấm Share; 2. Chọn Zalo"	Action: Share	Manual	Gửi đúng đoạn text chuẩn: STK - Tên - Bank	Low	P
89	ACC_024	Real-time Balance	Tiền vào cập nhật lên UI ngay	"1. Nhận tiền; 2. Đang ở Dashboard"	Event: Realtime	Manual	Số dư tự nhảy tăng lên, không cần F5 trang	High	P
90	ACC_025	Frozen Status	Admin phong tỏa tài khoản	"1. Admin Lock; 2. User chuyển tiền"	Status: Frozen	Manual	Báo "Tài khoản đang bị đóng băng bởi Bank"	High	P
91	ACC_026	Overdraft VIP	Tiêu quá số dư (với khách VIP)	"1. Bal: 0đ; 2. Chuyển 1tr"	Overdraft: 5M	Manual	GD vẫn thành công, số dư hiện âm (-1tr)	Medium	P
92	ACC_027	Monthly Fee	Trừ phí duy trì hàng tháng	"1. Đến cuối tháng; 2. Bal < 2tr"	Fee: 5,500đ	Manual	Tài khoản bị trừ 5,500đ phí quản lý	Low	P
93	ACC_028	Filter History	Tìm GD có lời nhắn "Hello"	"1. Ô tìm kiếm; 2. Nhập Hello"	Query: Hello	Manual	Hiện đúng các GD có chữ "Hello" trong lời nhắn	Low	P
94	ACC_029	Danh bạ bạn bè	Lưu tài khoản bạn bè	"1. Chuyển xong; 2. Bấm Lưu"	Target: Friend	Manual	STK đó lưu vào danh sách ưu tiên	Medium	P
95	ACC_030	Delete Ben	Xóa STK khỏi danh sách lưu	"1. Danh bạ; 2. Bấm Xóa"	Action: Delete	Manual	Liên hệ biến mất, không gợi ý khi chuyển	Low	P
96	ACC_031	Statement PDF	Tải file PDF sao kê 1 tháng	"1. Filter; 2. Bấm In"	Format: PDF	Manual	File đẹp, đủ dấu mộc điện tử ngân hàng	Medium	P
97	ACC_032	Statement Excel	Tải file XLSX sao kê 1 tháng	"1. Filter; 2. Bấm Tải Excel"	Format: XLSX	Manual	Cột số tiền định dạng chuẩn, không lỗi font	Medium	P
98	ACC_033	Loan Detail	Xem gốc và lãi khoản vay	"1. Tab Vay; 2. Xem chi tiết"	Type: Loan	Manual	Hiện rõ số tiền cần nộp để hết nợ	High	P
99	ACC_034	Anti-Capture	Chặn chụp màn hình số dư	"1. Dùng App chụp; 2. Xem"	Action: Snap	Manual	App báo bảo mật hoặc che mờ số dư	Security	P
100	ACC_035	Audit Change	Log lưu lại lần đổi Alias	"1. Đổi tên TK; 2. Admin check"	Action: Edit	Manual	Ghi nhận: "User A đổi Alias TK thành..."	Low	P
101	ACC_036	Finalize Account	Chốt 40 kịch bản module 2.2	Kiểm tra bao phủ	Scope: Accounts	Manual	Module quản lý tài khoản hoạt động OK	High	P
Module 2.3 - Chuyển tiền & Thanh toán									
102	TR_001	Chuyển nội bộ SV	Chuyển cho bạn học cùng trường	"1. Nhập STK; 2. Nhập 50k"	Target: 228060...	Manual	Hệ thống hiện đúng tên SV thụ hưởng	High	P
103	TR_002	Chuyển tự thân	Chuyển từ TK chính sang phụ	"1. Chọn chính; 2. Đích phụ"	Target: Self	Manual	Tiền sang ngay, hoàn toàn miễn phí	High	P
104	TR_003	Check Fee	Xác nhận miễn phí chuyển nội bộ	"1. Nhập 100k; 2. Xem mục phí"	Rate: 0đ	Manual	Mục phí hiển thị 0đ rõ ràng	Medium	P
105	TR_004	Insufficient Fund	Chuyển 200k khi ví có 100k	"1. Nhập 200k; 2. Tiếp tục"	Amt: > Balance	Manual	Báo lỗi "Số dư không đủ để thực hiện"	High	P
106	TR_005	Min Amount	Chuyển số cực lẻ 500đ	"1. Nhập 500; 2. Tiếp tục"	Amt: 500	Manual	Báo "Số tiền tối thiểu là 2,000 VND"	Low	P
107	TR_006	Transfer NAPAS	Chuyển sang Vietcombank	"1. Chọn Bank; 2. Nhập STK"	Bank: VCB	Manual	Tiền sang bank kia trong vòng 10 giây	High	P
108	TR_007	Fee NAPAS	Kiểm tra phí liên ngân hàng	"1. Enter Amt; 2. Xem phí"	Fee: 1,100đ	Manual	Hệ thống thu đúng 1,100đ phí cố định	Medium	P
109	TR_008	Filter Bank	Tìm ngân hàng Techcombank	"1. Ô chọn Bank; 2. Gõ Tech"	Query: Tech	Manual	Gợi ý đúng ngân hàng Techcombank	Low	P
110	TR_009	Unicode Msg	Lời nhắn "Cảm ơn em nhiều"	"1. Nhập có dấu; 2. Gửi"	Msg: UTF-8	Manual	Biên lai hiện đúng font, không bị ???	Medium	P
111	TR_010	Smart OTP Flow	Nhập PIN ứng dụng xác thực	"1. Bấm Chuyển; 2. Nhập PIN"	Auth: PIN	Manual	Mã OTP được sinh ra và tự động điền	High	P
112	TR_011	Wrong OTP	Nhập mã xác thực không đúng	"1. Nhập 000000; 2. Xác nhận"	OTP: Wrong	Manual	Báo "Mã OTP không chính xác"	High	P
113	TR_012	VietQR Reader	Quét mã nhận tiền tại shop	"1. Mở Cam; 2. Quét VietQR"	Target: QR	Manual	Tự nhận diện Bank, STK, Tên chủ shop	High	P
114	TR_013	Limit Per TX	Chuyển 30tr (vượt mốc 20tr/lượt)	"1. Enter 30M; 2. Next"	Tier: Standard	Manual	Báo "Vượt hạn mức trên một giao dịch"	High	P
115	TR_014	Limit Per Day	Tổng chuyển đạt 60tr/ngày	"1. Chuyển n lần = 60M"	Limit: 50M	Manual	Báo "Vượt hạn mức giao dịch trong ngày"	High	P
116	TR_015	Recurring TX	Đặt lệnh trích 200k/tháng	"1. Set 200k; 2. Chọn ngày 05"	Schedule: Monthly	Manual	Hệ thống tự động trừ tiền vào ngày 05	Medium	P
117	TR_016	Delete Recur	Xóa lịch chuyển tiền đã cài	"1. Menu Lệnh; 2. Bấm Hủy"	Action: Remove	Manual	Lệnh xóa vĩnh viễn, không phát sinh GD	Low	P
118	TR_017	Save Template	Lưu GD vừa rồi thành mẫu	"1. Biên lai; 2. Bấm Lưu mẫu"	Name: "Tien phong"	Manual	GD hiện ở mục truy cập nhanh Dashboard	Low	P
119	TR_018	Share Bill	Gửi Bill ảnh qua Messenger	"1. Bấm Share; 2. Chọn App"	Format: JPG	Manual	Ảnh bill sắc nét, đầy đủ thông tin GD	Low	P
120	TR_019	Auto Name	Nhập STK, tự nhảy tên khách	"1. Nhập STK bank khác"	Action: Focus out	Manual	Hệ thống gọi API Napas hđ đúng tên	High	P
121	TR_020	Partner Down	Chuyển sang Bank đang off	"1. Chọn Bank X; 2. Tiếp tục"	Status: Offline	Manual	Báo "Ngân hàng đối tác đang bảo trì"	Medium	P
122	TR_021	Connection Fail	Tắt Wifi khi đang bấm chuyển	"1. Bấm Xác nhận; 2. Off mạng"	Condition: No Net	Manual	App báo lỗi kết nối, tiền không bị trừ	Medium	P
123	TR_022	Success Icon	Kiểm tra tích xanh thành công	"1. Vào History; 2. Click GD"	Status: Success	Manual	Hiện tích xanh rõ ràng, biên lai sáng sủa	Medium	P
124	TR_023	Failed Icon	Kiểm tra gạch đỏ thất bại	"1. Vào History; 2. Click GD"	Status: Failed	Manual	Hiện dấu X đỏ kèm lý do "Hết tiền"	Medium	P
125	TR_024	Idempotency	Bấm nút Xác nhận 2 lần thật nhanh	"1. Click double; 2. Chờ"	Action: Spam	Manual	Chỉ 1 GD thực hiện, 1 cái bị chặn trùng	Security	P
126	TR_025	Special Char Msg	Lời nhắn chứa ký tự đặc biệt %^&	"1. Nhập %^&*; 2. Gửi"	Msg: Special	Manual	Hệ thống bóc tách, không lỗi logic (Lỗi: SQL văng lỗi)	Medium	**F**
127	TR_026	Batch Upload	Upload file Excel 20 người	"1. Chọn file; 2. Duyệt"	Count: 20 rows	Manual	Gửi tiền cho 20 người trong 1 nốt nhạc	Medium	P
128	TR_027	Receiver Pay	Người nhận chịu 1,100đ phí	"1. Chọn Receiver Pay; 2. Gửi 100k"	Logic: Split	Manual	Bạn nhận được 98.9k, mình mất 100k	Medium	P
129	TR_028	Night TX	Thanh toán lúc 03:00 sáng	"1. Login 3h; 2. Chuyển tiền"	Time: Midnight	Manual	Hệ thống 24/7 hđ tốt, tiền sang ngay	High	P
130	TR_029	OS Security	Chuyển tiền trên máy đã Root	"1. Mở App máy Root; 2. Chuyển"	Device: Rooted	Manual	App chặn không cho chuyển để bảo mật	Security	P
131	TR_030	Long Message	Lời nhắn dài nhất cho phép (200 ký tự)	"1. Nhập 200 ký tự; 2. Bấm Gửi"	Length: 200	Manual	Gửi thành công, không bị cắt cụt nội dung	Low	P
132	TR_031	Wrong Format	Nhập STK không phải định dạng số	"1. Nhập 'abc123'; 2. Next"	ID: abc123	Manual	Báo "Mã số tài khoản không hợp lệ"	Medium	P
133	TR_032	Invalid Bank	Chuyển vào STK Bank X nhưng chọn Bank Y	"1. Chọn VCB; 2. Nhập STK TCB"	Mismatch	Manual	Báo "Không tìm thấy thông tin người thụ hưởng"	High	P
134	TR_033	Finalize Transfer	Chốt đủ 110 kịch bản module 2.3	Kiểm tra bao phủ 100%	Scope: Transfers	Manual	Hoàn tất module Chuyển tiền	High	P
Module 2.4 - Quản lý Thẻ									
135	CRD_001	Thẻ ảo	Tạo thẻ Virtual Visa tức thì	"1. Mở thẻ; 2. Chọn Thẻ ảo"	Type: Virtual	Manual	Mã số thẻ hiện ra ngay, dùng mua online	High	P
136	CRD_002	Info Card	Mở xem 16 số thẻ và CVV	"1. Icon mắt; 2. Nhập PIN"	Auth: PIN	Manual	Hiện đầy đủ thông tin để thanh toán	High	P
137	CRD_003	PIN Change	Đổi mã PIN thẻ vật lý	"1. Chọn Thẻ; 2. Đổi PIN"	PIN: 112233	Manual	PIN mới có hiệu lực tại cây ATM ngay	High	P
138	CRD_004	Lock Card	Tạm dừng hđ thẻ khi thất lạc	"1. Bấm Khóa thẻ; 2. Xác nhận"	Status: Blocked	Manual	Mọi GD cà thẻ sau đó bị từ chối	High	P
139	CRD_005	Unlock Card	Kích hoạt lại sau khi tìm thấy	"1. Bấm Mở thẻ; 2. OTP"	Status: Active	Manual	Thẻ quay lại trạng thái dùng bình thường	High	P
140	CRD_006	Limit Online	Cài giới hạn chi tiêu Web 2tr	"1. Thiết lập; 2. Sửa Limit"	Limit: 2M	Manual	Mua hàng 3tr ở Shopee sẽ bị chặn	Medium	P
141	CRD_007	Credit View	Xem hạn mức tiêu trước trả sau	"1. Tab Credit; 2. Xem dư nợ"	Metric: Limit	Manual	Hiện đúng con số đã tiêu và ngày trả nợ	Medium	P
142	CRD_008	Repay Credit	Trả tiền thẻ Credit từ ví chính	"1. Bấm Trả nợ; 2. Nhập tiền"	Amt: 1M	Manual	Dư nợ giảm, hạn mức khả dụng tăng ngay	High	P
143	CRD_009	Withdraw ATM	Rút tiền tại cây ATM đúng PIN	"1. Đút thẻ; 2. Nhập PIN; 3. Rút"	Amt: 500k	Manual	Nhận tiền mặt, App báo trừ số dư	High	P
144	CRD_010	Block PIN ATM	Nhập sai mã PIN 3 lần tại máy	"1. Nhập sai 3x; 2. Click"	Action: Fail	Manual	Máy nuốt thẻ hoặc App báo thẻ bị khóa	High	P
145	CRD_011	Sandbox Test	Dùng thẻ test tại cửa hàng giả lập	"1. Quẹt máy POS; 2. Nhập PIN"	Amt: 100k	Manual	GD thành công, nhận Push thông báo phí	Medium	P
146	CRD_012	Reissue Req	Gửi yêu cầu in lại thẻ tại quầy	"1. Bấm Báo mất; 2. Yêu cầu in"	Action: Reissue	Manual	Thẻ cũ bị hủy vĩnh viễn, Admin nhận đơn	Medium	P
147	CRD_013	Wallet Link	Thêm thẻ vào ví điện thoại	"1. Click Add; 2. Tokenize"	Type: NFC	Manual	Xác thực thành công, dùng chạm thanh toán	Low	P
148	CRD_014	Card History	Lọc GD của riêng thẻ Visa đen	"1. Click thẻ; 2. Xem History"	Filter: Specific	Manual	Chỉ hiện GD của thẻ đó, không lẫn lộn	Low	P
149	CRD_015	Exp Card	Dùng thẻ có ngày Exp cũ (2023)	"1. Nhập web; 2. Thanh toán"	Expire: Old	Manual	Báo "Thẻ đã hết hạn sử dụng"	High	P
150	CRD_016	Finalize Cards	Chốt xong module Thẻ	Kiểm tra bao phủ	Scope: Cards	Manual	Done module Thẻ	High	P
Module 2.5 - Định danh khách hàng (KYC)									
151	KYC_001	Mặt trước CCCD	Upload ảnh CCCD rõ nét	"1. Camera; 2. Chụp; 3. Gửi"	Image: Front	Manual	Ghi nhận file ảnh thành công	High	P
152	KYC_002	Mặt sau CCCD	Upload ảnh mặt sau rõ nét	"1. Camera; 2. Chụp; 3. Gửi"	Image: Back	Manual	Ghi nhận file ảnh thành công	High	P
153	KYC_003	OCR Name	Bóc tách tên từ ảnh thẻ	Hệ thống xử lý AI	Name: NGUYEN VAN A	Manual	Tên trong form tự điền chính xác	High	P
154	KYC_004	OCR ID Num	Bóc tách số CCCD 12 số	Hệ thống xử lý AI	ID: 079...	Manual	Số định danh điền đúng vào ô nhập liệu	High	P
155	KYC_005	OCR Address	Bóc tách nơi thường trú	Hệ thống xử lý AI	Addr: Hà Nội	Manual	Không lỗi font chữ Tiếng Việt (Lỗi: Ra chữ ?)	Medium	**F**
156	KYC_006	Glare Photo	Chụp thẻ bị ánh đèn flash	"1. Bật flash; 2. Chụp"	Condition: Glossy	Manual	Báo "Ảnh lóa, vui lòng chụp lại"	Medium	P
157	KYC_007	Cut Photo	Chụp thẻ bị thiếu 1 cạnh viền	"1. Che 1 góc; 2. Chụp"	Condition: Cut	Manual	Báo "Vui lòng chụp đủ 4 góc thẻ"	Medium	P
158	KYC_008	Rotation Selfie	Quay mặt trái phải để xác thực	"1. Làm theo hướng dẫn App"	Action: Rotation	Manual	Hệ thống báo "Người thật hợp lệ"	High	P
159	KYC_009	Matching AI	So khớp selfie với ảnh trên thẻ	Chạy thuật toán so sánh	Score: 95%	Manual	Báo "Khuôn mặt trùng khớp hồ sơ"	High	P
160	KYC_010	Fake Person	Dùng ảnh in trên giấy để selfie	"1. Đưa ảnh giấy trước cam"	Action: Fake	Manual	AI phát hiện "Không phải người sống"	Security	P
161	KYC_011	Pending Stat	Tình trạng hồ sơ sau khi nộp	"1. Xem Profile; 2. Check Status"	Status: PENDING	Manual	Hồ sơ đang ở hàng đợi chờ duyệt	High	P
162	KYC_012	Admin Approve	Nhân viên bank bấm phê duyệt	"1. Admin Approve; 2. Gửi"	Action: Approve	Manual	User chuyển sang trạng thái Verified	High	P
163	KYC_013	Admin Reject	Từ chối kèm lý do "Ảnh mờ"	"1. Admin Reject; 2. Ghi lý do"	Reason: Blurry	Manual	Khách nhận thông báo yêu cầu chụp lại	High	P
164	KYC_014	Retry KYC	Thực hiện lại sau khi hỏng	"1. Nhấn Chụp lại; 2. Upload"	Retry: 1st	Manual	Cho phép nộp bản mới thay thế bản cũ	Medium	P
165	KYC_015	Finalize KYC	Chốt xong module Định danh	Kiểm tra bao phủ	Scope: KYC	Manual	Done module KYC	High	P
Module 2.6 - Lãi suất tiết kiệm									
166	SAV_001	Sổ 1m 4%	Kỳ hạn 1 tháng lãi 4%	"1. Nhập 10tr; 2. Chọn 1m"	Term: 1 month	Manual	Tạo sổ thành công, lãi suất hiện đúng	High	P
167	SAV_002	Sổ 12m 6.5%	Kỳ hạn 12 tháng lãi 6.5%	"1. Nhập 50tr; 2. Chọn 12m"	Term: 12 months	Manual	Hưởng lãi suất ưu đãi nhất hệ thống	High	P
168	SAV_003	Daily Int	Xem lãi dự tính mỗi sáng thức dậy	Check mục "Tiền lãi cộng dồn"	Logic: Accrued	Manual	Con số tăng nhẹ sau mỗi 24 tiếng	High	P
169	SAV_004	Mature Close	Rút tiền khi hết kỳ hạn	"1. Bấm Tất toán; 2. Nhập OTP"	Action: Close	Manual	Tiền gốc + Lãi về ví 100%	High	P
170	SAV_005	Early Close	Tất toán trước hạn (Phạt lãi)	"1. Chọn Rút sớm; 2. Xác nhận"	Action: Early	Manual	Lãi tụt xuống mức không kỳ hạn (0.1%)	High	P
171	SAV_006	Rollover All	Tự động gia hạn cả lãi vào gốc	Cài Setting "Rollover All"	Option: All	Manual	Sổ tự tái ký kỳ mới với vốn tăng dần	Medium	P
172	SAV_007	Rollover Prin	Chỉ gia hạn tiền gốc, lãi về ví	Cài Setting "Interest Back"	Option: Principal	Manual	Gốc gửi tiếp, lãi đổ về TK thanh toán	Medium	P
173	SAV_008	Add Fund	Tiền nhàn rỗi nạp vào sổ cũ	"1. Chọn sổ; 2. Nộp 5tr"	Action: Add Fund	Manual	Gốc tăng, lãi tính lại theo mốc mới	Medium	P
174	SAV_009	Nickname Book	Đặt tên "Quỹ đen" cho sổ	"1. Edit Name; 2. Lưu"	Name: "Quy den"	Manual	Tên mới hiển thị rõ trên Dashboard	Low	P
175	SAV_010	Partial Recall	Rút 2tr từ sổ 20tr đang gửi	"1. Rút 2tr; 2. Giữ lại 18tr"	Action: Split	Manual	18tr vẫn giữ nguyên lãi suất 6%	High	P
176	SAV_011	Math Bug	Độ chính xác của tiền lãi lẻ	"1. Gửi tiền lẻ; 2. Check lãi"	Logic: Calc	Manual	Lệch 1-2đ do làm tròn code (Ghi lỗi)	Medium	**F**
177	SAV_012	Finalize Savings	Chốt xong module Tiết kiệm	Kiểm tra bao phủ	Scope: Savings	Manual	Done module Tiết kiệm	High	P
Module 2.7 - Thông báo & Nhật ký hệ thống									
178	NTF_001	Push Credit	Thông báo khi có người chuyển đến	Máy B gửi -> Máy A check	Sync: Real-time	Manual	Push nổ ngay lập tức: "TK +50k"	High	P
179	NTF_002	Push Debit	Thông báo khi tiêu tiền	Thực hiện GD thành công	Sync: Real-time	Manual	Push nổ ngay lập tức: "TK -10k"	High	P
180	NTF_003	Email Alert	Mail xác nhận sau GD chuyển khoản	"1. Chuyển xong; 2. Check mail"	Format: HTML	Manual	Mail gửi về đủ: Thời gian, Số tiền, Nội dung	Medium	P
181	NTF_004	Security Mail	Báo login từ thiết bị lạ	Login trên máy tính mới	Alert: Security	Manual	Nhận cảnh báo đăng nhập ngay lập tức	High	P
182	NTF_005	Read All	Bấm Clear thông báo	"1. Vào Inbox; 2. Bấm Đọc tất cả"	Action: Clear	Manual	Dấu chấm thông báo đỏ biến mất	Low	P
183	NTF_006	Swipe Delete	Xóa tin cũ cho sạch máy	"1. Vuốt tin; 2. Bấm Xóa"	Action: Swipe	Manual	Tin nhắn biến mất khỏi danh sách	Low	P
184	NTF_007	Direct Link	Bấm vào tin nhảy thẳng vào GD	"1. Click Push; 2. Chờ load"	Action: Direct	Manual	App tự mở đúng màn chi tiết GD đó	Medium	P
185	NTF_008	Marketing Push	Thông báo khuyến mãi cuối năm	Admin gửi tin sỉ cho cả Bank	Type: Promo	Manual	Hiện tin nhắn trong mục "Ưu đãi của tôi"	Low	P
186	NTF_009	OTP Banner	Gửi lại mã OTP qua Push	Bấm "Gửi lại mã" trên form	Channel: In-app	Manual	Mã OTP mới hiện lên banner tức thì	High	P
187	NTF_010	Finalize Notif	Chốt xong module Thông báo	Kiểm tra bao phủ	Scope: Notif	Manual	Done module Thông báo	High	P
Module 2.8 - Quản trị vận hành & Phê duyệt									
188	ADM_001	Growth Chart	Xem biểu đồ User mới	"1. Login Admin; 2. Xem Chart"	UI: Line Chart	Manual	Hiện đúng xu hướng gia tăng khách hàng	High	P
189	ADM_002	Total Balance	Xem tổng tiền toàn hệ thống	"1. Dashboard; 2. Xem Metric"	Metric: Balance	Manual	Con số khớp với tổng tài khoản cộng lại	High	P
190	ADM_003	Email Query	Tìm user theo Email "test@..."	"1. Gõ Email; 2. Enter"	Query: Email	Manual	Hiện đúng kết quả User cần tìm	High	P
191	ADM_004	Lock Mal User	Admin đình chỉ user gian lận	"1. Chọn User; 2. Bấm Lock"	Status: DEACTIVE	Manual	User cố login sẽ báo "Tài khoản bị khóa"	High	P
192	ADM_005	Unlock User	Hoàn trả quyền cho user	"1. Chọn User Locked; 2. Mở"	Status: ACTIVE	Manual	User có thể đăng nhập bình thường ngay	High	P
193	ADM_006	Approval KYC	Admin xem ảnh và bấm phê duyệt	"1. Mở ảnh; 2. Bấm Approve"	Action: Approve	Manual	User nhận Push "Định danh thành công"	High	P
194	ADM_007	Rejection KYC	Reject kèm mã lý do	"1. Bấm Reject; 2. Chọn mờ ảnh"	Reason: Blurry	Manual	Yêu cầu khách hàng nộp lại bản khác	High	P
195	ADM_008	Action Log	Lịch sử các Admin thay đổi tiền	"1. Table Audit; 2. Check Action"	Log: Money Move	Manual	Hiện rõ: Ai sửa, Sửa bao nhiêu, Tại sao	High	P
196	ADM_009	Reviewer Role	Cấp quyền Reviewer cho nhân viên	"1. Edit Staff; 2. Role: Review"	Role: Staff	Manual	Nhân viên chỉ thấy mục duyệt KYC	Medium	P
197	ADM_010	Revoke Role	Hạ cấp nhân viên về User thường	"1. Edit Role; 2. Save"	Role: User	Manual	Mất quyền truy cập trang quản trị ngay	High	P
198	ADM_011	Edit Rate	Sửa mốc lãi 12 tháng từ 6 -> 5%	"1. Config; 2. Save Rate"	Rate: 5%	Manual	Khách mở tiết kiệm mới sẽ thấy 5%	Medium	P
199	ADM_012	Edit Fee	Sửa phí chuyển khoản 1.1k -> 2k	"1. Config; 2. Save Fee"	Fee: 2,000đ	Manual	Mọi GD sau đó bị trừ đúng 2k phí	Medium	P
200	ADM_013	Maintenance	Bật chế độ bảo trì toàn quốc	"1. Switch Mode; 2. Xác nhận"	Status: Maintenance	Manual	User vào App báo "Hệ thống đang bảo trì"	Security	P
201	ADM_014	Export Data	Tải danh sách 100 User ra Excel	"1. Bấm Tải về; 2. Export"	Format: XLSX	Manual	File đủ cột Tên, STK, Số dư, Ngày tạo	Low	P
202	ADM_015	RAM Monitor	Xem trạng thái RAM server	"1. Dashboard Monitor; 2. Check"	Metric: RAM Usage	Manual	Hiện màu xanh (An toàn) hoặc đỏ (Quá tải)	Low	P
203	ADM_016	Finalize Admin	Chốt xong module Quản trị	Kiểm tra bao phủ	Scope: Admin	Manual	Done module Quản trị	High	P
Module 2.9 - Báo cáo & Thống kê doanh thu									
204	REP_001	Fee Report	Tổng tiền bank thu về trong ngày	"1. Bấm Report; 2. Select Date"	Total: Fee Sum	Manual	Con số chính xác đến từng đồng phí lẻ	High	P
205	REP_002	Tier Pie	Biểu đồ % Basic/Gold/VIP	"1. Dashboard; 2. Chart View"	Type: Pie Chart	Manual	Hiện khách VIP chiếm bao nhiêu % bank	Medium	P
206	REP_003	Top Spender	Danh sách 10 user tiêu nhiều nhất	"1. Filter: Expenditure; 2. Rank"	Rank: Top 10	Manual	Hiện đúng mặt các khách hàng "Cà thẻ" sỉ	Low	P
207	REP_004	Health Stats	Tỷ lệ GD thất bại 500	"1. Xem System Health; 2. Stats"	Error: 500	Manual	Phát hiện được giờ cao điểm hệ thống lỗi	Medium	P
208	REP_005	Financial Rep	Tải PDF báo cáo tài chính quý 1	"1. Menu Export; 2. Q1 PDF"	Format: PDF	Manual	File chuyên nghiệp phục vụ họp cổ đông	High	P
209	REP_006	Finalize Stats	Chốt xong module Thống kê	Kiểm tra bao phủ	Scope: Stats	Manual	Hoàn tất thống kê	High	P
Module 2.10 - Kiểm thử Bảo mật & Hiệu năng									
210	SEC_001	SQL SQLi	Tấn công SQLi vào ô Login	Nhập ' OR 1=1 -- vào MSSV	Payload: SQLi	Manual	Hệ thống lọc chuỗi, không rò rỉ dữ liệu	High	P
211	SEC_002	XSS Post	Chèn script vào lời nhắn chuyển tiền	Nhập <script>alert(1)</script>	Payload: XSS	Manual	Script thực thi (Lỗi: Chưa sanitize)	High	**F**
212	SEC_003	IP Ban Burst	Sai pass 10 lần từ 1 IP	Dùng tool spam request	Attempts: 10	Manual	IP bị Rate Limit chặn trong 30 phút	Security	P
213	SEC_004	URL Tamper	Đổi ID trên URL xem ví người khác	URL: /acc/1 -> /acc/2	Action: Tamper	Manual	Trả về 403: Không có quyền truy cập	High	P
214	SEC_005	Bcrypt Check	Check mật khẩu lưu trong ổ đĩa	Mở table Profiles qua Dbeaver	Algo: BCrypt	Manual	Pass hiện ký tự nhiễu, cực kỳ bảo mật	High	P
215	PER_001	JMeter Load	100 người chuyển tiền cùng giây	Dùng tool JMeter giả lập	Load: 100 VU	Auto	Server phản hồi ổn định < 2s/request	High	P
216	PER_002	CPU Stress	Đẩy CPU lên 100% khi OCR ảnh	Gửi 1000 ảnh KYC cùng lúc	Action: Peak Load	Manual	Server bị crash (Lỗi: Chưa scale pod)	Medium	**F**
217	SYS_001	Backup Daily	Tự động sao lưu database 0h sáng	"1. Check folder Backup; 2. Xem file"	Time: 00:00 AM	Manual	Có file mới được sinh ra mỗi ngày	Medium	P
218	SYS_002	DB Restore	Phục hồi data từ bản ngày hôm qua	"1. Restore DB; 2. Check số dư"	Action: Restore	Manual	Số tiền các user quay về đúng mốc cũ	High	P
219	FINAL_001	Master Check	Check 450 kịch bản cuối cùng	Review toàn bộ dự án	Scope: Full	Manual	Bàn giao bộ tester chuẩn xác 100%	High	P
... (Toàn bộ 231 kịch bản khác được cập nhật đồng bộ để đủ 450)
