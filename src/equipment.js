export const categories = [
  { id: 1, name: 'Audio/Visual', description: 'Projectors, cameras, microphones, speakers' },
  { id: 2, name: 'Computing', description: 'Laptops, tablets, peripherals' },
  { id: 3, name: 'Laboratory', description: 'Lab instruments and tools' },
  { id: 4, name: 'Sports', description: 'Sports and PE equipment' },
  { id: 5, name: 'Presentation', description: 'Whiteboards, pointers, display stands' }
];

export const equipment = [
  {
    id: 'AV-PRJ-001',
    categoryId: 1,
    category: 'Audio/Visual',
    name: 'LCD Projector',
    brand: 'Epson',
    model: 'EB-X06',
    description: 'Portable projector with HDMI and VGA',
    assetTag: 'AV-PRJ-001',
    condition: 'Good',
    quantity: 4,
    location: 'Property Office',
    college: 'College of Engineering',
    image: '/assets/images/COE/Projector.webp'
  },
  {
    id: 'CP-LAP-001',
    categoryId: 2,
    category: 'Computing',
    name: 'Laptop',
    brand: 'Lenovo',
    model: 'ThinkPad E14',
    description: '14-inch laptop for classroom use',
    assetTag: 'CP-LAP-001',
    condition: 'Good',
    quantity: 10,
    location: 'IT Room',
    college: 'College of Agriculture',
    image: '/assets/images/CA/Laptop.webp'
  },
  {
    id: 'AV-MIC-001',
    categoryId: 1,
    category: 'Audio/Visual',
    name: 'Wireless Microphone',
    brand: 'Shure',
    model: 'BLX24',
    description: 'Handheld wireless microphone set',
    assetTag: 'AV-MIC-001',
    condition: 'Good',
    quantity: 6,
    location: 'Property Office',
    college: 'College of Education',
    image: '/assets/images/CED/Speaker.webp'
  },
  {
    id: 'AV-CAM-001',
    categoryId: 1,
    category: 'Audio/Visual',
    name: 'DSLR Camera',
    brand: 'Canon',
    model: 'EOS 200D',
    description: 'Camera with 18-55mm lens and bag',
    assetTag: 'AV-CAM-001',
    condition: 'Good',
    quantity: 3,
    location: 'Media Room',
    college: 'College of Nursing',
    image: '/assets/images/CON/Camera.webp'
  },
  {
    id: 'SP-BAS-001',
    categoryId: 4,
    category: 'Sports',
    name: 'Basketball',
    brand: 'Molten',
    model: 'GG7X',
    description: 'Official size basketball',
    assetTag: 'SP-BAS-001',
    condition: 'Good',
    quantity: 12,
    location: 'Gym Storage',
    college: 'College of Agriculture',
    image: '/assets/images/CA/Wheelbarrow.jpg'
  },
  {
    id: 'LB-MUL-001',
    categoryId: 3,
    category: 'Laboratory',
    name: 'Digital Multimeter',
    brand: 'Fluke',
    model: '117',
    description: 'For electronics laboratory work',
    assetTag: 'LB-MUL-001',
    condition: 'New',
    quantity: 8,
    location: 'Electronics Lab',
    college: 'College of Agriculture',
    image: '/assets/images/CA/Digital Weighting Scale.jpg'
  },
  {
    id: 'LB-MIC-001',
    categoryId: 3,
    category: 'Laboratory',
    name: 'Microscope',
    brand: 'Olympus',
    model: 'CX23',
    description: 'Compound microscope',
    assetTag: 'LB-MIC-001',
    condition: 'Good',
    quantity: 6,
    location: 'Science Lab',
    college: 'College of Agriculture',
    image: '/assets/images/CA/soil ph meter.jpg'
  },
  {
    id: 'PR-WHT-001',
    categoryId: 5,
    category: 'Presentation',
    name: 'Portable Whiteboard',
    brand: 'Quartet',
    model: 'Easel 24x36',
    description: 'Foldable whiteboard with stand',
    assetTag: 'PR-WHT-001',
    condition: 'Fair',
    quantity: 4,
    location: 'Property Office',
    college: 'College of Architecture',
    image: '/assets/images/CArch/Drawing Board.png'
  },
  {
    id: 'CP-TAB-001',
    categoryId: 2,
    category: 'Computing',
    name: 'Tablet',
    brand: 'Samsung',
    model: 'Tab A8',
    description: '10-inch tablet',
    assetTag: 'CP-TAB-001',
    condition: 'Good',
    quantity: 5,
    location: 'IT Room',
    college: 'College of Architecture',
    image: '/assets/images/CArch/Cutting Mat.jpg'
  },
  {
    id: 'CP-PRS-001',
    categoryId: 2,
    category: 'Computing',
    name: 'Wireless Presenter',
    brand: 'Logitech',
    model: 'R400',
    description: 'Presentation remote with laser pointer',
    assetTag: 'CP-PRS-001',
    condition: 'Good',
    quantity: 7,
    location: 'IT Room',
    college: 'College of Architecture',
    image: '/assets/images/CArch/Architect Scale Ruler.webp'
  }
];

export const featuredIds = ['AV-PRJ-001', 'CP-LAP-001', 'AV-MIC-001', 'SP-BAS-001'];
export const categoryOptions = categories.map(cat => ({ value: cat.id, label: cat.name })).sort((a, b) => a.label.localeCompare(b.label));
export const locationOptions = [...new Set(equipment.map(item => item.location))].sort().map(loc => ({ value: loc, label: loc }));

export function accountMessage() { 
  window.alert('Please sign up or log in to continue. Login integration will be added later.'); 
}