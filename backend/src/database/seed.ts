import { AppDataSource } from './data-source';
import * as bcrypt from 'bcryptjs';

// ============================================================
// PETCAREHUB DATABASE SEEDER
// Dữ liệu mẫu cho hệ thống dịch vụ chăm sóc thú cưng
// ============================================================

async function seed() {
  console.log('🐾 Đang kết nối database...');
  await AppDataSource.initialize();
  const em = AppDataSource.manager;
  console.log('✅ Kết nối thành công!\n');

  try {
    // Disable FK checks & clear data
    await em.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('🗑️  Xóa dữ liệu cũ...');
    const tables = [
      'consultation_messages', 'consultations', 'support_messages', 'support_tickets',
      'likes', 'comments', 'posts', 'wishlists', 'notifications',
      'order_items', 'orders', 'appointments', 'reviews',
      'product_images', 'product_variants', 'products', 'services',
      'pet_medical_history', 'pets', 'categories', 'follows',
      'discount_codes', 'business_hours', 'settings', 'user_profiles', 'users',
    ];
    for (const t of tables) await em.query(`DELETE FROM \`${t}\``);
    await em.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Đã xóa dữ liệu cũ\n');

    const pw = await bcrypt.hash('123456', 10);

    // ==================== USERS ====================
    console.log('👤 Đang tạo người dùng...');
    const usersData = [
      { email: 'admin@petcarehub.vn', role: 'admin' },
      { email: 'bacsi.minh@petcarehub.vn', role: 'staff' },
      { email: 'bacsi.lan@petcarehub.vn', role: 'staff' },
      { email: 'groomer.tuan@petcarehub.vn', role: 'staff' },
      { email: 'nguyenvana@gmail.com', role: 'user' },
      { email: 'tranthib@gmail.com', role: 'user' },
      { email: 'phamvanc@gmail.com', role: 'user' },
      { email: 'lehoangd@gmail.com', role: 'user' },
      { email: 'vuthie@gmail.com', role: 'user' },
    ];

    const userIds: string[] = [];
    for (const u of usersData) {
      const res = await em.query(
        `INSERT INTO users (id, email, password, role, status, emailVerified, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, 'active', 1, NOW(), NOW())`,
        [u.email, pw, u.role],
      );
      // Get inserted id
      const [row] = await em.query(`SELECT id FROM users WHERE email = ?`, [u.email]);
      userIds.push(row.id);
    }
    const [adminId, staff1Id, staff2Id, staff3Id, user1Id, user2Id, user3Id, user4Id, user5Id] = userIds;

    // Profiles
    const profiles = [
      { userId: adminId, name: 'Đỗ Quốc Khánh', phone: '0901234567', address: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', gender: 'male', city: 'Hà Nội', bio: 'Quản trị viên hệ thống PetCareHub' },
      { userId: staff1Id, name: 'Nguyễn Văn Minh', phone: '0912345678', address: '45 Lê Lợi, Quận 3, TP.HCM', avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200', gender: 'male', city: 'Hồ Chí Minh', bio: 'Bác sĩ thú y 10 năm kinh nghiệm, chuyên khoa nội và phẫu thuật' },
      { userId: staff2Id, name: 'Phạm Thị Lan', phone: '0923456789', address: '78 Trần Hưng Đạo, Quận 5, TP.HCM', avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200', gender: 'female', city: 'Hồ Chí Minh', bio: 'Bác sĩ thú y chuyên về da liễu và dinh dưỡng thú cưng' },
      { userId: staff3Id, name: 'Lê Anh Tuấn', phone: '0934567890', address: '12 Hai Bà Trưng, Quận 1, TP.HCM', avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200', gender: 'male', city: 'Hồ Chí Minh', bio: 'Chuyên viên grooming cao cấp, 5 năm kinh nghiệm' },
      { userId: user1Id, name: 'Nguyễn Văn An', phone: '0945678901', address: '56 Pasteur, Quận 1, TP.HCM', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', gender: 'male', city: 'Hồ Chí Minh', bio: 'Yêu chó mèo, nuôi 2 bé Corgi siêu dễ thương' },
      { userId: user2Id, name: 'Trần Thị Bích', phone: '0956789012', address: '234 Võ Văn Tần, Quận 3, TP.HCM', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', gender: 'female', city: 'Hồ Chí Minh', bio: 'Mẹ của 3 bé mèo Ba Tư, thích chia sẻ kinh nghiệm nuôi mèo' },
      { userId: user3Id, name: 'Phạm Văn Cường', phone: '0967890123', address: '89 Điện Biên Phủ, Bình Thạnh, TP.HCM', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', gender: 'male', city: 'Hồ Chí Minh', bio: 'Nuôi Golden Retriever và Husky' },
      { userId: user4Id, name: 'Lê Hoàng Dũng', phone: '0978901234', address: '167 Cách Mạng Tháng 8, Quận 10, TP.HCM', avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200', gender: 'male', city: 'Hồ Chí Minh', bio: 'Nuôi chim và cá cảnh, đam mê thế giới động vật' },
      { userId: user5Id, name: 'Vũ Thị Em', phone: '0989012345', address: '321 Nguyễn Thị Minh Khai, Quận 1, TP.HCM', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', gender: 'female', city: 'Hồ Chí Minh', bio: 'Yêu động vật, tình nguyện viên cứu hộ thú cưng' },
    ];
    for (const p of profiles) {
      await em.query(
        `INSERT INTO user_profiles (id, userId, name, phone, address, avatarUrl, gender, city, country, bio) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 'Việt Nam', ?)`,
        [p.userId, p.name, p.phone, p.address, p.avatarUrl, p.gender, p.city, p.bio],
      );
    }
    console.log(`✅ Đã tạo ${usersData.length} người dùng\n`);

    // ==================== CATEGORIES ====================
    console.log('📂 Đang tạo danh mục...');
    const catsData = [
      // Service
      { name: 'Khám bệnh', slug: 'kham-benh', type: 'service', description: 'Dịch vụ khám và điều trị bệnh cho thú cưng', icon: '🏥', sortOrder: 1 },
      { name: 'Grooming', slug: 'grooming', type: 'service', description: 'Dịch vụ làm đẹp, tắm rửa, cắt tỉa lông', icon: '✂️', sortOrder: 2 },
      { name: 'Spa thú cưng', slug: 'spa-thu-cung', type: 'service', description: 'Dịch vụ spa cao cấp cho thú cưng', icon: '💆', sortOrder: 3 },
      { name: 'Tiêm phòng', slug: 'tiem-phong', type: 'service', description: 'Dịch vụ tiêm phòng vaccine', icon: '💉', sortOrder: 4 },
      { name: 'Phẫu thuật', slug: 'phau-thuat', type: 'service', description: 'Dịch vụ phẫu thuật chuyên khoa', icon: '🔬', sortOrder: 5 },
      { name: 'Khám định kỳ', slug: 'kham-dinh-ky', type: 'service', description: 'Khám sức khỏe định kỳ', icon: '📋', sortOrder: 6 },
      // Product
      { name: 'Thức ăn', slug: 'thuc-an', type: 'product', description: 'Thức ăn dinh dưỡng cho thú cưng', icon: '🍖', sortOrder: 1 },
      { name: 'Đồ chơi', slug: 'do-choi', type: 'product', description: 'Đồ chơi giải trí cho thú cưng', icon: '🎾', sortOrder: 2 },
      { name: 'Phụ kiện', slug: 'phu-kien', type: 'product', description: 'Phụ kiện, vòng cổ, dây dắt', icon: '🎀', sortOrder: 3 },
      { name: 'Thuốc & Vitamin', slug: 'thuoc-vitamin', type: 'product', description: 'Thuốc và vitamin bổ sung', icon: '💊', sortOrder: 4 },
      { name: 'Vệ sinh', slug: 've-sinh', type: 'product', description: 'Sản phẩm vệ sinh, tắm gội', icon: '🧴', sortOrder: 5 },
      { name: 'Quần áo', slug: 'quan-ao', type: 'product', description: 'Quần áo thời trang cho thú cưng', icon: '👕', sortOrder: 6 },
      // Pet
      { name: 'Chó', slug: 'cho', type: 'pet', description: 'Các giống chó phổ biến', icon: '🐕', sortOrder: 1 },
      { name: 'Mèo', slug: 'meo', type: 'pet', description: 'Các giống mèo phổ biến', icon: '🐈', sortOrder: 2 },
      { name: 'Chim', slug: 'chim', type: 'pet', description: 'Các loại chim cảnh', icon: '🐦', sortOrder: 3 },
      { name: 'Cá cảnh', slug: 'ca-canh', type: 'pet', description: 'Các loại cá cảnh', icon: '🐠', sortOrder: 4 },
      // Content
      { name: 'Sức khỏe', slug: 'suc-khoe', type: 'content', description: 'Bài viết về sức khỏe thú cưng', icon: '❤️', sortOrder: 1 },
      { name: 'Huấn luyện', slug: 'huan-luyen', type: 'content', description: 'Bài viết về huấn luyện thú cưng', icon: '🎓', sortOrder: 2 },
      { name: 'Dinh dưỡng', slug: 'dinh-duong', type: 'content', description: 'Bài viết về dinh dưỡng thú cưng', icon: '🥗', sortOrder: 3 },
    ];
    const catIds: Record<string, string> = {};
    for (const c of catsData) {
      await em.query(
        `INSERT INTO categories (id, name, slug, type, description, icon, sortOrder, isActive, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [c.name, c.slug, c.type, c.description, c.icon, c.sortOrder],
      );
      const [row] = await em.query(`SELECT id FROM categories WHERE slug = ?`, [c.slug]);
      catIds[c.slug] = row.id;
    }
    console.log(`✅ Đã tạo ${catsData.length} danh mục\n`);

    // ==================== SERVICES ====================
    console.log('🏥 Đang tạo dịch vụ...');
    const svcsData = [
      { name: 'Khám tổng quát', slug: 'kham-tong-quat', desc: 'Khám sức khỏe tổng quát cho thú cưng bao gồm kiểm tra tim, phổi, da, lông, răng miệng và đánh giá tình trạng sức khỏe chung.', price: 200000, dur: 30, cat: 'kham-benh', petTypes: ['Chó', 'Mèo', 'Chim'], img: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600', features: ['Kiểm tra toàn diện', 'Tư vấn dinh dưỡng', 'Báo cáo sức khỏe'], reqs: ['Nhịn ăn 4 tiếng trước khám', 'Mang sổ tiêm phòng'] },
      { name: 'Khám da liễu', slug: 'kham-da-lieu', desc: 'Chẩn đoán và điều trị bệnh về da, lông, ký sinh trùng. Bao gồm soi da, xét nghiệm nấm da.', price: 300000, dur: 45, cat: 'kham-benh', petTypes: ['Chó', 'Mèo'], img: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600', features: ['Soi da chuyên sâu', 'Xét nghiệm nấm', 'Kê đơn thuốc'], reqs: ['Không tắm 2 ngày trước khám'] },
      { name: 'Tắm & Sấy cơ bản', slug: 'tam-say-co-ban', desc: 'Tắm sạch với sữa tắm chuyên dụng, sấy khô lông, vệ sinh tai, cắt móng cho thú cưng.', price: 150000, dur: 60, cat: 'grooming', petTypes: ['Chó', 'Mèo'], img: 'https://images.unsplash.com/photo-1516222338250-863216ce01ea?w=600', features: ['Sữa tắm cao cấp', 'Sấy khô hoàn toàn', 'Vệ sinh tai', 'Cắt móng'], reqs: ['Thú cưng đã tiêm phòng'] },
      { name: 'Cắt tỉa tạo kiểu', slug: 'cat-tia-tao-kieu', desc: 'Cắt tỉa lông chuyên nghiệp, tạo kiểu theo yêu cầu. Bao gồm tắm, sấy, cắt tỉa và tạo kiểu.', price: 350000, dur: 120, cat: 'grooming', petTypes: ['Chó', 'Mèo'], img: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=600', features: ['Tạo kiểu theo yêu cầu', 'Tắm & sấy', 'Xịt nước hoa', 'Kết nơ trang trí'], reqs: ['Đặt lịch trước 1 ngày'] },
      { name: 'Spa toàn thân cao cấp', slug: 'spa-toan-than', desc: 'Gói spa cao cấp gồm tắm thảo dược, massage thư giãn, dưỡng lông, vệ sinh toàn diện.', price: 500000, dur: 150, cat: 'spa-thu-cung', petTypes: ['Chó', 'Mèo'], img: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600', features: ['Tắm thảo dược', 'Massage thư giãn', 'Dưỡng lông siêu mượt', 'Xịt nước hoa cao cấp'], reqs: ['Đặt lịch trước 2 ngày'] },
      { name: 'Tiêm phòng dại', slug: 'tiem-phong-dai', desc: 'Tiêm vaccine phòng bệnh dại cho chó mèo. Vaccine nhập khẩu, bảo quản đúng chuẩn.', price: 250000, dur: 15, cat: 'tiem-phong', petTypes: ['Chó', 'Mèo'], img: 'https://images.unsplash.com/photo-1612531386530-97c87416d205?w=600', features: ['Vaccine nhập khẩu', 'Cấp giấy chứng nhận', 'Theo dõi sau tiêm'], reqs: ['Thú cưng khỏe mạnh', 'Đủ 3 tháng tuổi'] },
      { name: 'Tiêm phòng 5 bệnh (chó)', slug: 'tiem-5-benh-cho', desc: 'Tiêm vaccine 5 bệnh cho chó: Care, Parvo, Viêm gan, Ho cũi, Phó cúm. Liệu trình 3 mũi.', price: 350000, dur: 20, cat: 'tiem-phong', petTypes: ['Chó'], img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600', features: ['Vaccine Nobivac nhập khẩu', 'Liệu trình 3 mũi', 'Nhắc lịch tự động'], reqs: ['Chó khỏe mạnh', 'Đủ 6 tuần tuổi', 'Đã tẩy giun'] },
      { name: 'Tiêm phòng 4 bệnh (mèo)', slug: 'tiem-4-benh-meo', desc: 'Tiêm vaccine 4 bệnh cho mèo: Giảm bạch cầu, Calici, Herpes, Chlamydia.', price: 300000, dur: 20, cat: 'tiem-phong', petTypes: ['Mèo'], img: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600', features: ['Vaccine Felocell nhập khẩu', 'Bảo vệ toàn diện', 'Nhắc lịch tự động'], reqs: ['Mèo khỏe mạnh', 'Đủ 8 tuần tuổi'] },
      { name: 'Phẫu thuật triệt sản', slug: 'phau-thuat-triet-san', desc: 'Phẫu thuật triệt sản an toàn cho chó mèo. Gây mê hiện đại, theo dõi hậu phẫu chu đáo.', price: 1500000, dur: 90, cat: 'phau-thuat', petTypes: ['Chó', 'Mèo'], img: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=600', features: ['Gây mê an toàn', 'Phòng mổ vô trùng', 'Theo dõi hậu phẫu', 'Tái khám miễn phí'], reqs: ['Nhịn ăn 8 tiếng', 'Xét nghiệm máu trước mổ'] },
      { name: 'Lấy cao răng', slug: 'lay-cao-rang', desc: 'Vệ sinh răng miệng chuyên sâu, lấy cao răng bằng máy siêu âm, đánh bóng răng.', price: 800000, dur: 60, cat: 'phau-thuat', petTypes: ['Chó', 'Mèo'], img: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600', features: ['Máy siêu âm hiện đại', 'Đánh bóng răng', 'Kiểm tra sâu răng'], reqs: ['Nhịn ăn 6 tiếng', 'Gây mê nhẹ'] },
      { name: 'Khám sức khỏe định kỳ', slug: 'kham-suc-khoe-dk', desc: 'Gói khám sức khỏe định kỳ gồm khám tổng quát, xét nghiệm máu, nước tiểu và siêu âm bụng.', price: 600000, dur: 60, cat: 'kham-dinh-ky', petTypes: ['Chó', 'Mèo'], img: 'https://images.unsplash.com/photo-1583337130417-13104dec14c9?w=600', features: ['Xét nghiệm máu', 'Xét nghiệm nước tiểu', 'Siêu âm bụng', 'Báo cáo chi tiết'], reqs: ['Nhịn ăn 8 tiếng'] },
      { name: 'Tắm thuốc trị ve rận', slug: 'tam-thuoc-ve-ran', desc: 'Tắm thuốc đặc trị ve, rận, bọ chét. Thuốc an toàn, hiệu quả cao.', price: 250000, dur: 45, cat: 'spa-thu-cung', petTypes: ['Chó', 'Mèo'], img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600', features: ['Thuốc đặc trị an toàn', 'Hiệu quả cao', 'Tư vấn phòng ngừa'], reqs: ['Không có vết thương hở'] },
    ];
    const svcIds: Record<string, string> = {};
    for (const s of svcsData) {
      await em.query(
        `INSERT INTO services (id, name, slug, description, price, duration, categoryId, petTypes, imageUrl, features, \`requirements\`, isActive, isBookable, sortOrder, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 0, NOW(), NOW())`,
        [s.name, s.slug, s.desc, s.price, s.dur, catIds[s.cat], JSON.stringify(s.petTypes), s.img, JSON.stringify(s.features), JSON.stringify(s.reqs)],
      );
      const [row] = await em.query(`SELECT id FROM services WHERE slug = ?`, [s.slug]);
      svcIds[s.slug] = row.id;
    }
    console.log(`✅ Đã tạo ${svcsData.length} dịch vụ\n`);

    // ==================== PRODUCTS ====================
    console.log('🛒 Đang tạo sản phẩm...');
    const prodsData = [
      { name: 'Royal Canin Maxi Adult', slug: 'royal-canin-maxi-adult', sku: 'RC-MAXI-01', desc: 'Thức ăn hạt cao cấp dành cho chó trưởng thành giống lớn (26-44kg). Công thức giàu protein, omega-3 dưỡng lông bóng mượt.', short: 'Thức ăn hạt cho chó lớn', price: 850000, compare: 950000, stock: 100, cat: 'thuc-an', brand: 'Royal Canin', tags: ['chó', 'thức ăn hạt'], features: ['Giàu protein', 'Omega-3 & 6', 'Hỗ trợ tiêu hóa'], img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600' },
      { name: 'Whiskas Cá Ngừ cho Mèo', slug: 'whiskas-ca-ngu', sku: 'WK-TUNA-01', desc: 'Thức ăn ướt Whiskas vị cá ngừ, giàu protein và taurine thiết yếu cho mèo.', short: 'Thức ăn ướt vị cá ngừ', price: 25000, compare: 30000, stock: 500, cat: 'thuc-an', brand: 'Whiskas', tags: ['mèo', 'thức ăn ướt'], features: ['Giàu taurine', 'Protein cao'], img: 'https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=600' },
      { name: 'Bóng cao su đặc cho chó', slug: 'bong-cao-su-cho', sku: 'TOY-BALL-01', desc: 'Bóng cao su đặc siêu bền, không độc hại, an toàn cho chó nhai. Nảy tốt, phù hợp trong nhà và ngoài trời.', short: 'Bóng cao su bền cho chó', price: 85000, compare: null, stock: 200, cat: 'do-choi', brand: 'Kong', tags: ['chó', 'đồ chơi'], features: ['Cao su tự nhiên', 'Siêu bền', 'An toàn'], img: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600' },
      { name: 'Cần câu lông vũ cho mèo', slug: 'can-cau-long-vu', sku: 'TOY-FEATH-01', desc: 'Cần câu đồ chơi lông vũ nhiều màu, kích thích bản năng săn mồi. Cán dẻo, lông vũ tự nhiên.', short: 'Đồ chơi cần câu cho mèo', price: 65000, compare: null, stock: 300, cat: 'do-choi', brand: 'CatPlay', tags: ['mèo', 'đồ chơi'], features: ['Lông vũ tự nhiên', 'Cán dẻo bền'], img: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=600' },
      { name: 'Vòng cổ da cao cấp', slug: 'vong-co-da', sku: 'ACC-COLL-01', desc: 'Vòng cổ da bò thật cao cấp, khóa kim loại chắc chắn. Lót đệm êm ái, nhiều size.', short: 'Vòng cổ da bò thật cho chó', price: 220000, compare: 280000, stock: 150, cat: 'phu-kien', brand: 'PetLux', tags: ['chó', 'vòng cổ'], features: ['Da bò thật', 'Khóa kim loại'], img: 'https://images.unsplash.com/photo-1567612529009-afe25813a308?w=600' },
      { name: 'Dây dắt tự động 5m', slug: 'day-dat-tu-dong', sku: 'ACC-LEAS-01', desc: 'Dây dắt tự động co giãn 5 mét, nút khóa tiện lợi. Tay cầm ergonomic, chịu lực 25kg.', short: 'Dây dắt tự động co giãn', price: 350000, compare: null, stock: 80, cat: 'phu-kien', brand: 'Flexi', tags: ['chó', 'dây dắt'], features: ['Co giãn 5m', 'Nút khóa an toàn'], img: 'https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=600' },
      { name: 'Vitamin tổng hợp cho chó', slug: 'vitamin-tong-hop', sku: 'MED-VIT-01', desc: 'Viên nhai vitamin tổng hợp bổ sung A, D, E, B complex, canxi và khoáng chất. Hỗ trợ xương khỏe, lông mượt.', short: 'Vitamin tổng hợp viên nhai', price: 180000, compare: null, stock: 120, cat: 'thuoc-vitamin', brand: 'VetPlus', tags: ['chó', 'vitamin'], features: ['Đầy đủ vitamin', 'Dạng viên nhai'], img: 'https://images.unsplash.com/photo-1585559604959-6388fe69c92a?w=600' },
      { name: 'Dầu cá hồi Omega 3-6', slug: 'dau-ca-hoi-omega', sku: 'MED-OMEGA-01', desc: 'Dầu cá hồi nguyên chất giàu Omega 3-6, hỗ trợ da khỏe, lông bóng mượt, tăng cường miễn dịch.', short: 'Dầu cá hồi bổ sung Omega', price: 250000, compare: null, stock: 90, cat: 'thuoc-vitamin', brand: 'NaturVet', tags: ['chó', 'mèo', 'omega'], features: ['Omega 3 & 6', 'Dưỡng lông mượt'], img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600' },
      { name: 'Sữa tắm diệt khuẩn', slug: 'sua-tam-diet-khuan', sku: 'HYG-SHAM-01', desc: 'Sữa tắm chuyên dụng diệt khuẩn, trị nấm, giảm ngứa. Chiết xuất trà xanh và nha đam.', short: 'Sữa tắm diệt khuẩn cho chó', price: 120000, compare: null, stock: 200, cat: 've-sinh', brand: 'BioClean', tags: ['chó', 'sữa tắm'], features: ['Diệt khuẩn', 'Trị nấm da'], img: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600' },
      { name: 'Khay vệ sinh cho mèo', slug: 'khay-ve-sinh-meo', sku: 'HYG-LBOX-01', desc: 'Khay vệ sinh kín có nắp đậy, chống mùi hiệu quả. Nhựa PP cao cấp, kèm xẻng xúc.', short: 'Khay vệ sinh có nắp cho mèo', price: 280000, compare: null, stock: 60, cat: 've-sinh', brand: 'CatIt', tags: ['mèo', 'khay vệ sinh'], features: ['Có nắp chống mùi', 'Nhựa PP cao cấp'], img: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600' },
      { name: 'Áo hoodie cho chó nhỏ', slug: 'ao-hoodie-cho-nho', sku: 'CLO-HOOD-01', desc: 'Áo hoodie cotton mềm mại cho chó nhỏ (dưới 8kg). Giữ ấm tốt, nhiều màu sắc.', short: 'Áo hoodie giữ ấm cho chó nhỏ', price: 150000, compare: 200000, stock: 100, cat: 'quan-ao', brand: 'PetFashion', tags: ['chó', 'quần áo'], features: ['Cotton mềm mại', 'Giữ ấm tốt'], img: 'https://images.unsplash.com/photo-1583337130417-13104dec14c9?w=600' },
      { name: 'Pate Nutrience cho mèo', slug: 'pate-nutrience-meo', sku: 'FD-PATE-01', desc: 'Pate SubZero vị gà tây và cá hồi, nguyên liệu tươi, không chất bảo quản.', short: 'Pate cao cấp cho mèo', price: 45000, compare: null, stock: 400, cat: 'thuc-an', brand: 'Nutrience', tags: ['mèo', 'pate'], features: ['Nguyên liệu tươi', 'Không bảo quản'], img: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600' },
      { name: 'Balo vận chuyển thú cưng', slug: 'balo-van-chuyen', sku: 'ACC-BAG-01', desc: 'Balo trong suốt, lỗ thoáng khí. Phù hợp chó mèo dưới 6kg. Đệm lót êm ái.', short: 'Balo trong suốt mang thú cưng', price: 450000, compare: 550000, stock: 40, cat: 'phu-kien', brand: 'PetTravel', tags: ['chó', 'mèo', 'balo'], features: ['Cửa sổ trong suốt', 'Thoáng khí'], img: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600' },
      { name: 'Cát vệ sinh đậu nành', slug: 'cat-ve-sinh-dau-nanh', sku: 'HYG-SAND-01', desc: 'Cát vệ sinh đậu nành tự nhiên, vón cục tốt, khử mùi. An toàn, xả bồn cầu được.', short: 'Cát vệ sinh đậu nành', price: 95000, compare: null, stock: 300, cat: 've-sinh', brand: 'CatBest', tags: ['mèo', 'cát vệ sinh'], features: ['Đậu nành tự nhiên', 'Vón cục tốt'], img: 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=600' },
      { name: 'Nhà cây cho mèo', slug: 'nha-cay-cho-meo', sku: 'ACC-TREE-01', desc: 'Nhà cây leo nhiều tầng, bọc thừng sisal mài móng, ổ nằm êm ái. Cao 1.2m.', short: 'Nhà cây leo đa tầng cho mèo', price: 1200000, compare: 1500000, stock: 25, cat: 'do-choi', brand: 'CatTree', tags: ['mèo', 'nhà cây'], features: ['Thừng sisal', 'Nhiều tầng', 'Ổ nằm êm'], img: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=600' },
    ];
    const prodIds: Record<string, string> = {};
    for (const p of prodsData) {
      await em.query(
        `INSERT INTO products (id, name, slug, sku, description, shortDescription, price, comparePrice, stockQuantity, categoryId, brand, tags, features, isActive, featured, sortOrder, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, NOW(), NOW())`,
        [p.name, p.slug, p.sku, p.desc, p.short, p.price, p.compare, p.stock, catIds[p.cat], p.brand, JSON.stringify(p.tags), JSON.stringify(p.features)],
      );
      const [row] = await em.query(`SELECT id FROM products WHERE slug = ?`, [p.slug]);
      prodIds[p.slug] = row.id;
      // Product image
      await em.query(
        `INSERT INTO product_images (id, productId, imageUrl, altText, sortOrder, isPrimary, createdAt) VALUES (UUID(), ?, ?, ?, 0, 1, NOW())`,
        [row.id, p.img, p.name],
      );
    }

    // Product variants
    const variants = [
      { prod: 'royal-canin-maxi-adult', name: 'Bao 4kg', sku: 'RC-MAXI-4KG', mod: 0, stock: 50, attrs: { weight: '4kg' } },
      { prod: 'royal-canin-maxi-adult', name: 'Bao 10kg', sku: 'RC-MAXI-10KG', mod: 1100000, stock: 30, attrs: { weight: '10kg' } },
      { prod: 'royal-canin-maxi-adult', name: 'Bao 16kg', sku: 'RC-MAXI-16KG', mod: 1800000, stock: 20, attrs: { weight: '16kg' } },
      { prod: 'vong-co-da', name: 'Size S (25-35cm)', sku: 'ACC-COLL-S', mod: 0, stock: 50, attrs: { size: 'S' } },
      { prod: 'vong-co-da', name: 'Size M (35-45cm)', sku: 'ACC-COLL-M', mod: 30000, stock: 50, attrs: { size: 'M' } },
      { prod: 'vong-co-da', name: 'Size L (45-55cm)', sku: 'ACC-COLL-L', mod: 60000, stock: 50, attrs: { size: 'L' } },
      { prod: 'ao-hoodie-cho-nho', name: 'Size XS (1-3kg)', sku: 'CLO-XS', mod: 0, stock: 30, attrs: { size: 'XS' } },
      { prod: 'ao-hoodie-cho-nho', name: 'Size S (3-5kg)', sku: 'CLO-S', mod: 20000, stock: 40, attrs: { size: 'S' } },
      { prod: 'ao-hoodie-cho-nho', name: 'Size M (5-8kg)', sku: 'CLO-M', mod: 40000, stock: 30, attrs: { size: 'M' } },
    ];
    for (const v of variants) {
      await em.query(
        `INSERT INTO product_variants (id, productId, name, sku, priceModifier, stock, attributes, isActive, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [prodIds[v.prod], v.name, v.sku, v.mod, v.stock, JSON.stringify(v.attrs)],
      );
    }
    console.log(`✅ Đã tạo ${prodsData.length} sản phẩm + ${variants.length} biến thể\n`);

    // ==================== PETS ====================
    console.log('🐾 Đang tạo hồ sơ thú cưng...');
    const petsData = [
      { owner: user1Id, name: 'Bông', species: 'Chó', breed: 'Corgi', age: 3, weight: 12.5, gender: 'male', photo: 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=400', medical: 'Sức khỏe tốt, cần kiểm soát cân nặng', behavior: 'Thân thiện, hay nhảy nhót, thích chơi bóng', allergies: ['Thức ăn có ngô'] },
      { owner: user1Id, name: 'Mochi', species: 'Chó', breed: 'Corgi', age: 2, weight: 10.0, gender: 'female', photo: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', medical: 'Đã tiêm phòng đầy đủ', behavior: 'Nhút nhát với người lạ, thích nằm phơi nắng', allergies: [] },
      { owner: user2Id, name: 'Miu', species: 'Mèo', breed: 'Ba Tư', age: 4, weight: 5.5, gender: 'female', photo: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400', medical: 'Tiền sử viêm mắt, cần vệ sinh mắt thường xuyên', behavior: 'Điềm tĩnh, thích được vuốt ve', allergies: ['Sữa bò'] },
      { owner: user2Id, name: 'Kitty', species: 'Mèo', breed: 'Ba Tư', age: 3, weight: 4.8, gender: 'female', photo: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400', medical: 'Khỏe mạnh', behavior: 'Tinh nghịch, hay leo trèo', allergies: [] },
      { owner: user2Id, name: 'Tom', species: 'Mèo', breed: 'Anh lông ngắn', age: 2, weight: 5.0, gender: 'male', photo: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400', medical: 'Đã triệt sản', behavior: 'Hiền lành, thích ngủ', allergies: [] },
      { owner: user3Id, name: 'Lucky', species: 'Chó', breed: 'Golden Retriever', age: 5, weight: 32.0, gender: 'male', photo: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400', medical: 'Viêm khớp nhẹ, bổ sung glucosamine', behavior: 'Cực kỳ thân thiện, thích bơi lội', allergies: ['Thịt gà'] },
      { owner: user3Id, name: 'Snow', species: 'Chó', breed: 'Husky Siberia', age: 3, weight: 25.0, gender: 'female', photo: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=400', medical: 'Khỏe mạnh, năng động', behavior: 'Hiếu động, thích chạy nhảy, hay hú', allergies: [] },
      { owner: user4Id, name: 'Rio', species: 'Chim', breed: 'Vẹt Cockatiel', age: 2, weight: 0.1, gender: 'male', photo: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400', medical: 'Khỏe mạnh, lông đẹp', behavior: 'Biết hót nhiều bài, thích được vuốt đầu', allergies: [] },
      { owner: user5Id, name: 'Bún', species: 'Chó', breed: 'Poodle', age: 1, weight: 4.0, gender: 'female', photo: 'https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400', medical: 'Đang tiêm phòng', behavior: 'Vui vẻ, hay quấn chủ', allergies: [] },
      { owner: user5Id, name: 'Gấu', species: 'Chó', breed: 'Phốc Sóc', age: 4, weight: 3.2, gender: 'male', photo: 'https://images.unsplash.com/photo-1583337130417-13104dec14c9?w=400', medical: 'Răng yếu, cần chăm sóc răng miệng', behavior: 'Hay sủa, bảo vệ chủ', allergies: ['Hải sản'] },
    ];
    const petIds: Record<string, string> = {};
    for (const p of petsData) {
      await em.query(
        `INSERT INTO pets (id, ownerId, name, species, breed, age, weight, gender, photoUrl, medicalNotes, behaviorNotes, allergies, isActive, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [p.owner, p.name, p.species, p.breed, p.age, p.weight, p.gender, p.photo, p.medical, p.behavior, JSON.stringify(p.allergies)],
      );
      const [row] = await em.query(`SELECT id FROM pets WHERE name = ? AND ownerId = ?`, [p.name, p.owner]);
      petIds[p.name] = row.id;
    }

    // Pet medical history
    const medRecords = [
      { pet: 'Bông', type: 'vaccination', title: 'Tiêm phòng dại', desc: 'Tiêm vaccine phòng dại mũi nhắc lại hàng năm', date: '2025-06-15', vet: 'BS. Nguyễn Văn Minh', clinic: 'PetCareHub', cost: 250000 },
      { pet: 'Bông', type: 'vaccination', title: 'Tiêm phòng 5 bệnh - Mũi 3', desc: 'Mũi cuối liệu trình tiêm phòng 5 bệnh', date: '2025-03-20', vet: 'BS. Nguyễn Văn Minh', clinic: 'PetCareHub', cost: 350000 },
      { pet: 'Miu', type: 'treatment', title: 'Điều trị viêm mắt', desc: 'Viêm kết mạc, kê thuốc nhỏ mắt Tobramycin', date: '2025-08-10', vet: 'BS. Phạm Thị Lan', clinic: 'PetCareHub', cost: 400000, meds: ['Tobramycin nhỏ mắt', 'Vitamin A'] },
      { pet: 'Lucky', type: 'checkup', title: 'Khám sức khỏe định kỳ', desc: 'Phát hiện viêm khớp nhẹ ở chân sau', date: '2025-09-01', vet: 'BS. Nguyễn Văn Minh', clinic: 'PetCareHub', cost: 600000, meds: ['Glucosamine', 'Chondroitin'] },
      { pet: 'Lucky', type: 'vaccination', title: 'Tiêm phòng dại', desc: 'Tiêm vaccine phòng dại hàng năm', date: '2025-07-20', vet: 'BS. Phạm Thị Lan', clinic: 'PetCareHub', cost: 250000 },
      { pet: 'Bún', type: 'vaccination', title: 'Tiêm phòng 5 bệnh - Mũi 1', desc: 'Mũi đầu tiên trong liệu trình', date: '2025-11-01', vet: 'BS. Nguyễn Văn Minh', clinic: 'PetCareHub', cost: 350000, nextDue: '2025-12-01' },
      { pet: 'Gấu', type: 'treatment', title: 'Lấy cao răng', desc: 'Lấy cao răng và kiểm tra răng miệng tổng quát', date: '2025-10-15', vet: 'BS. Phạm Thị Lan', clinic: 'PetCareHub', cost: 800000 },
    ];
    for (const m of medRecords) {
      await em.query(
        `INSERT INTO pet_medical_history (id, petId, type, title, description, date, veterinarian, clinic, cost, medications, nextDueDate, createdAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [petIds[m.pet], m.type, m.title, m.desc, m.date, m.vet, m.clinic, m.cost, m.meds ? JSON.stringify(m.meds) : null, m.nextDue || null],
      );
    }
    console.log(`✅ Đã tạo ${petsData.length} thú cưng + ${medRecords.length} hồ sơ y tế\n`);

    // ==================== APPOINTMENTS ====================
    console.log('📅 Đang tạo lịch hẹn...');
    const appts = [
      { user: user1Id, pet: 'Bông', svc: 'tam-say-co-ban', staff: staff3Id, dt: '2026-03-05 09:00:00', status: 'confirmed', price: 150000, notes: 'Tắm sấy cho bé Bông, lưu ý lông dày' },
      { user: user1Id, pet: 'Mochi', svc: 'cat-tia-tao-kieu', staff: staff3Id, dt: '2026-03-05 10:30:00', status: 'confirmed', price: 350000, notes: 'Cắt tỉa kiểu Teddy Bear cho Mochi' },
      { user: user2Id, pet: 'Miu', svc: 'kham-da-lieu', staff: staff2Id, dt: '2026-03-06 14:00:00', status: 'pending', price: 300000, notes: 'Bé Miu bị ngứa da vùng bụng' },
      { user: user3Id, pet: 'Lucky', svc: 'kham-suc-khoe-dk', staff: staff1Id, dt: '2026-03-07 08:30:00', status: 'confirmed', price: 600000, notes: 'Khám định kỳ, kiểm tra viêm khớp' },
      { user: user3Id, pet: 'Snow', svc: 'tiem-phong-dai', staff: staff1Id, dt: '2026-03-07 10:00:00', status: 'pending', price: 250000, notes: 'Tiêm phòng dại cho Snow' },
      { user: user5Id, pet: 'Bún', svc: 'tiem-5-benh-cho', staff: staff2Id, dt: '2026-03-08 09:00:00', status: 'confirmed', price: 350000, notes: 'Tiêm mũi 2 cho bé Bún' },
      { user: user5Id, pet: 'Gấu', svc: 'spa-toan-than', staff: staff3Id, dt: '2026-03-08 13:00:00', status: 'pending', price: 500000, notes: 'Spa toàn thân cho bé Gấu' },
      // Completed
      { user: user1Id, pet: 'Bông', svc: 'kham-tong-quat', staff: staff1Id, dt: '2026-02-15 09:00:00', status: 'completed', price: 200000, notes: 'Khám tổng quát', staffNotes: 'Bé Bông khỏe mạnh, cần giảm 1kg' },
      { user: user2Id, pet: 'Miu', svc: 'tiem-4-benh-meo', staff: staff2Id, dt: '2026-02-10 14:00:00', status: 'completed', price: 300000, notes: 'Tiêm phòng 4 bệnh', staffNotes: 'Tiêm xong, theo dõi 30 phút, không phản ứng' },
      { user: user3Id, pet: 'Lucky', svc: 'tam-say-co-ban', staff: staff3Id, dt: '2026-02-20 10:00:00', status: 'completed', price: 150000, notes: 'Tắm cho Lucky', staffNotes: 'Đã tắm sấy cắt móng, lông bóng đẹp' },
      { user: user4Id, pet: 'Rio', svc: 'kham-tong-quat', staff: staff1Id, dt: '2026-02-12 11:00:00', status: 'completed', price: 200000, notes: 'Khám sức khỏe cho Rio', staffNotes: 'Chim khỏe mạnh, lông đẹp' },
      // Cancelled
      { user: user5Id, pet: 'Gấu', svc: 'lay-cao-rang', staff: staff2Id, dt: '2026-02-25 09:00:00', status: 'cancelled', price: 800000, notes: 'Lấy cao răng cho Gấu', cancelReason: 'Bé Gấu bị ốm nhẹ, hoãn lại' },
    ];
    for (const a of appts) {
      await em.query(
        `INSERT INTO appointments (id, userId, petId, serviceId, staffId, dateTime, appointmentDate, duration, status, price, notes, staffNotes, cancellationReason, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, 60, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [a.user, petIds[a.pet], svcIds[a.svc], a.staff, a.dt, a.dt, a.status, a.price, a.notes, a.staffNotes || null, a.cancelReason || null],
      );
    }
    console.log(`✅ Đã tạo ${appts.length} lịch hẹn\n`);

    // ==================== ORDERS ====================
    console.log('📦 Đang tạo đơn hàng...');
    const ordersData = [
      { user: user1Id, num: 'ORD-20260201-001', sub: 935000, total: 935000, status: 'delivered', payStatus: 'completed', pay: 'stripe', addr: { name: 'Nguyễn Văn An', phone: '0945678901', address: '56 Pasteur, Q1', city: 'TP.HCM', postalCode: '700000', country: 'VN' } },
      { user: user2Id, num: 'ORD-20260210-002', sub: 395000, total: 395000, status: 'delivered', payStatus: 'completed', pay: 'cod', addr: { name: 'Trần Thị Bích', phone: '0956789012', address: '234 Võ Văn Tần, Q3', city: 'TP.HCM', postalCode: '700000', country: 'VN' } },
      { user: user3Id, num: 'ORD-20260220-003', sub: 1450000, total: 1450000, status: 'shipped', payStatus: 'paid', pay: 'stripe', track: 'VN123456789', carrier: 'Giao Hàng Nhanh', addr: { name: 'Phạm Văn Cường', phone: '0967890123', address: '89 ĐBP, Bình Thạnh', city: 'TP.HCM', postalCode: '700000', country: 'VN' } },
      { user: user5Id, num: 'ORD-20260225-004', sub: 545000, total: 545000, status: 'processing', payStatus: 'paid', pay: 'stripe', addr: { name: 'Vũ Thị Em', phone: '0989012345', address: '321 NTMKhai, Q1', city: 'TP.HCM', postalCode: '700000', country: 'VN' } },
      { user: user4Id, num: 'ORD-20260227-005', sub: 180000, total: 180000, status: 'pending', payStatus: 'pending', pay: 'cod', addr: { name: 'Lê Hoàng Dũng', phone: '0978901234', address: '167 CMT8, Q10', city: 'TP.HCM', postalCode: '700000', country: 'VN' } },
    ];
    const orderIds: Record<string, string> = {};
    for (const o of ordersData) {
      await em.query(
        `INSERT INTO orders (id, userId, orderNumber, subtotal, totalAmount, status, paymentStatus, paymentMethod, trackingNumber, carrier, shippingAddress, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [o.user, o.num, o.sub, o.total, o.status, o.payStatus, o.pay, o.track || null, o.carrier || null, JSON.stringify(o.addr)],
      );
      const [row] = await em.query(`SELECT id FROM orders WHERE orderNumber = ?`, [o.num]);
      orderIds[o.num] = row.id;
    }

    // Order items
    const items = [
      { ord: 'ORD-20260201-001', prod: 'royal-canin-maxi-adult', qty: 1, price: 850000, name: 'Royal Canin Maxi Adult', sku: 'RC-MAXI-01' },
      { ord: 'ORD-20260201-001', prod: 'bong-cao-su-cho', qty: 1, price: 85000, name: 'Bóng cao su đặc cho chó', sku: 'TOY-BALL-01' },
      { ord: 'ORD-20260210-002', prod: 'whiskas-ca-ngu', qty: 2, price: 25000, name: 'Whiskas Cá Ngừ cho Mèo', sku: 'WK-TUNA-01' },
      { ord: 'ORD-20260210-002', prod: 'can-cau-long-vu', qty: 1, price: 65000, name: 'Cần câu lông vũ cho mèo', sku: 'TOY-FEATH-01' },
      { ord: 'ORD-20260210-002', prod: 'khay-ve-sinh-meo', qty: 1, price: 280000, name: 'Khay vệ sinh cho mèo', sku: 'HYG-LBOX-01' },
      { ord: 'ORD-20260220-003', prod: 'nha-cay-cho-meo', qty: 1, price: 1200000, name: 'Nhà cây cho mèo', sku: 'ACC-TREE-01' },
      { ord: 'ORD-20260220-003', prod: 'dau-ca-hoi-omega', qty: 1, price: 250000, name: 'Dầu cá hồi Omega 3-6', sku: 'MED-OMEGA-01' },
      { ord: 'ORD-20260225-004', prod: 'balo-van-chuyen', qty: 1, price: 450000, name: 'Balo vận chuyển thú cưng', sku: 'ACC-BAG-01' },
      { ord: 'ORD-20260225-004', prod: 'cat-ve-sinh-dau-nanh', qty: 1, price: 95000, name: 'Cát vệ sinh đậu nành', sku: 'HYG-SAND-01' },
      { ord: 'ORD-20260227-005', prod: 'vitamin-tong-hop', qty: 1, price: 180000, name: 'Vitamin tổng hợp cho chó', sku: 'MED-VIT-01' },
    ];
    for (const i of items) {
      await em.query(
        `INSERT INTO order_items (id, orderId, productId, quantity, unitPrice, totalPrice, productName, productSku)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?)`,
        [orderIds[i.ord], prodIds[i.prod], i.qty, i.price, i.price * i.qty, i.name, i.sku],
      );
    }
    console.log(`✅ Đã tạo ${ordersData.length} đơn hàng + ${items.length} sản phẩm\n`);

    // ==================== DISCOUNT CODES ====================
    console.log('🏷️  Đang tạo mã giảm giá...');
    const discounts = [
      { code: 'WELCOME10', name: 'Chào mừng khách mới', desc: 'Giảm 10% đơn hàng đầu tiên', type: 'percentage', value: 10, min: 200000, max: 100000, limit: 100, used: 23, from: '2026-01-01', to: '2026-06-30', status: 'active' },
      { code: 'TETPET2026', name: 'Tết 2026 - Yêu thú cưng', desc: 'Giảm 50.000đ cho đơn từ 500.000đ', type: 'fixed_amount', value: 50000, min: 500000, max: null, limit: 200, used: 156, from: '2026-01-15', to: '2026-02-15', status: 'expired' },
      { code: 'GROOMING20', name: 'Giảm giá Grooming', desc: 'Giảm 20% dịch vụ grooming', type: 'percentage', value: 20, min: null, max: 200000, limit: 50, used: 12, from: '2026-03-01', to: '2026-04-30', status: 'active' },
      { code: 'FREESHIP', name: 'Miễn phí vận chuyển', desc: 'Giảm 30.000đ phí ship cho đơn từ 300.000đ', type: 'fixed_amount', value: 30000, min: 300000, max: null, limit: 500, used: 89, from: '2026-01-01', to: '2026-12-31', status: 'active' },
      { code: 'VIP15', name: 'Ưu đãi khách VIP', desc: 'Giảm 15% cho khách thân thiết', type: 'percentage', value: 15, min: null, max: 300000, limit: 30, used: 5, from: '2026-02-01', to: '2026-12-31', status: 'active' },
    ];
    for (const d of discounts) {
      await em.query(
        `INSERT INTO discount_codes (id, code, name, description, type, value, minOrderAmount, maxDiscountAmount, usageLimit, usedCount, validFrom, validTo, status, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [d.code, d.name, d.desc, d.type, d.value, d.min, d.max, d.limit, d.used, d.from, d.to, d.status],
      );
    }
    console.log(`✅ Đã tạo ${discounts.length} mã giảm giá\n`);

    // ==================== REVIEWS ====================
    console.log('⭐ Đang tạo đánh giá...');
    const reviewsData = [
      { user: user1Id, type: 'service', svc: 'tam-say-co-ban', rating: 5, title: 'Dịch vụ tuyệt vời!', comment: 'Bé Bông được tắm rất sạch, lông mềm mượt. Nhân viên nhiệt tình và yêu thương thú cưng!', rec: true },
      { user: user2Id, type: 'service', svc: 'tiem-4-benh-meo', rating: 5, title: 'Bác sĩ tận tâm', comment: 'Bé Miu được tiêm nhanh gọn, bác sĩ Lan rất nhẹ nhàng. Miu không quấy chút nào.', rec: true },
      { user: user3Id, type: 'service', svc: 'kham-suc-khoe-dk', rating: 4, title: 'Khám kỹ lưỡng', comment: 'BS Minh khám cẩn thận, phát hiện viêm khớp sớm cho Lucky. Chỉ tiếc phải chờ hơi lâu.', rec: true },
      { user: user5Id, type: 'service', svc: 'spa-toan-than', rating: 5, title: 'Spa tuyệt vời cho boss', comment: 'Bé Gấu sau spa về thơm phức, lông mềm như lụa! Rất đáng tiền, sẽ đặt hàng tháng.', rec: true },
      { user: user1Id, type: 'product', prod: 'royal-canin-maxi-adult', rating: 5, title: 'Thức ăn chất lượng', comment: 'Royal Canin luôn là số 1 cho 2 bé Corgi. Bé ăn thích, lông bóng mượt.', rec: true },
      { user: user2Id, type: 'product', prod: 'khay-ve-sinh-meo', rating: 4, title: 'Khay vệ sinh tốt', comment: 'Có nắp không bị mùi, mèo dùng thích. Hơi nhỏ cho mèo lớn.', rec: true },
      { user: user3Id, type: 'product', prod: 'dau-ca-hoi-omega', rating: 5, title: 'Hiệu quả rõ rệt', comment: 'Lucky uống 2 tuần là lông bóng mượt hẳn. Mùi không tanh, trộn thức ăn dễ dàng.', rec: true },
      { user: user5Id, type: 'product', prod: 'ao-hoodie-cho-nho', rating: 4, title: 'Áo đẹp, chất mềm', comment: 'Áo hoodie dễ thương, cotton mềm. Bé Bún mặc vừa vặn size S. Giao hàng nhanh.', rec: true },
      { user: user4Id, type: 'product', prod: 'bong-cao-su-cho', rating: 3, title: 'Tạm ổn', comment: 'Bóng nảy tốt nhưng hơi cứng. Chó nhỏ nhai khó. Phù hợp hơn cho chó vừa và lớn.', rec: false },
    ];
    for (const r of reviewsData) {
      await em.query(
        `INSERT INTO reviews (id, userId, reviewableType, productId, serviceId, rating, title, comment, status, isRecommended, isVerifiedPurchase, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 'approved', ?, 1, NOW(), NOW())`,
        [r.user, r.type, r.prod ? prodIds[r.prod] : null, r.svc ? svcIds[r.svc] : null, r.rating, r.title, r.comment, r.rec],
      );
    }
    console.log(`✅ Đã tạo ${reviewsData.length} đánh giá\n`);

    // ==================== COMMUNITY POSTS ====================
    console.log('📝 Đang tạo bài viết cộng đồng...');
    const postsData = [
      { author: adminId, title: '5 dấu hiệu thú cưng cần gặp bác sĩ ngay', content: 'Là người nuôi thú cưng, chúng ta cần nhận biết sớm các dấu hiệu bất thường:\n\n1. **Bỏ ăn liên tục trên 24 giờ**\n2. **Nôn mửa hoặc tiêu chảy kéo dài**\n3. **Thở khó hoặc thở nhanh bất thường**\n4. **Đi lại khó khăn, không đứng được**\n5. **Chảy máu không rõ nguyên nhân**\n\nHãy luôn chú ý quan sát và đưa đi khám định kỳ 6 tháng/lần!', type: 'blog', slug: '5-dau-hieu-gap-bac-si', views: 1250, likes: 89, comments: 3, pinned: true, featured: true, cat: 'suc-khoe', tags: ['sức khỏe', 'cấp cứu'], images: ['https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600'] },
      { author: adminId, title: 'Hướng dẫn chọn thức ăn theo độ tuổi chó', content: '**Chó con (0-12 tháng):**\n- Protein 25-30%, DHA, Canxi\n- 3-4 bữa/ngày\n\n**Chó trưởng thành (1-7 tuổi):**\n- Protein 18-25%, Omega 3-6\n- 2 bữa/ngày\n\n**Chó già (7+ tuổi):**\n- Giảm calo, tăng chất xơ, Glucosamine\n- Chia nhỏ bữa ăn', type: 'blog', slug: 'chon-thuc-an-theo-tuoi-cho', views: 890, likes: 67, comments: 2, cat: 'dinh-duong', tags: ['dinh dưỡng', 'chó'], images: ['https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600'] },
      { author: staff2Id, title: 'Lịch tiêm phòng chuẩn cho chó mèo - BS. Lan chia sẻ', content: '**Cho chó:**\n- 6-8 tuần: Mũi 1 (5 bệnh)\n- 9-11 tuần: Mũi 2\n- 12-16 tuần: Mũi 3 + Dại\n- Hàng năm: Nhắc lại\n\n**Cho mèo:**\n- 8 tuần: Mũi 1\n- 12 tuần: Mũi 2 + Dại\n- Hàng năm: Nhắc lại\n\n⚠️ Chỉ tiêm khi thú cưng khỏe mạnh!', type: 'blog', slug: 'lich-tiem-phong-chuan', views: 2100, likes: 145, comments: 3, pinned: true, cat: 'suc-khoe', tags: ['tiêm phòng', 'vaccine'], images: ['https://images.unsplash.com/photo-1612531386530-97c87416d205?w=600'] },
      { author: user1Id, title: 'Chia sẻ: Hành trình nuôi 2 bé Corgi', content: 'Corgi thông minh nhưng bướng bỉnh. Tips:\n\n1. **Kiểm soát cân nặng** - rất dễ béo\n2. **Vận động** 30 phút/ngày\n3. **Chải lông** 2-3 lần/tuần\n4. **Huấn luyện sớm** từ 8 tuần\n\nCác bạn nuôi Corgi có tips gì thêm không?', type: 'user_post', slug: 'hanh-trinh-nuoi-corgi', views: 560, likes: 45, comments: 3, tags: ['corgi', 'chia sẻ'], images: ['https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=600'] },
      { author: user2Id, title: 'Hỏi: Mèo Ba Tư rụng lông nhiều phải làm sao?', content: 'Bé mèo Ba Tư gần đây rụng lông rất nhiều, đặc biệt mùa hè. Đã đổi thức ăn và chải lông hàng ngày nhưng không cải thiện.\n\nCó ai gặp tình trạng tương tự không? Nên bổ sung gì?', type: 'question', slug: 'meo-ba-tu-rung-long', views: 320, likes: 12, comments: 3, tags: ['mèo Ba Tư', 'rụng lông'], images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600'] },
      { author: user3Id, title: 'Review: Dầu cá hồi Omega 3-6 - Hiệu quả thật sự!', content: '✅ **Ưu điểm:**\n- Lông bóng mượt sau 2 tuần\n- Da không còn khô\n- Mùi không tanh\n\n❌ **Nhược điểm:**\n- Giá hơi cao (250k/chai)\n- Hết nhanh nếu chó lớn\n\n⭐ 4.5/5 - Rất đáng mua!', type: 'user_post', slug: 'review-dau-ca-hoi', views: 430, likes: 34, comments: 2, tags: ['review', 'dầu cá hồi'], images: ['https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600'] },
    ];
    const postIds: Record<string, string> = {};
    for (const p of postsData) {
      await em.query(
        `INSERT INTO posts (id, authorId, title, content, type, slug, status, views, likesCount, commentsCount, isPinned, isFeatured, categoryId, tags, images, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [p.author, p.title, p.content, p.type, p.slug, p.views, p.likes, p.comments, p.pinned || false, p.featured || false, p.cat ? catIds[p.cat] : null, JSON.stringify(p.tags), p.images ? JSON.stringify(p.images) : null],
      );
      const [row] = await em.query(`SELECT id FROM posts WHERE slug = ?`, [p.slug]);
      postIds[p.slug] = row.id;
    }

    // Comments
    const commentsData = [
      { post: '5-dau-hieu-gap-bac-si', author: user1Id, content: 'Cảm ơn bài viết rất hữu ích! Bé nhà em có lần bỏ ăn 1 ngày, may mà đưa đi khám kịp.' },
      { post: '5-dau-hieu-gap-bac-si', author: user5Id, content: 'Rất cần thiết! Chia sẻ cho mọi người nuôi thú cưng biết.' },
      { post: '5-dau-hieu-gap-bac-si', author: user3Id, content: 'Lucky nhà em từng bị nôn liên tục, đưa đi khám phát hiện nuốt đồ chơi. Sợ quá!' },
      { post: 'chon-thuc-an-theo-tuoi-cho', author: user1Id, content: 'Cảm ơn, bài viết rất chi tiết. 2 bé Corgi nhà em đang ăn Royal Canin, rất ổn.' },
      { post: 'chon-thuc-an-theo-tuoi-cho', author: user3Id, content: 'Golden nhà em 5 tuổi, đang ăn hạt trộn dầu cá hồi. Rất tốt cho lông!' },
      { post: 'lich-tiem-phong-chuan', author: user1Id, content: 'Cảm ơn BS. Lan! Bé Bông nhà em đã tiêm đủ, năm nay cần nhắc lại phải không ạ?' },
      { post: 'lich-tiem-phong-chuan', author: staff2Id, content: 'Đúng rồi, hàng năm nhắc lại 1 mũi 5 bệnh + 1 mũi dại nhé! Đặt lịch tại PetCareHub nha!' },
      { post: 'lich-tiem-phong-chuan', author: user5Id, content: 'Bé Bún nhà em mới tiêm mũi 1, cảm ơn BS đã chia sẻ lịch chuẩn.' },
      { post: 'hanh-trinh-nuoi-corgi', author: user2Id, content: 'Corgi dễ thương quá! Chi phí nuôi hàng tháng khoảng bao nhiêu vậy bạn?' },
      { post: 'hanh-trinh-nuoi-corgi', author: user1Id, content: 'Khoảng 2-3 triệu/tháng gồm thức ăn, vệ sinh và khám định kỳ nhé bạn.' },
      { post: 'hanh-trinh-nuoi-corgi', author: user3Id, content: 'Corgi nhà mình cũng bướng lắm nhưng rất trung thành. Tips hay đó!' },
      { post: 'meo-ba-tu-rung-long', author: staff2Id, content: 'Chào bạn, mèo Ba Tư rụng lông có thể do thiếu Omega 3-6 hoặc stress. Bổ sung dầu cá hồi và đưa đi khám da liễu nhé!' },
      { post: 'meo-ba-tu-rung-long', author: user3Id, content: 'Mình nuôi Golden cũng rụng lông nhiều. Dùng dầu cá hồi hiệu quả lắm!' },
      { post: 'meo-ba-tu-rung-long', author: user5Id, content: 'Chải lông hàng ngày + dầu cá hồi + vitamin E là cải thiện rõ rệt.' },
      { post: 'review-dau-ca-hoi', author: user1Id, content: 'Mình cũng dùng cho 2 bé Corgi, hiệu quả thật sự! Đặt trên PetCareHub giao nhanh.' },
      { post: 'review-dau-ca-hoi', author: user5Id, content: 'Cảm ơn review chi tiết! Mình đặt mua thử cho bé Poodle nhà mình.' },
    ];
    for (const c of commentsData) {
      await em.query(
        `INSERT INTO comments (id, postId, authorId, content, status, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, 'approved', NOW(), NOW())`,
        [postIds[c.post], c.author, c.content],
      );
    }
    console.log(`✅ Đã tạo ${postsData.length} bài viết + ${commentsData.length} bình luận\n`);

    // ==================== FOLLOWS ====================
    console.log('👥 Đang tạo quan hệ follow...');
    const followsData = [
      [user1Id, staff2Id], [user2Id, staff2Id], [user3Id, staff2Id],
      [user1Id, user3Id], [user2Id, user1Id], [user5Id, user1Id],
      [user3Id, user1Id], [user5Id, staff1Id],
    ];
    for (const [f, t] of followsData) {
      await em.query(`INSERT INTO follows (id, followerId, followingId, createdAt) VALUES (UUID(), ?, ?, NOW())`, [f, t]);
    }
    console.log(`✅ Đã tạo ${followsData.length} quan hệ follow\n`);

    // ==================== WISHLISTS ====================
    console.log('❤️  Đang tạo danh sách yêu thích...');
    const wishData = [
      [user1Id, 'dau-ca-hoi-omega'], [user1Id, 'balo-van-chuyen'],
      [user2Id, 'nha-cay-cho-meo'], [user2Id, 'pate-nutrience-meo'],
      [user3Id, 'royal-canin-maxi-adult'], [user5Id, 'ao-hoodie-cho-nho'],
      [user5Id, 'can-cau-long-vu'],
    ];
    for (const [u, p] of wishData) {
      await em.query(`INSERT INTO wishlists (id, userId, productId, createdAt) VALUES (UUID(), ?, ?, NOW())`, [u, prodIds[p]]);
    }
    console.log(`✅ Đã tạo ${wishData.length} mục yêu thích\n`);

    // ==================== SUPPORT TICKETS ====================
    console.log('🎫 Đang tạo yêu cầu hỗ trợ...');
    const ticketsData = [
      { user: user1Id, title: 'Không nhận được email xác nhận đặt lịch', desc: 'Em đã đặt lịch tắm cho bé Bông ngày 05/03 nhưng không nhận được email xác nhận.', priority: 'medium', cat: 'technical', status: 'resolved', assigned: adminId, resolution: 'Đã gửi lại email. Nguyên nhân do email vào spam.' },
      { user: user3Id, title: 'Muốn đổi lịch hẹn khám cho Lucky', desc: 'Em muốn đổi lịch khám từ ngày 07/03 sang 10/03 do bận công tác.', priority: 'low', cat: 'general', status: 'open' },
      { user: null, title: 'Hỏi về dịch vụ cắt tỉa cho chó Poodle', desc: 'Em có bé Poodle 2 tuổi muốn đến cắt tỉa tạo kiểu. Cho em hỏi giá và thời gian?', priority: 'low', cat: 'general', status: 'open', guestName: 'Hoàng Mai', guestEmail: 'hoangmai@gmail.com', guestPhone: '0901122334', petType: 'Chó Poodle' },
    ];
    const ticketIds: string[] = [];
    for (const t of ticketsData) {
      await em.query(
        `INSERT INTO support_tickets (id, userId, title, description, priority, category, status, assignedToId, resolution, guestName, guestEmail, guestPhone, petType, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [t.user, t.title, t.desc, t.priority, t.cat, t.status, t.assigned || null, t.resolution || null, t.guestName || null, t.guestEmail || null, t.guestPhone || null, t.petType || null],
      );
      const [row] = await em.query(`SELECT id FROM support_tickets WHERE title = ? ORDER BY createdAt DESC LIMIT 1`, [t.title]);
      ticketIds.push(row.id);
    }

    // Support messages
    const msgs = [
      { ticket: 0, user: user1Id, msg: 'Em đặt lịch lúc 10h sáng nhưng vẫn chưa nhận được email xác nhận ạ.', type: 'user' },
      { ticket: 0, user: adminId, msg: 'Chào bạn An, email đã gửi nhưng vào mục spam. Đã gửi lại cho bạn rồi nhé!', type: 'staff' },
      { ticket: 0, user: user1Id, msg: 'Em nhận được rồi ạ. Cảm ơn admin nhiều!', type: 'user' },
      { ticket: 1, user: user3Id, msg: 'Em cần đổi lịch do lý do công tác. Mong admin hỗ trợ ạ.', type: 'user' },
    ];
    for (const m of msgs) {
      await em.query(
        `INSERT INTO support_messages (id, supportTicketId, userId, message, type, createdAt) VALUES (UUID(), ?, ?, ?, ?, NOW())`,
        [ticketIds[m.ticket], m.user, m.msg, m.type],
      );
    }
    console.log(`✅ Đã tạo ${ticketsData.length} yêu cầu hỗ trợ\n`);

    // ==================== CONSULTATIONS ====================
    console.log('🩺 Đang tạo yêu cầu tư vấn...');
    const consults = [
      { user: user2Id, vet: staff2Id, pet: 'Miu', title: 'Tư vấn chế độ ăn cho mèo Ba Tư', desc: 'Bé Miu ăn ít, lông xơ. Muốn tư vấn chế độ ăn phù hợp.', type: 'online', status: 'completed', fee: 100000, diagnosis: 'Thiếu dinh dưỡng nhẹ, cần bổ sung protein và Omega 3', prescription: 'Dầu cá hồi 5ml/ngày, đổi sang Royal Canin Persian' },
      { user: user3Id, vet: staff1Id, pet: 'Lucky', title: 'Tư vấn viêm khớp ở chó Golden', desc: 'Lucky 5 tuổi đi lại chậm, hay nằm nhiều. Nghi ngờ viêm khớp.', type: 'online', status: 'active', fee: 150000 },
      { user: user5Id, vet: staff2Id, pet: 'Bún', title: 'Hỏi về lịch tiêm phòng cho chó con', desc: 'Bé Bún mới 1 tuổi, muốn hỏi lịch tiêm phòng đầy đủ.', type: 'online', status: 'scheduled', sched: '2026-03-05 10:00:00', fee: 0 },
    ];
    for (const c of consults) {
      await em.query(
        `INSERT INTO consultations (id, userId, vetId, petId, title, description, type, status, scheduledAt, fee, diagnosis, prescription, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [c.user, c.vet, petIds[c.pet], c.title, c.desc, c.type, c.status, c.sched || null, c.fee, c.diagnosis || null, c.prescription || null],
      );
    }
    console.log(`✅ Đã tạo ${consults.length} yêu cầu tư vấn\n`);

    // ==================== NOTIFICATIONS ====================
    console.log('🔔 Đang tạo thông báo...');
    const notifs = [
      { user: user1Id, title: 'Lịch hẹn đã được xác nhận', msg: 'Lịch hẹn tắm & sấy cho bé Bông vào 05/03/2026 lúc 09:00 đã được xác nhận.', type: 'appointment', priority: 'high', read: false },
      { user: user1Id, title: 'Đơn hàng đã giao thành công', msg: 'Đơn hàng ORD-20260201-001 đã được giao thành công. Cảm ơn bạn!', type: 'order', priority: 'medium', read: true },
      { user: user2Id, title: 'Mã giảm giá mới cho bạn', msg: 'Dùng mã GROOMING20 để giảm 20% dịch vụ grooming. Đến 30/04/2026!', type: 'promotion', priority: 'low', read: false },
      { user: user3Id, title: 'Đơn hàng đang vận chuyển', msg: 'Đơn ORD-20260220-003 đã giao cho vận chuyển. Mã vận đơn: VN123456789', type: 'order', priority: 'medium', read: false },
      { user: user5Id, title: 'Nhắc nhở lịch hẹn', msg: 'Bạn có lịch tiêm phòng cho bé Bún ngày 08/03/2026 lúc 09:00. Đừng quên!', type: 'appointment', priority: 'high', read: false },
      { user: user1Id, title: 'Chào mừng đến PetCareHub!', msg: 'Cảm ơn bạn đã đăng ký. Khám phá dịch vụ chăm sóc thú cưng tuyệt vời!', type: 'system', priority: 'low', read: true },
    ];
    for (const n of notifs) {
      await em.query(
        `INSERT INTO notifications (id, userId, title, message, type, priority, isRead, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [n.user, n.title, n.msg, n.type, n.priority, n.read],
      );
    }
    console.log(`✅ Đã tạo ${notifs.length} thông báo\n`);

    // ==================== SETTINGS ====================
    console.log('⚙️  Đang tạo cài đặt hệ thống...');
    await em.query(
      `INSERT INTO settings (id, businessName, businessAddress, businessPhone, businessEmail, currency, timezone, taxRate, description, createdAt, updatedAt)
       VALUES (UUID(), 'PetCareHub', '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh', '028 1234 5678', 'contact@petcarehub.vn', 'VND', 'Asia/Ho_Chi_Minh', 0, 'PetCareHub - Dịch vụ chăm sóc thú cưng toàn diện', NOW(), NOW())`,
    );
    const bh = [
      ['monday', '08:00', '20:00', false], ['tuesday', '08:00', '20:00', false],
      ['wednesday', '08:00', '20:00', false], ['thursday', '08:00', '20:00', false],
      ['friday', '08:00', '20:00', false], ['saturday', '08:00', '18:00', false],
      ['sunday', '09:00', '17:00', false],
    ];
    for (const [day, open, close, closed] of bh) {
      await em.query(
        `INSERT INTO business_hours (id, day, openTime, closeTime, isClosed, createdAt, updatedAt) VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())`,
        [day, open, close, closed],
      );
    }
    console.log('✅ Đã tạo cài đặt hệ thống\n');

    // ==================== SUMMARY ====================
    console.log('═══════════════════════════════════════════');
    console.log('🎉 SEED HOÀN TẤT!');
    console.log('═══════════════════════════════════════════');
    console.log('📊 Tổng kết:');
    console.log('   👤 9 người dùng (1 admin, 3 staff, 5 users)');
    console.log('   📂 19 danh mục');
    console.log('   🏥 12 dịch vụ');
    console.log('   🛒 15 sản phẩm + 9 biến thể');
    console.log('   🐾 10 thú cưng + 7 hồ sơ y tế');
    console.log('   📅 12 lịch hẹn');
    console.log('   📦 5 đơn hàng + 10 sản phẩm');
    console.log('   🏷️  5 mã giảm giá');
    console.log('   ⭐ 9 đánh giá');
    console.log('   📝 6 bài viết + 16 bình luận');
    console.log('   🎫 3 yêu cầu hỗ trợ');
    console.log('   🩺 3 yêu cầu tư vấn');
    console.log('   🔔 6 thông báo');
    console.log('');
    console.log('🔑 Đăng nhập (mật khẩu: 123456):');
    console.log('   Admin: admin@petcarehub.vn');
    console.log('   Staff: bacsi.minh@petcarehub.vn');
    console.log('   Staff: bacsi.lan@petcarehub.vn');
    console.log('   Staff: groomer.tuan@petcarehub.vn');
    console.log('   User:  nguyenvana@gmail.com');
    console.log('   User:  tranthib@gmail.com');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Lỗi khi seed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('❌ Seed thất bại:', error);
  process.exit(1);
});
