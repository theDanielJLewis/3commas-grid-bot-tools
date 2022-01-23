import 'dotenv/config';
import CryptoJS from 'crypto-js';

export default function generateSignature(url) {
    var apiSecret = process.env.API_SECRET;
    var uri = url.replace('https://api.3commas.io','');
    var apiSig = CryptoJS.HmacSHA256(uri, apiSecret).toString();
    return apiSig;
}