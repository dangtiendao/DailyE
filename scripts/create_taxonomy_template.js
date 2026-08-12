const XLSX = require('xlsx');
const path = require('path');

const publicTemplatesDir = path.join(__dirname, '..', 'public', 'templates');

const topicsData = [
  {
    code: 'logistics',
    display_name: '🚚 Vận tải & Logistics',
    description: 'Chủ đề từ vựng chuyên ngành giao nhận vận tải hàng hóa và kho bãi',
    order_index: 10,
  },
  {
    code: 'education',
    display_name: '🎓 Giáo dục & Đào tạo',
    description: 'Từ vựng lĩnh vực trường học, khóa học và huấn luyện nhân sự',
    order_index: 11,
  },
  {
    code: 'office',
    display_name: '💼 Văn phòng & Họp hành (Cập nhật)',
    description: 'Cập nhật mô tả metadata thử nghiệm cho topic office có sẵn',
    order_index: 1,
  },
  {
    code: 'INVALID TOPIC CODE',
    display_name: '❌ Lỗi Code viết hoa có khoảng trắng',
    description: 'Dòng thử nghiệm lỗi validate code',
    order_index: 5,
  },
  {
    code: 'finance',
    display_name: '',
    description: 'Dòng thử nghiệm lỗi thiếu display_name',
    order_index: 6,
  },
];

const levelsData = [
  {
    code: '900+',
    display_name: '🏆 900+ Cao cấp xuất sắc',
    order_index: 9,
  },
  {
    code: 'INVALID_LEVEL_ERR',
    display_name: '❌ Level lỗi order_index âm',
    order_index: -5,
  },
];

const wb = XLSX.utils.book_new();
const wsTopics = XLSX.utils.json_to_sheet(topicsData);
const wsLevels = XLSX.utils.json_to_sheet(levelsData);

XLSX.utils.book_append_sheet(wb, wsTopics, 'topics');
XLSX.utils.book_append_sheet(wb, wsLevels, 'levels');

XLSX.writeFile(wb, path.join(publicTemplatesDir, 'dailye_taxonomy_template.xlsx'));
console.log('✅ Đã tạo file public/templates/dailye_taxonomy_template.xlsx thành công');
