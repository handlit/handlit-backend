import puppeteer from "puppeteer";
import {IMyCard} from "../models/MyCard";
import path from "path";
const ejs = require('ejs');

const QRCode = require('qrcode');

export async function getMyCardImage(myCard: IMyCard) {
    // EJS 템플릿 렌더링
    let cardHtml = ''
    try {
        const filePath = path.join(__dirname, '..', '..', 'views', 'myCard.html');
        cardHtml = await ejs.renderFile(filePath, {
            myCard: {
                name: myCard.name,
                email: myCard.email,
                company: myCard.company,
                title: myCard.title,
                description: myCard.description,
                imageBase64: myCard.faceImageBase64,
            }
        });
    } catch (e) {
        console.log(e);
    }

    const browser = await puppeteer.launch({ // Puppeteer용 브라우저 실행
        defaultViewport : {
            width: 240,
            height: 300
        }
        ,headless : 'new'
    });
    const page = await browser.newPage();
    await page.setContent(cardHtml);
    const screenshot = await page.screenshot({ encoding: 'binary' });

    await browser.close();

    return screenshot;
}
export async function generateCardQR(url: string) {
    try {
        const result = await QRCode.toBuffer(url); // 이 결과는 Data URL 형태로 반환됩니다. 이를 HTML img 태그 등에서 사용할 수 있습니다.
        return result
    } catch (err) {
        console.error(err);
        return null;
    }
}