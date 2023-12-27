import jimp from 'jimp';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import sharp from 'sharp';
import fetch from 'node-fetch';

const urlToBuffer = async (url) => {
    return new Promise(async (resolve, reject) => {
        await jimp.read(url, async (err, image) => {
            if (err) {
                console.log(`error reading image in jimp: ${err}`);
                reject(err);
            }
            image.resize(400, 400);
            return image.getBuffer(jimp.MIME_PNG, (err, buffer) => {
                if (err) {
                    console.log(`error converting image url to buffer: ${err}`);
                    reject(err);
                }
                resolve(buffer);
            });
        });
    });
};

async function convertWebPToPNG(url, outputFilename) {
  try {
    // Fetch the image from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.buffer();

    // Convert the image from WebP to PNG
    return await sharp(buffer)
      .toFormat('png').resize(400, 400).toBuffer();

    console.log(`Image converted and saved as ${outputFilename}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

const compareImage = async (
    google,
    amazon
) => {
    try {

        const image = await convertWebPToPNG(google, 'output_image.png');

        console.log('> Started comparing two images');
        //const img1Buffer = await urlToBuffer(twitterProfilePicURL);
        const img1Buffer = await urlToBuffer(image);
        const img2Buffer = await urlToBuffer(amazon);

        const img1 = PNG.sync.read(img1Buffer);
        const img2 = PNG.sync.read(img2Buffer);
        const { width, height } = img1;
        const diff = new PNG({ width, height });

        const difference = pixelmatch(
            img1.data,
            img2.data,
            diff.data,
            width,
            height,
            {
                threshold: 0.1,
            }
        );

        const compatibility = 100 - (difference * 100) / (width * height);
        console.log(`${difference} pixels differences`);
        console.log(`Compatibility: ${compatibility}%`);
        console.log('< Completed comparing two images');
        return compatibility;
    } catch (error) {
        console.log(`error comparing images: ${error}`);
        throw error;
    }
};


compareImage('https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQRBWV3vUdrWSVHPe5ODxDfg3wFstHRxyC54B4hEpQkvndZbk-o0p81K3Lilks8s8pm6lDGZrSMETpsP2M773Bkp0FX-js1ociPIfvu4tIzDYEZi8YGvr_u&usqp=CAE',
             'https://m.media-amazon.com/images/W/MEDIAX_792452-T2/images/I/71hVtLhOjUL._AC_SX679_.jpg'
)