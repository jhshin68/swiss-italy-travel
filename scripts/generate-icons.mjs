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
// 원본 SVG 주변에 여백을 주는 버전을 별도 생성한다.
const MASKABLE_PADDED_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="640" height="640">
  <rect width="640" height="640" fill="#C8552A"/>
  <g transform="translate(64,64)">
    <svg width="512" height="512" viewBox="0 0 512 512">
      <circle cx="256" cy="256" r="256" fill="#C8552A"/>
      <g transform="translate(256,256) rotate(-45)">
        <path d="M-20,-120 L20,-120 L20,0 L80,60 L80,80 L20,40 L20,100 L40,115 L40,130 L0,118 L-40,130 L-40,115 L-20,100 L-20,40 L-80,80 L-80,60 L-20,0 Z" fill="white"/>
      </g>
      <g transform="translate(380,380)">
        <rect x="-18" y="-6" width="36" height="12" rx="2" fill="rgba(255,255,255,0.6)"/>
        <rect x="-6" y="-18" width="12" height="36" rx="2" fill="rgba(255,255,255,0.6)"/>
      </g>
    </svg>
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
