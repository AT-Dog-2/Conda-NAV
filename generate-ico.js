const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

// 输入和输出路径
const inputPath = path.join(__dirname, 'build', 'icon.png');
const outputPath = path.join(__dirname, 'icon.ico');

// ICO 文件应该包含的尺寸（Windows 标准尺寸）
const sizes = [16, 32, 48, 64, 128, 256];

async function generateIco() {
  console.log('开始生成 ICO 文件...');

  if (!fs.existsSync(inputPath)) {
    console.error(`找不到源文件: ${inputPath}`);
    process.exit(1);
  }

  try {
    // 生成不同尺寸的 PNG 缓冲区
    const buffers = [];

    for (const size of sizes) {
      console.log(`生成 ${size}x${size} 尺寸...`);

      const buffer = await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
          kernel: 'lanczos3'
        })
        .png()
        .toBuffer();

      buffers.push(buffer);
    }

    // 将所有尺寸合并到 ICO 文件
    console.log('合并到 ICO 文件...');
    const icoBuffer = await toIco(buffers);

    // 写入文件
    fs.writeFileSync(outputPath, icoBuffer);
    console.log(`✓ ICO 文件已生成: ${outputPath}`);
    console.log(`  包含尺寸: ${sizes.join(', ')} px`);

  } catch (error) {
    console.error('生成 ICO 文件失败:', error);
    process.exit(1);
  }
}

generateIco();