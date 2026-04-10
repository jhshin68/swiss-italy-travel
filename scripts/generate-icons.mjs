// generate-icons.mjs — public/icons/icon.svg → PWA 필수 PNG 아이콘 변환
// 실행: node scripts/generate-icons.mjs
// 이유: Android Chrome "앱 설치" 프롬프트는 192/512 PNG 아이콘이 필수.
//       iOS Safari는 apple-touch-icon(180) 권장.
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = resolve(__dirname, '..', 'public', 'icons');
const SVG_PATH = resolve(ICONS_DIR, 'icon.svg');

// Android maskable 아이콘은 safe zone(약 80% 내부)이 필요하므로
// 원본 산 실루엣을 640×640 캔버스 중앙에 축소 배치해 여백을 확보한다.
// 배경은 브랜드 그라디언트로 가득 채워 어떤 마스크 모양(원/사각/티어드롭)에도 안전.
const MASKABLE_PADDED_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="640" height="640">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E89359"/>
      <stop offset="55%" stop-color="#D3662F"/>
      <stop offset="100%" stop-color="#B8471F"/>
    </linearGradient>
  </defs>
  <rect width="640" height="640" fill="url(#bg)"/>
  <g transform="translate(64,64)">
    <circle cx="150" cy="180" r="36" fill="#FEF9E7" opacity="0.95"/>
    <path d="M -10,430 L 80,290 L 150,350 L 220,270 L 290,340 L 360,255 L 430,320 L 522,430 L 522,522 L -10,522 Z"
          fill="#FEF9E7" opacity="0.3"/>
    <path d="M 55,445 L 225,170 L 258,115 L 278,148 L 308,120 L 328,190 L 460,445 Z"
          fill="#FEF9E7"/>
    <path d="M 258,115 L 278,148 L 265,175 L 245,140 Z"
          fill="#C8552A" opacity="0.22"/>
    <path d="M 308,120 L 328,190 L 310,200 L 298,155 Z"
          fill="#C8552A" opacity="0.15"/>
    <rect x="0" y="438" width="512" height="90" fill="#8A3415" opacity="0.35"/>
  </g>
</svg>
`;

async function main() {
  const svgBuffer = await readFile(SVG_PATH);

  const tasks = [
    { out: 'icon-192x192.png', size: 192, source: svgBuffer },
    { out: 'icon-512x512.png', size: 512, source: svgBuffer },
    { out: 'apple-touch-icon.png', size: 180, source: svgBuffer },
    { out: 'icon-maskable-512.png', size: 512, source: Buffer.from(MASKABLE_PADDED_SVG) },
  ];

  for (const task of tasks) {
    const buffer = await sharp(task.source, { density: 512 })
      .resize(task.size, task.size)
      .png({ compressionLevel: 9 })
      .toBuffer();
    await writeFile(resolve(ICONS_DIR, task.out), buffer);
    console.log(`  ✅ ${task.out} (${task.size}x${task.size}, ${buffer.length} bytes)`);
  }
}

main().catch((err) => {
  console.error('❌ 아이콘 생성 실패:', err);
  process.exit(1);
});
