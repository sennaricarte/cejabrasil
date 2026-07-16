import sharp from 'sharp';
import { writeFileSync, unlinkSync } from 'fs';

const src = 'src/assets/ceja-brasil-logo.png';

// Above the wordmark: Brazil + continent only
const left = 215;
const top = 55;
const size = 145;

console.log('crop', { left, top, size });

const square = await sharp(src)
	.extract({ left, top, width: size, height: size })
	.resize(512, 512, { fit: 'cover' })
	.png()
	.toBuffer();

// Cover any leftover letter fragments in the bottom-right corner
const mask = Buffer.from(
	`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect x="300" y="400" width="220" height="120" fill="#000"/>
</svg>`
);

await sharp(square)
	.composite([{ input: mask, blend: 'over' }])
	.png()
	.toFile('public/favicon-512.png');

await sharp('public/favicon-512.png').resize(180, 180).png().toFile('public/apple-touch-icon.png');

const favicon32 = await sharp('public/favicon-512.png').resize(32, 32).png().toBuffer();
await sharp(favicon32).toFile('public/favicon.ico');

const png128 = await sharp('public/favicon-512.png').resize(128, 128).png().toBuffer();
writeFileSync(
	'public/favicon.svg',
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <image href="data:image/png;base64,${png128.toString('base64')}" width="128" height="128"/>
</svg>`
);

unlinkSync('public/favicon-512.png');
console.log('done: favicon.svg, favicon.ico, apple-touch-icon.png');
