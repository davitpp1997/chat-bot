import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';
import multer from 'multer';
import express from 'express';

const ai = new GoogleGenAI({});
const app = express();
const upload = multer();

const GEMINI_MODEL = "gemini-3.5-flash";

app.use(express.json());
app.use(express.static("public"));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

// 1. Definisikan struktur menu aplikasi Anda (bisa dari database atau file JSON config)
const appNavMenu = [
  { title: "Dashboard", path: "/dashboard", description: "Halaman utama dengan ringkasan statistik" },
  { 
    title: "Data Master", 
    children: [
      { title: "Data Santri", path: "/master/santri", description: "Mengelola data profil santri baru dan lama" },
      { title: "Data Guru", path: "/master/guru", description: "Mengelola data asatidz dan guru" }
    ]
  },
  {
    title: "Keuangan",
    children: [
      { title: "Pembayaran SPP", path: "/keuangan/spp", description: "Mencatat dan melihat tagihan bulanan" },
      { title: "Laporan Jurnal", path: "/keuangan/jurnal", description: "Melihat laporan akuntansi dan jurnal umum" }
    ]
  }
];

app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;

  try {
    if (!Array.isArray(conversation)) throw new Error('Messages must be an array!');

    let isValid = true;
    conversation.forEach(({ role, text }) => {
      if (!isValid) return;
      if (!['model', 'user'].includes(role)) isValid = false;
      if (!text || typeof text !== 'string') isValid = false;
    });

    if (!isValid) {
      return res.status(400).json({ message: "payload nggak valid gan!" });
    }

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    // 2. Buat instruksi sistem yang cerdas dengan menyertakan context menu
    const systemInstruction = `
      Anda adalah Asisten Virtual yang ramah untuk membantu pengguna menggunakan aplikasi ini.
      Jawab hanya menggunakan bahasa Indonesia.
      
      Berikut adalah struktur menu navigasi aplikasi ini:
      ${JSON.stringify(appNavMenu, null, 2)}
      
      Tugas utama Anda:
      1. Jika user bertanya cara melakukan sesuatu, arahkan mereka ke path/menu yang tepat berdasarkan struktur di atas.
      2. Berikan format jawaban yang jelas, contoh: "Silakan buka menu **Data Master > Data Santri** atau klik tautan ini: /master/santri".
      3. Jika user menanyakan fitur yang tidak ada di struktur menu, sampaikan dengan sopan bahwa fitur tersebut belum tersedia.
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: 0.3, // Turunkan sedikit agar jawaban bot lebih faktual dan tidak berhalusinasi soal menu
        systemInstruction: systemInstruction
      }
    });

    res.status(200).json({ result: response.text });

  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

